#!/usr/bin/env bash

# ① Real User Exception Matrix Sprint — 全新账号异常流 Playwright + 主链 UAT 复验

#

# 用法（仓库根）：

#   bash scripts/dev/record-real-user-exception-matrix-sprint-evidence.sh

#

# 前置：API 以 SEED_TEST_ACCOUNTS=0 启动；短 TTL 用于超时用例（P3_ACCEPT/PAYMENT_TTL_SECS=2）。

set -euo pipefail



ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"



EVID="$ROOT/frontend/evidence/GO_local_real_user_acceptance"

mkdir -p "$EVID"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

RUN_LOG="$EVID/REAL-USER-EXCEPTION-MATRIX-SPRINT-${STAMP}.log"

API_PORT="${API_PORT:-8080}"

API_BASE="${API_BASE:-http://127.0.0.1:${API_PORT}}"

export API_BASE

export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"

export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-0}"

export CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:3012,http://localhost:3012}"

export P3_ACCEPT_TTL_SECS="${P3_ACCEPT_TTL_SECS:-2}"

export P3_PAYMENT_TTL_SECS="${P3_PAYMENT_TTL_SECS:-2}"



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

  echo "record-real-user-exception-matrix: starting API (SEED_TEST_ACCOUNTS=${SEED_TEST_ACCOUNTS}, TTL=${P3_ACCEPT_TTL_SECS}/${P3_PAYMENT_TTL_SECS}s)…"

  (

    cd "$ROOT"

    export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"

    export PORT="$API_PORT"

    export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"

    export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"

    export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"

    exec cargo run -p traveltrust-api

  ) >"$EVID/.api-bg-ruexc-${STAMP}.log" 2>&1 &

  echo $! >"$EVID/.api-bg-ruexc-${STAMP}.pid"

}



cleanup_api_bg() {

  local pidfile="$EVID/.api-bg-ruexc-${STAMP}.pid"

  [[ -f "$pidfile" ]] || return 0

  local pid

  pid="$(cat "$pidfile")"

  kill "$pid" 2>/dev/null || true

  rm -f "$pidfile"

}



STARTED_API=0

if api_up; then

  echo "record-real-user-exception-matrix: restarting API on :${API_PORT} (no seed, short TTL)…"

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

  echo "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: START ${STAMP}"

  echo "phase: ① local only"

  echo "api: ${API_BASE}"

  echo "accounts: fresh @traveltrust.acceptance only (no seed / no trust-gate)"

  echo "SEED_TEST_ACCOUNTS=${SEED_TEST_ACCOUNTS}"

  echo "P3_ACCEPT_TTL_SECS=${P3_ACCEPT_TTL_SECS}"

  echo "P3_PAYMENT_TTL_SECS=${P3_PAYMENT_TTL_SECS}"

  echo "main_chain_frozen: REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md"



  echo ""

  echo "== Step A: vitest real user exception matrix contract =="

  cd "$ROOT/frontend"

  npx vitest run lib/escrow/realUserExceptionMatrixSprint.contract.test.ts



  echo ""

  echo "== Step B: Playwright real user exception matrix =="

  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"

  sleep 2

  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"

  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"

  export PLAYWRIGHT_API_PORT="$API_PORT"

  node ./scripts/run-e2e-default.mjs --project=chromium e2e/real-user-exception-matrix-sprint.spec.ts



  echo ""

  echo "== Step C: Playwright real user full chain UAT (frozen sprint re-run) =="

  export P3_ACCEPT_TTL_SECS=86400

  export P3_PAYMENT_TTL_SECS=1800

  echo "record-real-user-exception-matrix: restarting API for UAT (default TTL)…"

  kill_port "${API_PORT}"

  sleep 2

  start_api_bg

  STARTED_API=1

  PORT="$API_PORT" bash "$ROOT/scripts/dev/wait-for-api.sh"

  node ./scripts/run-e2e-default.mjs --project=chromium e2e/real-user-acceptance-sprint.spec.ts



  echo ""

  echo "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK ${STAMP}"

  echo "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_SUMMARY: exit=0 phase=① exception_matrix+uat_replay"

} 2>&1 | tee "$RUN_LOG"



grep -q "TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK" "$RUN_LOG" || {

  echo "FAIL: missing evidence OK marker" >&2

  exit 1

}



echo "Evidence log: $RUN_LOG"

exit 0

