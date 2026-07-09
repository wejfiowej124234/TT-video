#!/usr/bin/env bash
# L5 · Cloud Re-check — Soak 继续 + 确认 fix / zero drift
#
#   bash scripts/ops/cloud-local-healing/cloud-recheck.sh
#   bash scripts/ops/cloud-local-healing/cloud-recheck.sh --issue SHA-DRIFT
#
# 末行: TT_CLOUD_RECHECK: PASS|FAIL|INFLIGHT
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/rechecks/$STAMP"
ISSUE="${1:-}"
[[ "$ISSUE" == "--issue" ]] && ISSUE="${2:-}"

mkdir -p "$EVID"

bash "$ROOT/scripts/ops/p2fc-sync-cloud-soak-evidence.sh" >>"$EVID/sync.log" 2>&1 || true
detect_line="$(bash "$ROOT/scripts/ops/cloud-local-healing/cloud-detect-and-report.sh" 2>&1 | tee "$EVID/detect.log" | tail -1 || true)"
soak_line="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>&1 | tee "$EVID/soak-attest.log" | tail -1 || true)"

verdict=INFLIGHT
if echo "$detect_line" | grep -q "TT_CLOUD_LAYER_ISSUE: CLEAR"; then
  if echo "$soak_line" | grep -q "INFLIGHT.*fail_polls=0"; then
    verdict=PASS
  elif echo "$soak_line" | grep -q "GO|"; then
    verdict=PASS
  fi
elif echo "$detect_line" | grep -q "TT_CLOUD_LAYER_ISSUE: REPORT"; then
  verdict=FAIL
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.cloud_recheck_result.v1',
  rechecked_at_utc:new Date().toISOString(),
  issue_filter:process.argv[2]||null,
  detect_line:process.argv[3],
  soak_line:process.argv[4],
  verdict:process.argv[5],
  soak_continues:true,
  phase3_note:'Recheck PASS does not grant Production GO'
},null,2)+'\n');
" "$EVID/RECHECK-RESULT.json" "$ISSUE" "$detect_line" "$soak_line" "$verdict"

echo "TT_CLOUD_RECHECK: $verdict evidence=$EVID"
[[ "$verdict" == "PASS" ]] && exit 0
[[ "$verdict" == "INFLIGHT" ]] && exit 2
exit 2
