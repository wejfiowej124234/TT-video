#!/usr/bin/env bash
# 短暂启动 tt-soak-watcher-staging · 只读拉取卷上 COMPLETED/status（不 redeploy staging）
#
#   export HTTPS_PROXY=http://127.0.0.1:15715
#   bash scripts/ops/p2fc-read-cloud-soak-volume-evidence.sh
#
# 流程：machine sleep 保活 → SSH cat → 恢复 ./entrypoint.sh → 写本地 evidence
# 末行: TT_P2FC_READ_CLOUD_SOAK_VOLUME: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/fly-soak-observe-lib.sh
source "$ROOT/scripts/ops/lib/fly-soak-observe-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
APP="${FLY_SOAK_WATCHER_APP:-tt-soak-watcher-staging}"
MID="${FLY_SOAK_WATCHER_MACHINE_ID:-78465d9ae2e948}"
META="$SOAK_DIR/CLOUD-WATCHER.json"
CLOUD_JOB="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).cloud_job_dir)}catch{}" "$META" 2>/dev/null || true)"
[[ -n "$CLOUD_JOB" ]] || CLOUD_JOB="$SOAK_DIR/job-CLOUD-20260626T002943Z"
mkdir -p "$CLOUD_JOB" "$SOAK_DIR/cloud-sync"

fly_soak_observe_env

fail() { echo "TT_P2FC_READ_CLOUD_SOAK_VOLUME: FAIL $*" >&2; exit 2; }

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"

restore_entrypoint() {
  export MSYS_NO_PATHCONV=1
  fly machine update "$MID" -a "$APP" --yes --skip-start --skip-health-checks \
    --entrypoint "" --command "./entrypoint.sh" >/dev/null 2>&1 || true
}

trap restore_entrypoint EXIT

echo "== read cloud soak volume (readonly) =="
export MSYS_NO_PATHCONV=1
fly machine update "$MID" -a "$APP" --yes --skip-start --skip-health-checks \
  --entrypoint "sleep" --command "600" \
  || fail "machine update sleep (fly API)"

fly machine start "$MID" -a "$APP" || fail "machine start"
sleep "${P2FC_SOAK_VOLUME_READ_WAIT_SEC:-15}"

: >"$SOAK_DIR/cloud-sync/volume-read.err"
fly_ssh_cat "$APP" "/data/soak/COMPLETED.json" "$SOAK_DIR/COMPLETED.json" "$SOAK_DIR/cloud-sync/volume-read.err" \
  || fail "COMPLETED.json not on volume (see cloud-sync/volume-read.err)"

fly_ssh_cat "$APP" "/data/soak/status.json" "$CLOUD_JOB/status.remote.json" "$SOAK_DIR/cloud-sync/volume-read.err" \
  || fail "status.json read failed"

fp="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fail_polls??'?')" "$SOAK_DIR/COMPLETED.json")"
ok="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).ok_polls??'?')" "$SOAK_DIR/COMPLETED.json")"
[[ "$fp" == "0" ]] || fail "fail_polls=$fp (required 0)"

echo "TT_P2FC_READ_CLOUD_SOAK_VOLUME: PASS ok_polls=$ok fail_polls=$fp completed=$SOAK_DIR/COMPLETED.json"
exit 0
