#!/usr/bin/env bash
# ① itinerary-date-as-source 冻结 · 本地最终回归证据
#
# 用法（仓库根）：
#   bash scripts/dev/record-itinerary-date-as-source-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_web3_itinerary_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/ITINERARY-DATE-AS-SOURCE-${STAMP}.log"
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

start_api_bg() {
  echo "record-itinerary-date-as-source: starting API (P3_CHAIN_OFF=${P3_CHAIN_OFF})…"
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
  ) >"$EVID/.api-bg-ids-${STAMP}.log" 2>&1 &
  echo $! >"$EVID/.api-bg-ids-${STAMP}.pid"
}

cleanup_api_bg() {
  local pidfile="$EVID/.api-bg-ids-${STAMP}.pid"
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
  echo "record-itinerary-date-as-source: restarting API on :${API_PORT}…"
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
  echo "TT_ITINERARY_DATE_AS_SOURCE_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  echo "freeze: frontend/evidence/GO_local_web3_itinerary_l5/ITINERARY-DATE-AS-SOURCE-PHASE1-FREEZE.md"

  echo ""
  echo "== Step A: Web3 itinerary L5 green set =="
  bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"

  echo ""
  echo "== Step B: itinerary-date-as-source contract + unit =="
  cd "$ROOT/frontend"
  npx vitest run \
    "lib/l5/itineraryDateAsSource.contract.test.ts" \
    "lib/guideBookingDates.test.ts" \
    "lib/guidesAvailableForTrip.test.ts" \
    "lib/bookGuideItineraryPicker.test.ts" \
    "app/guides/[id]/guideDetailPageL5.contract.test.ts" \
    "lib/ordersGuideDeepLink.test.ts" \
    "components/market/BookGuideModal.test.tsx"

  echo ""
  echo "== Step C: Playwright itinerary-date-as-source corridor =="
  kill_port "${PLAYWRIGHT_WEB_PORT:-3012}"
  sleep 2
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="$API_PORT"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/itinerary-date-as-source-corridor.spec.ts

  echo ""
  echo "== Step D: busy guide API smoke (occupied + PATCH 409) =="
  bash "$ROOT/scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh"

  echo ""
  echo "TT_ITINERARY_DATE_AS_SOURCE_EVIDENCE: OK ${STAMP}"
  echo "TT_ITINERARY_DATE_AS_SOURCE_SUMMARY: exit=0 phase=① green_set+contract+busy_smoke+playwright"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_ITINERARY_DATE_AS_SOURCE_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 1
}
grep -q "TT_ITINERARY_DATE_AS_SOURCE_BUSY_GUIDE_SMOKE: OK" "$RUN_LOG" || {
  echo "FAIL: missing busy guide smoke OK marker" >&2
  exit 1
}

echo "Evidence log: $RUN_LOG"
exit 0
