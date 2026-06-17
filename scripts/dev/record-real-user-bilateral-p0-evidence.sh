#!/usr/bin/env bash
# REAL-USER-BILATERAL-P0 — 隔离双边确认 UI + API 证据（① local）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_real_user_acceptance"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/REAL-USER-BILATERAL-P0-${STAMP}.log"
API_PORT="${API_PORT:-8080}"
export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
export PLAYWRIGHT_API_PORT="$API_PORT"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-0}"

{
  echo "TT_REAL_USER_BILATERAL_P0_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  cd "$ROOT/frontend"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/real-user-bilateral-p0.spec.ts
  echo "TT_REAL_USER_BILATERAL_P0_EVIDENCE: OK ${STAMP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_REAL_USER_BILATERAL_P0_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing bilateral P0 OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
