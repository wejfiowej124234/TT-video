#!/usr/bin/env bash
# L1 · Cloud Layer — 从 Soak / parity / SHA 检测 Issue 并写入 ISSUE-REPORT.json
#
#   bash scripts/ops/cloud-local-healing/cloud-detect-and-report.sh
#
# 末行: TT_CLOUD_LAYER_ISSUE: REPORT|CLEAR
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
EVID_ROOT="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/issues"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$EVID_ROOT/$STAMP"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
EXPECT_SHA="${P2FC_SOAK_EXPECT_GIT_SHA:-3bbedda776b2cf2666efaac055ce9e13d98127b7}"

STREAK_FILE="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/issue-report-streak.json"
STREAK_ABORT="${P2FC_CLOUD_ISSUE_REPORT_STREAK_ABORT:-3}"
PAUSED_FLAG="$SOAK_DIR/SOAK-PAUSED.json"

if [[ -f "$PAUSED_FLAG" ]]; then
  echo "TT_CLOUD_SOAK_PAUSE: ACTIVE evidence=$PAUSED_FLAG (Owner ack required before resume)"
  exit 4
fi

mkdir -p "$OUT"
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-staging-probe-lib.sh"

issues=()

_add_issue() {
  issues+=("$1")
}

if [[ -f "$SOAK_DIR/CLOUD-WATCHER.json" && "${P2FC_SKIP_CLOUD_SYNC:-0}" != "1" ]]; then
  bash "$ROOT/scripts/ops/p2fc-sync-cloud-soak-evidence.sh" >/dev/null 2>&1 || true
  CLOUD_JOB="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).cloud_job_dir)" "$SOAK_DIR/CLOUD-WATCHER.json" 2>/dev/null || echo "")"
  if [[ -n "$CLOUD_JOB" && -f "$CLOUD_JOB/status.remote.json" ]]; then
    fp="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fail_polls||0)" "$CLOUD_JOB/status.remote.json")"
    ok="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).ok_polls||0)" "$CLOUD_JOB/status.remote.json")"
    [[ "$fp" -gt 0 ]] && _add_issue "{\"id\":\"SOAK-FAIL-POLLS\",\"severity\":\"critical\",\"detail\":\"fail_polls=$fp ok_polls=$ok\"}"
  fi
fi

live_sha="$(p2fc_probe_git_sha "$API")"
hc="$(p2fc_probe_health_code "$API")"
if [[ -n "$EXPECT_SHA" && -n "$live_sha" && "${live_sha,,}" != "${EXPECT_SHA,,}" ]]; then
  _add_issue "{\"id\":\"SHA-DRIFT\",\"severity\":\"critical\",\"detail\":\"expect=${EXPECT_SHA:0:12} live=${live_sha:0:12}\"}"
fi
[[ "$hc" != "200" ]] && _add_issue "{\"id\":\"HEALTH-NON-200\",\"severity\":\"high\",\"detail\":\"health=$hc\"}"

chain_id="$(p2fc_probe_chain_id "$API")"
[[ -n "$chain_id" && "$chain_id" != "11155111" ]] && _add_issue "{\"id\":\"CHAIN-DRIFT\",\"severity\":\"high\",\"detail\":\"chain_id=$chain_id\"}"

ISSUES_JSON="[]"
if [[ ${#issues[@]} -gt 0 ]]; then
  ISSUES_JSON="$(printf '%s\n' "${issues[@]}" | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  const rows=s.trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  process.stdout.write(JSON.stringify(rows));
});")"
fi

node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.cloud_layer_issue_report.v1',
  detected_at_utc:new Date().toISOString(),
  stamp:process.argv[1],
  phase:'②',
  executor:'cloud_soak_watcher',
  expect_git_sha:process.argv[2],
  live_git_sha:process.argv[3]||null,
  health_code:process.argv[4],
  issues:JSON.parse(process.argv[5]),
  next_layer:'AI Fix Engine — FIX-PROPOSAL.json',
  policy:'detect_only_no_staging_deploy'
};
fs.writeFileSync(process.argv[6], JSON.stringify(payload,null,2)+'\n');
fs.writeFileSync(process.argv[7], JSON.stringify(payload,null,2)+'\n');
" "$STAMP" "$EXPECT_SHA" "$live_sha" "$hc" "$ISSUES_JSON" "$OUT/ISSUE-REPORT.json" "$EVID_ROOT/ISSUE-REPORT.latest.json"

count="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).issues.length)" "$OUT/ISSUE-REPORT.json")"

_update_streak_and_maybe_pause() {
  local verdict="$1"
  node -e "
const fs=require('fs');
const streakPath=process.argv[1];
const issues=JSON.parse(process.argv[2]);
const abort=Number(process.argv[3]);
let streak={schema:'traveltrust.cloud_layer_issue_streak.v1',consecutive_report_count:0,last_verdict:'CLEAR',paused:false};
try{streak={...streak,...JSON.parse(fs.readFileSync(streakPath,'utf8'))};}catch{}
if(process.argv[4]==='CLEAR'){
  streak.consecutive_report_count=0;
  streak.last_verdict='CLEAR';
}else{
  streak.consecutive_report_count=(streak.consecutive_report_count||0)+1;
  streak.last_verdict='REPORT';
}
streak.updated_at_utc=new Date().toISOString();
const p0=issues.some(i=>i.severity==='critical');
streak.last_p0=p0;
streak.streak_abort_threshold=abort;
streak.escalate=p0||streak.consecutive_report_count>=abort;
fs.writeFileSync(streakPath, JSON.stringify(streak,null,2)+'\n');
process.stdout.write(JSON.stringify({escalate:streak.escalate,p0,streak:streak.consecutive_report_count}));
" "$STREAK_FILE" "$ISSUES_JSON" "$STREAK_ABORT" "$verdict"
}

if [[ "$count" -gt 0 ]]; then
  esc="$( _update_streak_and_maybe_pause REPORT )"
  echo "TT_CLOUD_LAYER_ISSUE: REPORT count=$count streak=$(node -e "console.log(JSON.parse(process.argv[1]).streak)" "$esc") evidence=$OUT"
  if node -e "process.exit(JSON.parse(process.argv[1]).escalate?0:1)" "$esc" 2>/dev/null; then
    reason="consecutive_report>=${STREAK_ABORT} or P0 critical"
    p0_ids="$(node -e "JSON.parse(process.argv[1]).filter(i=>i.severity==='critical').map(i=>i.id).join(',')" "$ISSUES_JSON" 2>/dev/null || true)"
    [[ -n "$p0_ids" ]] && reason="P0(${p0_ids})"
    bash "$ROOT/scripts/ops/cloud-local-healing/cloud-soak-pause-on-escalation.sh" --reason "$reason"
    echo "TT_CLOUD_LAYER_ISSUE: REPORT → SOAK_PAUSED (Owner ack required)"
    exit 3
  fi
  exit 2
fi

_update_streak_and_maybe_pause CLEAR >/dev/null
echo "TT_CLOUD_LAYER_ISSUE: CLEAR evidence=$OUT"
exit 0
