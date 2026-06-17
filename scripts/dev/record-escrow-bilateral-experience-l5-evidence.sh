#!/usr/bin/env bash
# ① Escrow 双边确认体验 L5 双角色浏览器证据：vitest 绿集 + Playwright
#
# 用法（仓库根）：
#   bash scripts/dev/record-escrow-bilateral-experience-l5-evidence.sh
#
# 可选：API 已起时设 PLAYWRIGHT_REUSE_API_SERVER=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_web3_itinerary_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/ESCROW-BILATERAL-EXPERIENCE-L5-${STAMP}.log"
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
  echo "record-escrow-bilateral-experience-l5: starting API (P3_CHAIN_OFF=${P3_CHAIN_OFF})…"
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
  ) >"$EVID/.api-bg-bilateral-l5-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-bilateral-l5-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-bilateral-l5-${STAMP}.pid"
  [[ -f "$pidfile" ]] || return 0
  local pid
  pid="$(cat "$pidfile")"
  kill "$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

STARTED_API=0
if api_up && [[ "${TRAVELTRUST_EVIDENCE_REUSE_API:-0}" != "1" ]]; then
  echo "record-escrow-bilateral-experience-l5: restarting API on :${API_PORT} (API_RATE_LIMIT_PER_MINUTE=0)…"
  kill_api_on_port
fi
if ! api_up; then
  start_api_bg
  STARTED_API=1
  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"
fi

trap '[[ "$STARTED_API" == "1" ]] && cleanup_api_bg' EXIT

{
  echo "TT_ESCROW_BILATERAL_EXPERIENCE_L5_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "api: ${API_BASE}"
  echo "chain: tourist+guide seed (guide@test.com)"

  echo ""
  echo "== Step A: vitest bilateral experience L5 contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/escrow/bilateralExperienceL5.contract.test.ts

  echo ""
  echo "== Step B: Playwright dual-role bilateral experience =="
  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"
  sleep 2
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/escrow-bilateral-experience-l5.spec.ts

  echo ""
  echo "TT_ESCROW_BILATERAL_EXPERIENCE_L5_EVIDENCE: OK ${STAMP}"
  echo "TT_ESCROW_BILATERAL_EXPERIENCE_L5_SUMMARY: exit=0 phase=① vitest+playwright dual_role_bilateral_ui"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_ESCROW_BILATERAL_EXPERIENCE_L5_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
