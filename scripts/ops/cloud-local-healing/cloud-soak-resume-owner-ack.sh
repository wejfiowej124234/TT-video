#!/usr/bin/env bash
# Owner 确认后恢复 / 重新开始 72h 云端 Soak
#
#   CLOUD_SOAK_OWNER_ACK=1 bash scripts/ops/cloud-local-healing/cloud-soak-resume-owner-ack.sh --resume
#   CLOUD_SOAK_OWNER_ACK=1 bash scripts/ops/cloud-local-healing/cloud-soak-resume-owner-ack.sh --restart-72h
#
# 末行: TT_CLOUD_SOAK_RESUME: PASS
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
APP="${FLY_SOAK_WATCHER_APP:-tt-soak-watcher-staging}"
PAUSED="$SOAK_DIR/SOAK-PAUSED.json"
STREAK="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/issue-report-streak.json"
MODE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resume) MODE=resume; shift ;;
    --restart-72h) MODE=restart; shift ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ "${CLOUD_SOAK_OWNER_ACK:-}" == "1" ]] || {
  echo "TT_CLOUD_SOAK_RESUME: BLOCKED set CLOUD_SOAK_OWNER_ACK=1 (Owner manual confirm)" >&2
  exit 3
}
[[ -n "$MODE" ]] || { echo "TT_CLOUD_SOAK_RESUME: FAIL use --resume or --restart-72h" >&2; exit 2; }

command -v fly >/dev/null 2>&1 || { echo "TT_CLOUD_SOAK_RESUME: FAIL fly CLI missing" >&2; exit 2; }

MID="$(fly machine list -a "$APP" --json 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{process.stdout.write(JSON.parse(s)[0].id||'');}catch{}
});" 2>/dev/null || true)"

if [[ "$MODE" == "restart" ]]; then
  fly secrets set -a "$APP" P2FC_SOAK_HANDOFF_OK_POLLS=0 2>/dev/null || true
  echo "  restart-72h: handoff ok_polls reset to 0"
else
  ok=0
  if [[ -f "$PAUSED" ]]; then
    ok="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).handoff_ok_polls_at_pause||0)" "$PAUSED" 2>/dev/null || echo 0)"
  fi
  fly secrets set -a "$APP" "P2FC_SOAK_HANDOFF_OK_POLLS=$ok" 2>/dev/null || true
  echo "  resume: handoff ok_polls=$ok"
fi

[[ -n "$MID" ]] && fly machine start "$MID" -a "$APP" 2>/dev/null || true

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCH="$SOAK_DIR/soak-pause-archived-${STAMP}"
mkdir -p "$ARCH"
[[ -f "$PAUSED" ]] && mv "$PAUSED" "$ARCH/" 2>/dev/null || true

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.cloud_layer_issue_streak.v1',
  consecutive_report_count:0,
  last_verdict:'CLEAR',
  paused:false,
  reset_at_utc:new Date().toISOString(),
  reset_by:'owner_ack_resume'
},null,2)+'\n');
" "$STREAK"

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.cloud_soak_resume.v1',
  resumed_at_utc:new Date().toISOString(),
  mode:process.argv[2],
  owner_ack:true
},null,2)+'\n');
" "$SOAK_DIR/cloud-resume-${STAMP}.json" "$MODE"

echo "TT_CLOUD_SOAK_RESUME: PASS mode=$MODE"
exit 0
