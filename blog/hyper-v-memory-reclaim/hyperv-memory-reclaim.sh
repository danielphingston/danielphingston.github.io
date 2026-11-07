#!/bin/bash

# Run inside a Hyper-V VM: let Hyper-V Dynamic Memory take back RAM the VM isn't using.
#
# The Linux Hyper-V balloon driver reports Committed_AS (reserved address space) as the VM's memory demand.
# With our service stack that is ~20GB while ~4GB is actually used, so Hyper-V never shrinks the VM.
# This builds and loads a small kernel module (hv_demand) that reports real use instead
# (MemTotal - MemAvailable + a cushion). Only the figure sent to Hyper-V changes; /proc/meminfo and
# overcommit are untouched. Hyper-V then reclaims spare memory after a few minutes and gives it back
# (up to the VM's maximum) when the VM needs it.
#
# Needs Dynamic Memory on the VM with startup below maximum (if startup = maximum, Hyper-V never shrinks it).
#
# Usage: sudo ./hyperv-memory-reclaim.sh [command] [options]
#   install        (default) build, load now, and load again on every boot after a delay
#     --no-boot      load now only; don't add the boot timer
#     --no-load      build and add the boot timer; don't load now
#     --cushion MB   MB reported on top of real use (default 1024; higher keeps more page cache)
#     --delay MIN    minutes after boot before loading (default 10, so startup gets the full maximum)
#     --count-swap   also report swap in use, so Hyper-V stops shrinking the VM once it starts swapping
#     --no-count-swap  report real use only (default; the VM settles smaller but may push idle memory to swap)
#   status         show the module, the Hyper-V balloon and the boot timer
#   load           load now with the saved settings, building for the running kernel if needed
#   unload         unload now; Hyper-V goes back to the stock behaviour (boot timer unchanged)
#   uninstall      unload, remove the boot timer and all installed files

# DISCLAIMER: Most of this script and the kernel module were written with Claude, an AI assistant,
# and were tested on one VM only (Ubuntu 22.04, kernel 6.8.0-1063-azure, Windows 11 Hyper-V).
# It runs as root and loads unsigned code into the running kernel; a bug can crash or hang the VM.
# Read it before running it, take a checkpoint first, and don't use it on production systems.
# Provided "as is", without warranty of any kind. You use it entirely at your own risk; the author
# accepts no liability for any damage, data loss, downtime or other issue arising from its use.

set -e

MODULE="hv_demand"
INSTALL_DIR="/opt/hv-demand"
SRC_DIR="${INSTALL_DIR}/src"
BUILD_ROOT="${INSTALL_DIR}/build"
CONF="/etc/hv-demand.conf"
SELF="/usr/local/sbin/hyperv-memory-reclaim"
UNIT="hv-demand"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

usage() {
    sed -n '3,25p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
}

info() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
die()  { echo -e "${RED}$*${NC}" >&2; exit 1; }

# ---------------------------------------------------------------------------------------------------------
# Settings

CUSHION_MB=1024
BOOT_DELAY_MIN=10
COUNT_SWAP=0
[ -f "$CONF" ] && source "$CONF"

save_conf() {
    cat > "$CONF" <<EOF
# Written by hyperv-memory-reclaim. Re-run 'hyperv-memory-reclaim install [options]' to change.
CUSHION_MB=${CUSHION_MB}
BOOT_DELAY_MIN=${BOOT_DELAY_MIN}
COUNT_SWAP=${COUNT_SWAP}
EOF
}

swap_total_kb() {
    awk '/^SwapTotal:/ {print $2}' /proc/meminfo
}

# ---------------------------------------------------------------------------------------------------------
# Checks

require_root() {
    [ "$(id -u)" -eq 0 ] || die "Run as root (sudo $0 $*)"
}

check_platform() {
    [ -d /sys/bus/vmbus/drivers/hv_balloon ] \
        || die "No Hyper-V balloon driver (hv_balloon). This only works in a Hyper-V VM with Dynamic Memory."
    grep -qw post_status /proc/kallsyms && grep -qw vm_memory_committed /proc/kallsyms \
        || die "This kernel's hv_balloon has no post_status()/vm_memory_committed(); the module can't hook it."
    grep -q '\[none\]' /sys/kernel/security/lockdown 2>/dev/null || [ ! -f /sys/kernel/security/lockdown ] \
        || die "Kernel lockdown is on (usually Secure Boot), which blocks unsigned modules. Turn off Secure Boot for this VM."
    [ "$(cat /proc/sys/kernel/modules_disabled 2>/dev/null)" != "1" ] \
        || die "Module loading is disabled (kernel.modules_disabled=1)."
}

is_loaded() {
    grep -q "^${MODULE} " /proc/modules
}

# ---------------------------------------------------------------------------------------------------------
# Build

# Only replaces a file whose contents changed, so an unchanged source doesn't trigger a rebuild
put_file() {
    if ! cmp -s "$1.new" "$1"; then mv -f "$1.new" "$1"; else rm -f "$1.new"; fi
}

write_source() {
    mkdir -p "$SRC_DIR"
    cat > "${SRC_DIR}/Makefile.new" <<'EOF'
obj-m := hv_demand.o
EOF
    put_file "${SRC_DIR}/Makefile"
    cat > "${SRC_DIR}/hv_demand.c.new" <<'EOF'
// SPDX-License-Identifier: GPL-2.0
/*
 * hv_demand - make the Hyper-V balloon driver report real memory use as demand.
 *
 * hv_balloon's post_status() tells the host how much memory the guest needs using
 * vm_memory_committed() (Committed_AS). On Linux that is reserved address space, which
 * for ClickHouse/Go/JVM/Node workloads is far above what is actually used, so Hyper-V
 * Dynamic Memory never takes memory back.
 *
 * This module swaps the Committed_AS term, only when called from post_status(), for
 * (MemTotal - MemAvailable + cushion_mb). The driver still adds ballooned pages,
 * not-yet-onlined hot-added pages and its balloon floor on top, as before.
 * Nothing else that reads Committed_AS (/proc/meminfo, overcommit) is affected.
 *
 * Runtime knobs (/sys/module/hv_demand/parameters/):
 *   enabled        1 = report real use, 0 = pass through the original value
 *   cushion_mb     extra MB added to the reported use (headroom for page cache)
 *   count_swap     1 = also report swap in use, so memory pushed out to swap still counts
 *                  as demand and Hyper-V stops squeezing once the guest starts swapping
 *   swap_total_kb  SwapTotal from /proc/meminfo (total_swap_pages isn't exported to modules)
 * rmmod restores the stock behaviour.
 */
#include <linux/module.h>
#include <linux/kprobes.h>
#include <linux/mm.h>
#include <linux/sched.h>
#include <linux/swap.h>
#include <linux/atomic.h>

static int enabled = 1;
module_param(enabled, int, 0644);
MODULE_PARM_DESC(enabled, "1 = report real memory use to Hyper-V, 0 = original Committed_AS");

static unsigned int cushion_mb = 1024;
module_param(cushion_mb, uint, 0644);
MODULE_PARM_DESC(cushion_mb, "MB added to the reported use (default 1024)");

static int count_swap;
module_param(count_swap, int, 0644);
MODULE_PARM_DESC(count_swap, "1 = also report swap in use as demand (needs swap_total_kb)");

static unsigned long swap_total_kb;
module_param(swap_total_kb, ulong, 0644);
MODULE_PARM_DESC(swap_total_kb, "SwapTotal in kB from /proc/meminfo, set by the install script");

/* Task currently inside post_status(), or NULL. */
static struct task_struct *ps_task;

static int ps_entry(struct kretprobe_instance *ri, struct pt_regs *regs)
{
	cmpxchg(&ps_task, NULL, current);
	return 0;
}

static int ps_return(struct kretprobe_instance *ri, struct pt_regs *regs)
{
	cmpxchg(&ps_task, current, NULL);
	return 0;
}

static int vmc_return(struct kretprobe_instance *ri, struct pt_regs *regs)
{
	long total, avail, used;

	if (!READ_ONCE(enabled) || READ_ONCE(ps_task) != current)
		return 0;

	total = (long)totalram_pages();
	avail = si_mem_available();
	used = total - avail;
	if (used < 0)
		used = 0;
	used += (long)READ_ONCE(cushion_mb) << (20 - PAGE_SHIFT);

	if (READ_ONCE(count_swap)) {
		long swap_used = (long)(READ_ONCE(swap_total_kb) >> (PAGE_SHIFT - 10)) -
				 atomic_long_read(&nr_swap_pages);
		if (swap_used > 0)
			used += swap_used;
	}

	regs_set_return_value(regs, (unsigned long)used);
	return 0;
}

static struct kretprobe ps_probe = {
	.kp.symbol_name = "post_status",
	.entry_handler  = ps_entry,
	.handler        = ps_return,
	.maxactive      = 8,
};

static struct kretprobe vmc_probe = {
	.kp.symbol_name = "vm_memory_committed",
	.handler        = vmc_return,
	.maxactive      = 64,
};

static int __init hv_demand_init(void)
{
	int ret;

	ret = register_kretprobe(&vmc_probe);
	if (ret) {
		pr_err("hv_demand: probe on vm_memory_committed failed: %d\n", ret);
		return ret;
	}
	ret = register_kretprobe(&ps_probe);
	if (ret) {
		pr_err("hv_demand: probe on post_status failed: %d\n", ret);
		unregister_kretprobe(&vmc_probe);
		return ret;
	}
	pr_info("hv_demand: reporting MemTotal-MemAvailable+%uMB%s to Hyper-V\n", cushion_mb,
		count_swap ? "+swap used" : "");
	return 0;
}

static void __exit hv_demand_exit(void)
{
	unregister_kretprobe(&ps_probe);
	unregister_kretprobe(&vmc_probe);
	pr_info("hv_demand: unloaded, missed ps=%d vmc=%d\n", ps_probe.nmissed, vmc_probe.nmissed);
}

module_init(hv_demand_init);
module_exit(hv_demand_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Report real memory use (not Committed_AS) to Hyper-V Dynamic Memory");
EOF
    put_file "${SRC_DIR}/hv_demand.c"
}

ensure_toolchain() {
    local kver="$1" pkgs=()
    command -v make >/dev/null && command -v gcc >/dev/null || pkgs+=(build-essential)
    [ -d "/lib/modules/${kver}/build" ] || pkgs+=("linux-headers-${kver}")
    [ ${#pkgs[@]} -eq 0 ] && return 0
    command -v apt-get >/dev/null || die "Missing ${pkgs[*]} and no apt-get to install them."
    info "Installing ${pkgs[*]}..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y -q "${pkgs[@]}" \
        || die "Couldn't install ${pkgs[*]}. Install them, then run: $SELF load"
}

# Builds once per kernel version, so a kernel update gets a fresh build on the next load.
build_module() {
    local kver out
    kver="$(uname -r)"
    out="${BUILD_ROOT}/${kver}"
    if [ -f "${out}/${MODULE}.ko" ] && [ "${out}/${MODULE}.ko" -nt "${SRC_DIR}/hv_demand.c" ]; then
        return 0
    fi
    ensure_toolchain "$kver"
    info "Building ${MODULE} for ${kver}..."
    rm -rf "$out"
    mkdir -p "$out"
    cp "${SRC_DIR}/Makefile" "${SRC_DIR}/hv_demand.c" "$out/"
    make -s -C "/lib/modules/${kver}/build" M="$out" modules >"${out}/build.log" 2>&1 \
        || { cat "${out}/build.log" >&2; die "Build failed (log: ${out}/build.log)"; }
}

# ---------------------------------------------------------------------------------------------------------
# Load / unload

describe() {
    local swap="real use only"
    [ "$COUNT_SWAP" = "1" ] && swap="swap in use counted"
    echo "cushion ${CUSHION_MB} MB, ${swap}"
}

load_module() {
    local ko
    build_module
    ko="${BUILD_ROOT}/$(uname -r)/${MODULE}.ko"
    if is_loaded; then
        if [ "$(modinfo -F srcversion "$ko")" = "$(cat "/sys/module/${MODULE}/srcversion" 2>/dev/null)" ]; then
            echo "$CUSHION_MB" > "/sys/module/${MODULE}/parameters/cushion_mb"
            swap_total_kb > "/sys/module/${MODULE}/parameters/swap_total_kb"
            echo "$COUNT_SWAP" > "/sys/module/${MODULE}/parameters/count_swap"
            echo 1 > "/sys/module/${MODULE}/parameters/enabled"
            info "${MODULE} already loaded; settings applied ($(describe))."
            return 0
        fi
        info "Loaded ${MODULE} is an older build; reloading it."
        rmmod "$MODULE"
    fi
    insmod "$ko" cushion_mb="$CUSHION_MB" count_swap="$COUNT_SWAP" swap_total_kb="$(swap_total_kb)"
    info "${MODULE} loaded ($(describe)). Hyper-V usually starts reclaiming within ~5 minutes."
}

unload_module() {
    if is_loaded; then
        rmmod "$MODULE"
        info "${MODULE} unloaded; Hyper-V sees Committed_AS again."
    else
        echo "${MODULE} isn't loaded."
    fi
}

# ---------------------------------------------------------------------------------------------------------
# Boot timer

install_boot() {
    cat > "/etc/systemd/system/${UNIT}.service" <<EOF
[Unit]
Description=Report real memory use to Hyper-V Dynamic Memory (${MODULE})

[Service]
Type=oneshot
ExecStart=${SELF} load
EOF
    cat > "/etc/systemd/system/${UNIT}.timer" <<EOF
[Unit]
Description=Load ${MODULE} ${BOOT_DELAY_MIN} min after boot, once startup has had the full memory maximum

[Timer]
OnBootSec=${BOOT_DELAY_MIN}min
AccuracySec=30s

[Install]
WantedBy=timers.target
EOF
    systemctl daemon-reload
    # enable without --now: starting a timer whose OnBootSec has passed would fire it immediately
    systemctl enable "${UNIT}.timer" >/dev/null 2>&1
    info "Boot timer enabled: loads ${MODULE} ${BOOT_DELAY_MIN} min after each boot."
}

remove_boot() {
    systemctl disable --now "${UNIT}.timer" >/dev/null 2>&1 || true
    rm -f "/etc/systemd/system/${UNIT}.service" "/etc/systemd/system/${UNIT}.timer"
    systemctl daemon-reload
}

# ---------------------------------------------------------------------------------------------------------
# Commands

cmd_install() {
    local boot=1 load=1
    while [ $# -gt 0 ]; do
        case "$1" in
            --no-boot) boot=0 ;;
            --no-load) load=0 ;;
            --cushion) shift; [[ "$1" =~ ^[0-9]+$ ]] || die "--cushion needs a number of MB"; CUSHION_MB="$1" ;;
            --delay)   shift; [[ "$1" =~ ^[0-9]+$ ]] || die "--delay needs a number of minutes"; BOOT_DELAY_MIN="$1" ;;
            --count-swap)    COUNT_SWAP=1 ;;
            --no-count-swap) COUNT_SWAP=0 ;;
            *) usage ;;
        esac
        shift
    done

    check_platform
    # keep an installed copy so the boot timer works even if this file moves
    if [ "$(readlink -f "$0")" != "$SELF" ]; then
        install -m 755 "$0" "$SELF"
    fi
    save_conf
    write_source
    build_module
    [ "$load" -eq 1 ] && load_module
    if [ "$boot" -eq 1 ]; then
        install_boot
    else
        remove_boot
        warn "No boot timer: ${MODULE} won't be loaded after a restart."
    fi
    echo "Check progress with: $SELF status"
}

cmd_status() {
    local kver
    kver="$(uname -r)"
    echo "Kernel:        ${kver}"
    if is_loaded; then
        local p="/sys/module/${MODULE}/parameters"
        echo -e "Module:        ${GREEN}loaded${NC} (enabled=$(cat $p/enabled)," \
            "cushion=$(cat $p/cushion_mb) MB, count_swap=$(cat $p/count_swap 2>/dev/null || echo n/a))"
    else
        echo -e "Module:        ${YELLOW}not loaded${NC}"
    fi
    if [ -f "${BUILD_ROOT}/${kver}/${MODULE}.ko" ]; then
        echo "Built:         yes, for this kernel"
    else
        echo "Built:         no, for this kernel (built on next load)"
    fi
    if systemctl is-enabled "${UNIT}.timer" >/dev/null 2>&1; then
        echo "Boot timer:    enabled, ${BOOT_DELAY_MIN} min after boot" \
            "(last run: $(systemctl show -p LastTriggerUSec --value "${UNIT}.timer"), result: $(systemctl show -p Result --value "${UNIT}.service"))"
    else
        echo "Boot timer:    not enabled"
    fi
    if [ -r /sys/kernel/debug/hv-balloon ]; then
        local ballooned
        ballooned=$(awk -F: '/pages_ballooned/ {gsub(/ /,"",$2); print $2}' /sys/kernel/debug/hv-balloon)
        echo "Given back:    $(( ballooned * 4 / 1024 )) MB returned to Hyper-V (balloon)"
    fi
    echo
    free -m | head -2
}

cmd_uninstall() {
    unload_module
    remove_boot
    rm -rf "$INSTALL_DIR" "$CONF" "$SELF"
    info "Removed. Hyper-V sees Committed_AS again."
}

COMMAND="${1:-install}"
[ $# -gt 0 ] && shift

case "$COMMAND" in
    install)    require_root; cmd_install "$@" ;;
    status)     require_root; cmd_status ;;
    load)       require_root; check_platform; [ -f "${SRC_DIR}/hv_demand.c" ] || write_source; load_module ;;
    unload)     require_root; unload_module ;;
    uninstall)  require_root; cmd_uninstall ;;
    --no-boot|--no-load|--cushion|--delay|--count-swap|--no-count-swap) require_root; cmd_install "$COMMAND" "$@" ;;
    -h|--help|help) usage ;;
    *) usage ;;
esac
