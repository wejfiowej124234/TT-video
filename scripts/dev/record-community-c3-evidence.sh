#!/usr/bin/env bash
# C3 证据：社区审核全链 · moderation IT + staging E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C3"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/moderation-it-${STAMP}.log"
E2E_LOG="$EVID/staging-moderation-e2e-${STAMP}.log"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_BASE

{
  echo "TT_COMMUNITY_C3_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"

  echo "--- moderation IT (cargo test matrix_93_d_com_c3_*) ---"
  cargo test -p traveltrust-api matrix_93_d_com_c3_ 2>&1 | tee "$IT_LOG"
  grep -q "test result: ok" "$IT_LOG" || { echo "FAIL: moderation IT"; exit 1; }

  echo "--- staging moderation E2E ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c3-staging-moderation.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C3_STAGING_MODERATION: OK" "$E2E_LOG" || { echo "FAIL: staging E2E"; exit 1; }

  echo "TT_COMMUNITY_C3_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-moderation-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-moderation-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$IT_LOG" "$EVID/moderation-it.log"
cp -f "$E2E_LOG" "$EVID/staging-moderation-e2e.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C3 (moderation flow)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "moderation_it: $(basename "$IT_LOG")"
  echo "staging_moderation_e2e: $(basename "$E2E_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C3 slot PASS only — NOT Phase ② GO / NOT C4-C12 GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
