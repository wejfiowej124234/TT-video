#!/usr/bin/env bash
# ① Provider Workbench L5 · 本地烟测（vitest 绿集 + merchant seller API 链）
# Merchant Workbench L5 Closure Sprint：/provider=经营 · hat=merchant 卖家订单走廊 · listings-summary
#
# 用法（API 已起）：
#   bash scripts/dev/smoke-provider-workbench-l5-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SMOKE_MERCHANT_EMAIL=provider-did-rank-demo@test.com
#   SKIP_VITEST=1
#   SKIP_API_PROBE=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"
MERCHANT_EMAIL="${SMOKE_MERCHANT_EMAIL:-merchant@test.com}"
SKIP_VITEST="${SKIP_VITEST:-0}"
SKIP_API_PROBE="${SKIP_API_PROBE:-0}"

fail() { echo "PWB-L5-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "PWB-L5-smoke: OK $*"; }

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Provider Workbench L5 contracts =="
  cd "$ROOT/frontend"
  npx vitest run \
    lib/provider/merchantOrderCorridorModel.test.ts \
    lib/provider/merchantProfileFormSnapshot.test.ts \
    lib/provider/merchantOrderCorridor.contract.test.ts \
    lib/provider/merchantProfileSettingsNav.contract.test.ts \
    lib/provider/providerWorkbench.contract.test.ts \
    lib/provider/providerWorkbenchL5.contract.test.ts \
    lib/provider/providerWorkbenchL5FullClosure.contract.test.ts \
    lib/provider/providerWorkbenchWorkspaceL5.test.ts \
    lib/orders/ordersListHatQuery.contract.test.ts
  cd "$ROOT"
  ok "vitest contracts"
fi

if [[ "$SKIP_API_PROBE" != "1" ]]; then
  echo "== API probe ${MERCHANT_EMAIL} workbench chain =="
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${MERCHANT_EMAIL}\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login ${MERCHANT_EMAIL} HTTP $code (need POST /auth/seed-test-accounts or restart API with SEED_TEST_ACCOUNTS=1)"
  token="$(node -e "const o=JSON.parse(process.argv[1]); if(!o.token) process.exit(1); process.stdout.write(o.token);" "$resp")"

  me_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me" -H "Authorization: Bearer $token")"
  me_code="${me_resp##*$'\n'}"
  [[ "$me_code" == "200" ]] || fail "GET /api/v1/me HTTP $me_code"
  me_body="${me_resp%$'\n'*}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const stats=o?.stats;
    if(!stats || typeof stats !== 'object') {
      console.error('missing stats on GET /me');
      process.exit(1);
    }
  " "$me_body" || fail "GET /me missing stats block (merchant_workspace_stats)"
  ok "GET /api/v1/me stats present"

  mp_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/merchant-profile" -H "Authorization: Bearer $token")"
  mp_code="${mp_resp##*$'\n'}"
  [[ "$mp_code" == "200" ]] || fail "GET /me/merchant-profile HTTP $mp_code (run seed-test-accounts to sync merchant@test.com application)"
  ok "GET /api/v1/me/merchant-profile"

  ls_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/merchant-listings-summary" \
    -H "Authorization: Bearer $token")"
  ls_code="${ls_resp##*$'\n'}"
  ls_body="${ls_resp%$'\n'*}"
  if [[ "$ls_code" == "404" && -z "$(echo "$ls_body" | tr -d '[:space:]')" ]]; then
    fail "GET /me/merchant-listings-summary HTTP 404 — rebuild & restart API (cargo build -p traveltrust-api, then restart :8080)"
  fi
  [[ "$ls_code" == "200" ]] || fail "GET /me/merchant-listings-summary HTTP $ls_code body=${ls_body:0:200}"
  node -e "
    const raw = JSON.parse(process.argv[1]);
    const data = raw?.summary ?? raw?.data ?? raw;
    const pub = data?.published_count;
    const draft = data?.draft_count;
    if (typeof pub !== 'number' || typeof draft !== 'number') {
      console.error('expected published_count + draft_count numbers');
      process.exit(1);
    }
    process.stdout.write('published=' + pub + ' draft=' + draft);
  " "$ls_body" || fail "merchant-listings-summary shape invalid"
  ok "GET /api/v1/me/merchant-listings-summary"

  ml_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/merchant-listings" \
    -H "Authorization: Bearer $token")"
  ml_code="${ml_resp##*$'\n'}"
  ml_body="${ml_resp%$'\n'*}"
  if [[ "$ml_code" == "404" && -z "$(echo "$ml_body" | tr -d '[:space:]')" ]]; then
    fail "GET /me/merchant-listings HTTP 404 — rebuild & restart API (cargo build -p traveltrust-api, then restart :8080)"
  fi
  [[ "$ml_code" == "200" ]] || fail "GET /me/merchant-listings HTTP $ml_code body=${ml_body:0:200}"
  node -e "
    const raw = JSON.parse(process.argv[1]);
    if (!Array.isArray(raw?.published) || !Array.isArray(raw?.drafts)) {
      console.error('expected published[] + drafts[]');
      process.exit(1);
    }
  " "$ml_body" || fail "merchant-listings shape invalid"
  ok "GET /api/v1/me/merchant-listings"

  ord_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/orders?business_line=merchant_service&limit=50&hat=merchant" \
    -H "Authorization: Bearer $token")"
  ord_code="${ord_resp##*$'\n'}"
  ord_body="${ord_resp%$'\n'*}"
  [[ "$ord_code" == "200" ]] || fail "GET /orders?hat=merchant HTTP $ord_code"
  corridor_stats="$(node -e "
    const raw = JSON.parse(process.argv[1]);
    const items = Array.isArray(raw?.items) ? raw.items : [];
    if (raw?.list_hat !== 'merchant') {
      console.error('expected list_hat=merchant — rebuild & restart API after Merchant L5 sprint');
      process.exit(1);
    }
    const wrongLine = items.filter((o) => String(o?.business_line ?? '') !== 'merchant_service');
    if (wrongLine.length) {
      console.error('server hat=merchant filter leaked non-merchant_service orders: ' + wrongLine.length);
      process.exit(1);
    }
    process.stdout.write('seller_orders=' + items.length + ' list_hat=merchant');
  " "$ord_body" 2>/dev/null || true)"
  [[ -n "$corridor_stats" ]] || fail "merchant order corridor parse failed"
  ok "order corridor hat=merchant ($corridor_stats)"
fi

echo "TT_PROVIDER_WORKBENCH_L5_SMOKE: OK phase=① inbox+market-exposure+stats+hat=merchant"
echo "PWB-L5-smoke: ALL PASS (① local · Merchant Workbench L5 Closure Sprint)"
