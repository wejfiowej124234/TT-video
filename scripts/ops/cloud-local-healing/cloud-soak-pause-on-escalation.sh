#!/usr/bin/env bash
# 连续 REPORT / P0 异常 → 自动暂停云端 Soak · 须 Owner 确认后恢复
#
#   bash scripts/ops/cloud-local-healing/cloud-soak-pause-on-escalation.sh --reason "..."
#
# 末行: TT_CLOUD_SOAK_PAUSE: ACTIVE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
APP="${FLY_SOAK_WATCHER_APP:-tt-soak-watcher-staging}"
PAUSED="$SOAK_DIR/SOAK-PAUSED.json"
REASON="${1:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reason) REASON="$2"; shift 2 ;;
    *) shift ;;
  esac
done

[[ -n "$REASON" ]] || REASON="cloud_layer_escalation"

if [[ -f "$PAUSED" ]]; then
  echo "TT_CLOUD_SOAK_PAUSE: ACTIVE already ($PAUSED)"
  cat "$PAUSED"
  exit 0
fi

MID="$(fly machine list -a "$APP" --json 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{const rows=JSON.parse(s);process.stdout.write((rows[0]&&rows[0].id)||'');}catch{}
});" 2>/dev/null || true)"

if [[ -n "$MID" ]]; then
  fly machine stop "$MID" -a "$APP" 2>/dev/null || true
fi

HANDOFF_OK=0
if [[ -f "$SOAK_DIR/CLOUD-WATCHER.json" ]]; then
  HANDOFF_OK="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).handoff_ok_polls||0)" "$SOAK_DIR/CLOUD-WATCHER.json" 2>/dev/null || echo 0)"
fi

node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.cloud_soak_pause.v1',
  paused_at_utc:new Date().toISOString(),
  stamp:process.argv[1],
  reason:process.argv[2],
  fly_app:process.argv[3],
  machine_id:process.argv[4]||null,
  handoff_ok_polls_at_pause:Number(process.argv[5]),
  policy:'owner_ack_required_before_resume',
  restart_options:['resume_from_handoff','restart_fresh_72h'],
  honest_boundary:'Pause does not grant Production GO'
};
fs.writeFileSync(process.argv[6], JSON.stringify(payload,null,2)+'\n');
fs.writeFileSync(process.argv[7], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$REASON" "$APP" "$MID" "$HANDOFF_OK" "$PAUSED" "$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/SOAK-PAUSE.latest.json"

echo "TT_CLOUD_SOAK_PAUSE: ACTIVE reason=${REASON}"
echo "  resume: CLOUD_SOAK_OWNER_ACK=1 bash scripts/ops/cloud-local-healing/cloud-soak-resume-owner-ack.sh --resume"
echo "  restart 72h: CLOUD_SOAK_OWNER_ACK=1 bash scripts/ops/cloud-local-healing/cloud-soak-resume-owner-ack.sh --restart-72h"
exit 0
