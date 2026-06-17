#!/usr/bin/env bash
# ① P05/P06 主链接入验收证据：vitest 绿集 + Playwright itinerary-first P05/P06
#
# 用法（仓库根）：
#   bash scripts/dev/record-escrow-p05-p06-main-chain-evidence.sh
#
# 可选：API 已起时设 TRAVELTRUST_EVIDENCE_REUSE_API=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_web3_itinerary_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/ESCROW-P05-P06-MAIN-CHAIN-${STAMP}.log"
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

kill_port() {
  local port="$1"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }
    " 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

kill_api_on_port() {
  kill_port "${API_PORT}"
  sleep 2
}

start_api_bg() {
  echo "record-escrow-p05-p06: starting API (P3_CHAIN_OFF=${P3_CHAIN_OFF})…"
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
  ) >"$EVID/.api-bg-p05p06-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-p05p06-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-p05p06-${STAMP}.pid"
  [[ -f "$pidfile" ]] || return 0
  local pid
  pid="$(cat "$pidfile")"
  kill "$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

STARTED_API=0
if api_up && [[ "${TRAVELTRUST_EVIDENCE_REUSE_API:-0}" != "1" ]]; then
  echo "record-escrow-p05-p06: restarting API on :${API_PORT} (API_RATE_LIMIT_PER_MINUTE=0)…"
  kill_api_on_port
fi
if ! api_up; then
  start_api_bg
  STARTED_API=1
  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"
fi

trap '[[ "$STARTED_API" == "1" ]] && cleanup_api_bg' EXIT

{
  echo "TT_ESCROW_P05_P06_MAIN_CHAIN_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "api: ${API_BASE}"

  echo ""
  echo "== Step A: Web3 itinerary L5 green set =="
  bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"

  echo ""
  echo "== Step B: vitest P03/P04 unit (regression) =="
  cd "$ROOT/frontend"
  npx vitest run lib/escrowExperienceP03P04.test.ts lib/escrowDraftFlow.test.ts

  echo ""
  echo "== Step C: Playwright P05/P06 itinerary-first escrow =="
  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"
  sleep 2
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/escrow-p05-p06-itinerary-first.spec.ts

  echo ""
  echo "TT_ESCROW_P05_P06_MAIN_CHAIN_EVIDENCE: OK ${STAMP}"
  echo "TT_ESCROW_P05_P06_MAIN_CHAIN_SUMMARY: exit=0 phase=① green_set+vitest+playwright"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_ESCROW_P05_P06_MAIN_CHAIN_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
