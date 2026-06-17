#!/usr/bin/env bash
# C2 证据：社区上传安全 · security IT + staging upload E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C2"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
SEC_LOG="$EVID/security-it-${STAMP}.log"
E2E_LOG="$EVID/staging-upload-e2e-${STAMP}.log"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_BASE

{
  echo "TT_COMMUNITY_C2_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"

  echo "--- security IT (cargo test matrix_93_d_com_c2_*) ---"
  cargo test -p traveltrust-api matrix_93_d_com_c2_ 2>&1 | tee "$SEC_LOG"
  cargo test -p traveltrust-api media_upload_parse_tests 2>&1 | tee -a "$SEC_LOG"
  cargo test -p traveltrust-api community_post_media_filename_tests 2>&1 | tee -a "$SEC_LOG"
  cargo test -p traveltrust-api object_key_tests 2>&1 | tee -a "$SEC_LOG"
  grep -c "test result: ok" "$SEC_LOG" | grep -qE '^[4-9]' || { echo "FAIL: security IT"; exit 1; }

  echo "--- staging upload E2E ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c2-staging-upload.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C2_STAGING_UPLOAD: OK" "$E2E_LOG" || { echo "FAIL: staging E2E"; exit 1; }

  echo "TT_COMMUNITY_C2_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$SEC_LOG")" "$EVID/latest-security-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-upload-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$SEC_LOG" "$EVID/security-it.log"
cp -f "$E2E_LOG" "$EVID/staging-upload-e2e.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C2 (upload security)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "security_it: $(basename "$SEC_LOG")"
  echo "staging_upload_e2e: $(basename "$E2E_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C2 slot PASS only — NOT Phase ② GO / NOT C3-C12 GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
