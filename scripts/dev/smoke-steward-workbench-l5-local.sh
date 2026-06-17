#!/usr/bin/env bash
# ① Steward Workbench L5 · 本地烟测（vitest 绿集 + multi-demo steward API 链）
# Steward Workbench L5 Closure：/governance?view=region · steward-seat · gate IA
#
# 用法（API 已起）：
#   bash scripts/dev/smoke-steward-workbench-l5-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SMOKE_STEWARD_EMAIL=multi-demo@test.com
#   SKIP_VITEST=1
#   SKIP_API_PROBE=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"
STEWARD_EMAIL="${SMOKE_STEWARD_EMAIL:-multi-demo@test.com}"
MULTI_DEMO_STEWARD_WALLET="${MULTI_DEMO_STEWARD_WALLET:-0x104FCb93B5e097F92c93Ee4621C487C6C953D212}"
SKIP_VITEST="${SKIP_VITEST:-0}"
SKIP_API_PROBE="${SKIP_API_PROBE:-0}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-1}"

fail() { echo "SWB-L5-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "SWB-L5-smoke: OK $*"; }

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Steward Workbench L5 contracts =="
  cd "$ROOT/frontend"
  npx vitest run \
    lib/governance/stewardWorkbench.contract.test.ts \
    lib/governance/stewardWorkbenchWorkspaceL5.test.ts \
    lib/governance/stewardWorkbenchL5FullClosure.contract.test.ts \
    lib/governance/stewardTtgStakeManage.contract.test.ts \
    lib/governance/stewardWorkbenchGovernanceModel.test.ts \
    lib/governance/stewardWorkbenchTodoModel.test.ts \
    lib/steward/stewardStakeUiModel.test.ts
  cd "$ROOT"
  ok "vitest contracts"
fi

if [[ "$SKIP_API_PROBE" != "1" ]]; then
  echo "== API probe ${STEWARD_EMAIL} steward workbench chain =="
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${STEWARD_EMAIL}\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login ${STEWARD_EMAIL} HTTP $code (need POST /auth/seed-test-accounts or SEED_TEST_ACCOUNTS=1)"
  token="$(node -e "const o=JSON.parse(process.argv[1]); if(!o.token) process.exit(1); process.stdout.write(o.token);" "$resp")"

  me_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me" -H "Authorization: Bearer $token")"
  me_code="${me_resp##*$'\n'}"
  [[ "$me_code" == "200" ]] || fail "GET /api/v1/me HTTP $me_code"
  ok "GET /api/v1/me"

  app_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/steward-application" \
    -H "Authorization: Bearer $token")"
  app_code="${app_resp##*$'\n'}"
  app_body="${app_resp%$'\n'*}"
  if [[ "$app_code" == "404" && -z "$(printf '%s' "$app_body" | tr -d '[:space:]')" ]]; then
    fail "GET /me/steward-application HTTP 404 — rebuild & restart API (cargo build -p traveltrust-api)"
  fi
  [[ "$app_code" == "200" ]] || fail "GET /me/steward-application HTTP $app_code body=${app_body:0:200}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const app=o?.application ?? o?.data ?? o;
    const expected=(process.argv[2]||'').toLowerCase();
    if (!app || typeof app !== 'object') {
      console.error('missing steward application payload');
      process.exit(1);
    }
    const w=String(app.wallet_address||'').toLowerCase();
    if (expected && w !== expected) {
      console.error('wallet_address expected '+expected+', got '+w);
      process.exit(1);
    }
  " "$app_body" "$MULTI_DEMO_STEWARD_WALLET" || fail "steward-application wallet_address must be $MULTI_DEMO_STEWARD_WALLET (re-seed or RESET_DOCKER_DB=1)"
  ok "GET /api/v1/me/steward-application wallet=$MULTI_DEMO_STEWARD_WALLET"

  seat_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/steward-seat" \
    -H "Authorization: Bearer $token")"
  seat_code="${seat_resp##*$'\n'}"
  seat_body="${seat_resp%$'\n'*}"
  if [[ "$seat_code" == "404" && -z "$(printf '%s' "$seat_body" | tr -d '[:space:]')" ]]; then
    fail "GET /me/steward-seat HTTP 404 — rebuild & restart API (cargo build -p traveltrust-api)"
  fi
  [[ "$seat_code" == "200" ]] || fail "GET /me/steward-seat HTTP $seat_code body=${seat_body:0:200}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const impl=o?.meta?.implementation_status ?? o?.implementation_status;
    if (impl !== 'steward_seat_v1') {
      console.error('expected steward_seat_v1, got ' + String(impl));
      process.exit(1);
    }
  " "$seat_body" || fail "steward-seat implementation_status invalid"
  ok "GET /api/v1/me/steward-seat steward_seat_v1"

  pool_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/governance/pool" \
    -H "Authorization: Bearer $token")"
  pool_code="${pool_resp##*$'\n'}"
  [[ "$pool_code" == "200" ]] || fail "GET /governance/pool HTTP $pool_code"
  ok "GET /api/v1/governance/pool (workbench observation lazy-load SSOT)"
fi

if [[ "$SKIP_PLAYWRIGHT" != "1" ]]; then
  echo "== Playwright steward workbench full L5 probes =="
  cd "$ROOT/frontend"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-${API_BASE##*:}}"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/steward-workbench-full-l5.spec.ts
  cd "$ROOT"
  ok "playwright full-page probes"
fi

echo "TT_STEWARD_WORKBENCH_L5_SMOKE: OK phase=① gate+todo+stake+observation+steward-seat"
echo "SWB-L5-smoke: ALL PASS (① local · Steward Workbench L5 Closure)"
