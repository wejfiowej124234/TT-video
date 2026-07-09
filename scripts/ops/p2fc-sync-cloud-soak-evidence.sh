#!/usr/bin/env bash
# 从 Fly 云端 Soak Watcher 回传证据至本地 evidence/（只读 · 不 deploy staging）
#
#   bash scripts/ops/p2fc-sync-cloud-soak-evidence.sh
#
# 末行: TT_P2FC_CLOUD_SOAK_SYNC: PASS|SKIP|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=lib/fly-soak-observe-lib.sh
source "$ROOT/scripts/ops/lib/fly-soak-observe-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
META="$SOAK_DIR/CLOUD-WATCHER.json"

fly_soak_observe_env

fail() { echo "TT_P2FC_CLOUD_SOAK_SYNC: FAIL $*" >&2; exit 2; }

[[ -f "$META" ]] || { echo "TT_P2FC_CLOUD_SOAK_SYNC: SKIP no CLOUD-WATCHER.json"; exit 0; }

APP="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fly_app)" "$META")"
CLOUD_JOB="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).cloud_job_dir)" "$META")"
[[ -d "$CLOUD_JOB" ]] || fail "missing cloud_job_dir $CLOUD_JOB"

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SYNC_LOG="$SOAK_DIR/cloud-sync/${STAMP}.log"
mkdir -p "$SOAK_DIR/cloud-sync" "$(dirname "$SYNC_LOG")"

# status.json + soak.log（Fly API 走 HTTPS_PROXY · Windows SSH handle 容错 · 见 fly-soak-observe-lib.sh）
: >"$SOAK_DIR/cloud-sync/last-ssh.err"
fly_read_soak_status "$APP" "$CLOUD_JOB/status.remote.json" "$SOAK_DIR/cloud-sync/last-ssh.err" \
  || fail "cannot read cloud status — set HTTPS_PROXY and run observe-cloud-soak-readonly.sh --preflight"

fly_ssh_cat "$APP" "/data/soak/job/soak.log" "$CLOUD_JOB/soak.log.remote" "$SOAK_DIR/cloud-sync/last-ssh.err" \
  || true

if [[ -s "$CLOUD_JOB/soak.log.remote" ]]; then
  cp -f "$CLOUD_JOB/soak.log.remote" "$CLOUD_JOB/soak.log"
fi

# COMPLETED / FAIL
if ! fly_ssh_cat_json_optional "$APP" "/data/soak/COMPLETED.json" "$SOAK_DIR/COMPLETED.json" "$SOAK_DIR/cloud-sync/last-ssh.err"; then
  rm -f "$SOAK_DIR/COMPLETED.json" 2>/dev/null || true
fi

fly_ssh_cat_json_optional "$APP" "/data/soak/FAIL.json" "$SOAK_DIR/FAIL.json" "$SOAK_DIR/cloud-sync/last-ssh.err" \
  || rm -f "$SOAK_DIR/FAIL.json" 2>/dev/null || true

node -e "
const fs=require('fs');
const status=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const out={
  schema:'traveltrust.p2fc_cloud_soak_sync.v1',
  synced_at_utc:new Date().toISOString(),
  fly_app:process.argv[2],
  ok_polls:status.ok_polls,
  fail_polls:status.fail_polls,
  expect_git_sha:status.expect_git_sha,
  remaining_sec:status.remaining_sec,
  executor:'cloud'
};
fs.writeFileSync(process.argv[3], JSON.stringify(out,null,2)+'\n');
" "$CLOUD_JOB/status.remote.json" "$APP" "$SOAK_DIR/cloud-sync/latest.json" 2>/dev/null || true

echo "TT_P2FC_CLOUD_SOAK_SYNC: PASS app=$APP ok_polls=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).ok_polls)" "$CLOUD_JOB/status.remote.json" 2>/dev/null || echo '?')"
exit 0
