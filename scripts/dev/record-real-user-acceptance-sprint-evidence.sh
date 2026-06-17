#!/usr/bin/env bash
# ① Real User Acceptance Sprint — 全新注册游客+向导全链 Playwright 证据
#
# 用法（仓库根）：
#   bash scripts/dev/record-real-user-acceptance-sprint-evidence.sh
#
# 禁止 seed / trust-gate 账号；API 以 SEED_TEST_ACCOUNTS=0 + CORS_ORIGINS 启动。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_real_user_acceptance"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/REAL-USER-ACCEPTANCE-SPRINT-${STAMP}.log"
API_PORT="${API_PORT:-8080}"
API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"
export API_BASE
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-0}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:3012,http://localhost:3012}"

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

start_api_bg() {
  echo "record-real-user-acceptance-sprint: starting API (SEED_TEST_ACCOUNTS=${SEED_TEST_ACCOUNTS})…"
  (
    cd "$ROOT"
    export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
    export PORT="$API_PORT"
    export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
    export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
    export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
    exec cargo run -p traveltrust-api
  ) >"$EVID/.api-bg-rua-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-rua-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-rua-${STAMP}.pid"
  [[ -f "$pidfile" ]] || return 0
  local pid
  pid="$(cat "$pidfile")"
  kill "$pid" 2>/dev/null || true
  rm -f "$pidfile"
}

STARTED_API=0
if api_up; then
  echo "record-real-user-acceptance-sprint: restarting API on :${API_PORT} (no seed)…"
  kill_port "${API_PORT}"
  sleep 2
fi
if ! api_up; then
  start_api_bg
  STARTED_API=1
  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"
fi

trap '[[ "$STARTED_API" == "1" ]] && cleanup_api_bg' EXIT

{
  echo "TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "api: ${API_BASE}"
  echo "accounts: fresh register only (no seed / no trust-gate)"
  echo "SEED_TEST_ACCOUNTS=${SEED_TEST_ACCOUNTS}"

  echo ""
  echo "== Step A: vitest real user acceptance contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/escrow/realUserAcceptanceSprint.contract.test.ts

  echo ""
  echo "== Step B: Playwright real user full chain =="
  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"
  sleep 2
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/real-user-acceptance-sprint.spec.ts

  echo ""
  echo "TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK ${STAMP}"
  echo "TT_REAL_USER_ACCEPTANCE_SPRINT_SUMMARY: exit=0 phase=① fresh_accounts full_ui_chain"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_REAL_USER_ACCEPTANCE_SPRINT_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
