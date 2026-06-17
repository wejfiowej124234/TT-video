#!/usr/bin/env bash
# ① itinerary-first 主链验收证据：API 烟测 + vitest + Playwright 浏览器步
#
# 用法（仓库根）：
#   bash scripts/dev/record-itinerary-first-main-chain-evidence.sh
#
# 可选：API 已起时设 PLAYWRIGHT_REUSE_API_SERVER=1；全栈由 Playwright 起则 PLAYWRIGHT_FULL_STACK=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_web3_itinerary_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/ITINERARY-FIRST-MAIN-CHAIN-${STAMP}.log"
API_PORT="${API_PORT:-8080}"
API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"
export API_BASE
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"

api_up() {
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "${API_BASE}/health" 2>/dev/null || echo "000")"
  [[ "$code" == "200" ]]
}

start_api_bg() {
  echo "record-itinerary-first: starting API (P3_CHAIN_OFF=${P3_CHAIN_OFF})…"
  (
    cd "$ROOT"
    export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
    export PORT="$API_PORT"
    export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
    export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
    export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
    export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
    export DID_RANK_SEED_MARKET_DEMO="${DID_RANK_SEED_MARKET_DEMO:-1}"
    exec cargo run -p traveltrust-api
  ) >"$EVID/.api-bg-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-${STAMP}.pid"
  [[ -f "$pidfile" ]] || return 0
  local pid
  pid="$(cat "$pidfile")"
  kill "$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

STARTED_API=0
if ! api_up; then
  start_api_bg
  STARTED_API=1
  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"
fi

trap '[[ "$STARTED_API" == "1" ]] && cleanup_api_bg' EXIT

{
  echo "TT_ITINERARY_FIRST_MAIN_CHAIN_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "api: ${API_BASE}"

  echo ""
  echo "== Step A: API smoke (smoke-web3-itinerary-full-chain-local) =="
  bash "$ROOT/scripts/dev/smoke-web3-itinerary-full-chain-local.sh"

  echo ""
  echo "== Step B: vitest (OrderFlowSteps + escrow experience contract) =="
  cd "$ROOT/frontend"
  npx vitest run \
    components/escrow/OrderFlowSteps.test.tsx \
    lib/escrowExperienceUi.contract.test.ts

  echo ""
  echo "== Step C: Playwright itinerary-first main chain acceptance =="
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/itinerary-first-main-chain-acceptance.spec.ts

  echo ""
  echo "TT_ITINERARY_FIRST_MAIN_CHAIN_EVIDENCE: OK ${STAMP}"
  echo "TT_ITINERARY_FIRST_MAIN_CHAIN_SUMMARY: exit=0 phase=① api_smoke+vitest+playwright"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_ITINERARY_FIRST_MAIN_CHAIN_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
