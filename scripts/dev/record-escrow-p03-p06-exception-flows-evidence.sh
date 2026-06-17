#!/usr/bin/env bash
# ① P03–P06 异常流验收证据（冲突预约 · 重复付款 · 幂等 · version_conflict · 鉴权门闸）
#
# 用法（仓库根）：
#   bash scripts/dev/record-escrow-p03-p06-exception-flows-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_web3_itinerary_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/ESCROW-P03-P06-EXCEPTION-FLOWS-${STAMP}.log"
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
  echo "record-escrow-p03-p06-exceptions: starting API (P3_CHAIN_OFF=${P3_CHAIN_OFF})…"
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
  ) >"$EVID/.api-bg-p03p06-exc-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-p03p06-exc-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-p03p06-exc-${STAMP}.pid"
  [[ -f "$pidfile" ]] || return 0
  local pid
  pid="$(cat "$pidfile")"
  kill "$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    # shellcheck source=scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh
    source "$ROOT/scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh"
    clear_hangzhou_seed_guide_slots_db || true
  fi
fi

STARTED_API=0
if api_up && [[ "${TRAVELTRUST_EVIDENCE_REUSE_API:-0}" != "1" ]]; then
  echo "record-escrow-p03-p06-exceptions: restarting API on :${API_PORT} (API_RATE_LIMIT_PER_MINUTE=0)…"
  kill_api_on_port
fi
if ! api_up; then
  start_api_bg
  STARTED_API=1
  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"
fi

trap '[[ "$STARTED_API" == "1" ]] && cleanup_api_bg' EXIT

{
  echo "TT_ESCROW_P03_P06_EXCEPTION_FLOWS_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "api: ${API_BASE}"
  echo "main_chain_frozen: ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE.md"

  echo ""
  echo "== Step A: Web3 itinerary L5 green set (regression) =="
  bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"

  echo ""
  echo "== Step B: Playwright P03–P06 exception flows =="
  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"
  sleep 2
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  cd "$ROOT/frontend"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/escrow-p03-p06-exception-flows.spec.ts

  echo ""
  echo "TT_ESCROW_P03_P06_EXCEPTION_FLOWS_EVIDENCE: OK ${STAMP}"
  echo "TT_ESCROW_P03_P06_EXCEPTION_FLOWS_SUMMARY: exit=0 phase=① playwright+green_set"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_ESCROW_P03_P06_EXCEPTION_FLOWS_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
