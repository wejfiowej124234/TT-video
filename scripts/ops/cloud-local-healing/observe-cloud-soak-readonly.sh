#!/usr/bin/env bash
# 态 A · 只读观测链路：本地 → Fly → 云端 Soak Watcher（不 Fix/Deploy/GATE）
#
#   bash scripts/ops/cloud-local-healing/observe-cloud-soak-readonly.sh
#   bash scripts/ops/cloud-local-healing/observe-cloud-soak-readonly.sh --preflight
#
# 环境：HTTPS_PROXY / HTTP_PROXY（默认 http://127.0.0.1:15715 · 与 testnet sync 同源）
# 末行: TT_CLOUD_SOAK_OBSERVE: PASS|INFLIGHT|COMPLETED|BLOCKED|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
# shellcheck source=../lib/fly-soak-observe-lib.sh
source "$ROOT/scripts/ops/lib/fly-soak-observe-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
APP="${FLY_SOAK_WATCHER_APP:-tt-soak-watcher-staging}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$SOAK_DIR/cloud-observe/$STAMP"
PREFLIGHT=0

fly_soak_observe_env

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preflight) PREFLIGHT=1; shift ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
fail() { echo "TT_CLOUD_SOAK_OBSERVE: FAIL $*" >&2; exit 2; }
blocked() { echo "TT_CLOUD_SOAK_OBSERVE: BLOCKED $*" >&2; exit 3; }

echo "== Cloud Soak Observe · $STAMP =="
echo "  proxy=${HTTPS_PROXY:-none}"
echo "  policy: readonly_no_fix_deploy_gate"

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"

if ! fly auth whoami >"$EVID/fly-whoami.txt" 2>&1; then
  blocked "fly auth — check HTTPS_PROXY and fly auth login"
fi

fly_status_ok=0
for _fs_attempt in 1 2 3; do
  if fly status -a "$APP" >"$EVID/fly-status.txt" 2>&1; then
    fly_status_ok=1
    break
  fi
  sleep $((_fs_attempt * 2))
done
if [[ "$fly_status_ok" != "1" ]]; then
  echo "  warn: fly status unavailable (attempt 3) — continuing with ssh read; see $EVID/fly-status.txt"
fi

grep -E "started|passing" "$EVID/fly-status.txt" >/dev/null 2>&1 || \
  echo "  warn: machine may not be started/passing — see $EVID/fly-status.txt"

if [[ "$PREFLIGHT" == "1" ]]; then
  echo "TT_CLOUD_SOAK_OBSERVE: PASS mode=preflight proxy_ok=1"
  exit 0
fi

[[ -f "$SOAK_DIR/SOAK-PAUSED.json" ]] && blocked "SOAK-PAUSED active — Owner ack required (not an observe fix)"

: >"$EVID/fly-ssh.err"
fly_read_soak_status "$APP" "$EVID/status.json" "$EVID/fly-ssh.err" \
  || blocked "cannot read cloud status (fly ssh or proxy /health) — see $EVID/fly-ssh.err"

COMPLETED_REMOTE=""
if fly_ssh_cat_json_optional "$APP" "/data/soak/COMPLETED.json" "$EVID/COMPLETED.remote.json" "$EVID/fly-ssh.err"; then
  cp -f "$EVID/COMPLETED.remote.json" "$SOAK_DIR/COMPLETED.json"
  COMPLETED_REMOTE=yes
else
  echo "  COMPLETED.json: not present (Soak still INFLIGHT)"
fi

# 回写本地 cloud job 镜像（attest / detect 消费）
if ! bash "$ROOT/scripts/ops/p2fc-sync-cloud-soak-evidence.sh" >"$EVID/sync.log" 2>&1; then
  echo "  warn: sync script partial — status.json captured in $EVID"
fi

CLOUD_JOB="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).cloud_job_dir)}catch{}" "$SOAK_DIR/CLOUD-WATCHER.json" 2>/dev/null || true)"
if [[ -n "$CLOUD_JOB" && -f "$EVID/status.json" ]]; then
  mkdir -p "$CLOUD_JOB"
  cp -f "$EVID/status.json" "$CLOUD_JOB/status.remote.json"
fi

detect_line="$(P2FC_SKIP_CLOUD_SYNC=1 bash "$ROOT/scripts/ops/cloud-local-healing/cloud-detect-and-report.sh" 2>&1 | tee "$EVID/detect.log" | tail -1 || true)"

ok_polls="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).ok_polls)" "$EVID/status.json")"
fail_polls="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fail_polls)" "$EVID/status.json")"
remaining="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).remaining_sec)" "$EVID/status.json")"
expect_sha="$(node -e "console.log((JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).expect_git_sha||'').slice(0,12))" "$EVID/status.json")"

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.cloud_soak_observe.v1',
  observed_at_utc:new Date().toISOString(),
  stamp:process.argv[2],
  fly_app:process.argv[3],
  ok_polls:Number(process.argv[4]),
  fail_polls:Number(process.argv[5]),
  remaining_sec:Number(process.argv[6]),
  expect_git_sha:process.argv[7],
  completed_remote:process.argv[8]==='yes',
  detect_line:process.argv[9],
  policy:'state_a_readonly'
},null,2)+'\n');
" "$EVID/OBSERVE-REPORT.json" "$STAMP" "$APP" "$ok_polls" "$fail_polls" "$remaining" "$expect_sha" "$COMPLETED_REMOTE" "$detect_line"

cp -f "$EVID/OBSERVE-REPORT.json" "$SOAK_DIR/cloud-observe/latest.json" 2>/dev/null || true

if [[ -n "$COMPLETED_REMOTE" && "$fail_polls" == "0" ]]; then
  echo "TT_CLOUD_SOAK_OBSERVE: COMPLETED ok_polls=$ok_polls fail_polls=$fail_polls evidence=$EVID"
  exit 0
fi

if echo "$detect_line" | grep -q "TT_CLOUD_LAYER_ISSUE: REPORT"; then
  echo "TT_CLOUD_SOAK_OBSERVE: BLOCKED issue=REPORT — Owner FIX-PROPOSAL path only (no auto fix)"
  echo "  detect: $detect_line"
  exit 3
fi

echo "TT_CLOUD_SOAK_OBSERVE: INFLIGHT ok_polls=$ok_polls fail_polls=$fail_polls remaining_sec=$remaining sha=$expect_sha evidence=$EVID"
echo "  detect: ${detect_line:-CLEAR}"
exit 0
