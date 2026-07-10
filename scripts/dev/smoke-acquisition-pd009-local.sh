#!/usr/bin/env bash
# ① 本地 · 旅行收购（PD-009）全链路 API 烟测
#
# 覆盖：注册 → 绑钱包 → 锁定发布保证金 → [Admin suspend GET/PATCH 门闸] → 发布 listing → …
#       → 向导 accept → 委托方 mock-pay → GET order escrowed
#       → confirm-completion → 双向 reviews → GET /me trust → PG↔内存 trust 对拍
#
# 用法（仓库根，API 已起且 DATABASE_URL 可用）：
#   bash scripts/dev/smoke-acquisition-pd009-local.sh
#
# 可选：API_BASE=http://127.0.0.1:8080
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/local-smoke-preflight.sh
source "$ROOT/scripts/dev/lib/local-smoke-preflight.sh"
local_smoke_load_repo_env

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
OWNER_EMAIL="acq-own-smoke-${STAMP}@traveltrust.test"
CARRIER_EMAIL="acq-car-smoke-${STAMP}@traveltrust.test"
ADMIN_EMAIL="acq-adm-smoke-${STAMP}@traveltrust.test"
PASSWORD="Test123!"
WALLET="0xacquisitionpd009smokeaaaaaaaaaaaaaaaaaaaa"

fail() { echo "smoke-acquisition-pd009: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-acquisition-pd009: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

echo "== smoke-acquisition-pd009-local (① only) API=$API_BASE =="

local_smoke_require_mock_pay_api "$API_BASE"

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

reg_owner="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Acq Owner\"}")"
reg_owner_code="${reg_owner%%|*}"
reg_owner_body="${reg_owner#*|}"
[[ "$reg_owner_code" == "200" || "$reg_owner_code" == "201" ]] || fail "register owner HTTP $reg_owner_code"
OWNER_TOKEN="$(json_field "$reg_owner_body" token)"
[[ -n "$OWNER_TOKEN" ]] || fail "owner token missing"
ok "register owner"

me_owner_id_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$OWNER_TOKEN")"
me_owner_id_code="${me_owner_id_out%%|*}"
me_owner_id_body="${me_owner_id_out#*|}"
[[ "$me_owner_id_code" == "200" ]] || fail "GET /me owner id HTTP $me_owner_id_code"
OWNER_USER_ID="$(json_nested "$me_owner_id_body" user.id)"
[[ -n "$OWNER_USER_ID" ]] || fail "owner user.id missing"

reg_car="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$CARRIER_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Acq Carrier\"}")"
reg_car_code="${reg_car%%|*}"
reg_car_body="${reg_car#*|}"
[[ "$reg_car_code" == "200" || "$reg_car_code" == "201" ]] || fail "register carrier HTTP $reg_car_code"
CARRIER_TOKEN="$(json_field "$reg_car_body" token)"
[[ -n "$CARRIER_TOKEN" ]] || fail "carrier token missing"
ok "register carrier"

me_carrier_id_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$CARRIER_TOKEN")"
me_carrier_id_code="${me_carrier_id_out%%|*}"
me_carrier_id_body="${me_carrier_id_out#*|}"
[[ "$me_carrier_id_code" == "200" ]] || fail "GET /me carrier id HTTP $me_carrier_id_code"
CARRIER_USER_ID="$(json_nested "$me_carrier_id_body" user.id)"
[[ -n "$CARRIER_USER_ID" ]] || fail "carrier user.id missing"

wallet_car_out="$(curl_json PUT "$API_BASE/api/v1/me" "{\"default_wallet_address\":\"$WALLET\"}" "$CARRIER_TOKEN")"
wallet_car_code="${wallet_car_out%%|*}"
[[ "$wallet_car_code" == "200" ]] || fail "PUT /me carrier wallet HTTP $wallet_car_code"
ok "carrier wallet bound"

wallet_out="$(curl_json PUT "$API_BASE/api/v1/me" "{\"default_wallet_address\":\"$WALLET\"}" "$OWNER_TOKEN")"
wallet_code="${wallet_out%%|*}"
[[ "$wallet_code" == "200" ]] || fail "PUT /me wallet HTTP $wallet_code"
ok "owner wallet bound"

bond_out="$(curl_json POST "$API_BASE/api/v1/me/acquisition/publish-bond" "{\"amount\":\"50\"}" "$OWNER_TOKEN")"
bond_code="${bond_out%%|*}"
bond_body="${bond_out#*|}"
[[ "$bond_code" == "200" ]] || fail "publish-bond HTTP $bond_code body=$bond_body"
ok "publish bond locked"

if [[ "${SMOKE_SKIP_ADMIN_ACQUISITION:-0}" != "1" ]]; then
  me_owner_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$OWNER_TOKEN")"
  me_owner_code="${me_owner_out%%|*}"
  me_owner_body="${me_owner_out#*|}"
  [[ "$me_owner_code" == "200" ]] || fail "GET /me owner HTTP $me_owner_code"
  OWNER_USER_ID="$(json_nested "$me_owner_body" user.id)"
  [[ -n "$OWNER_USER_ID" ]] || fail "owner user.id missing"

  reg_admin_out="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Acq Admin\",\"role\":\"tourist\"}")"
  reg_admin_code="${reg_admin_out%%|*}"
  [[ "$reg_admin_code" == "200" || "$reg_admin_code" == "201" ]] || fail "register admin HTTP $reg_admin_code"

  promote_out="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$ADMIN_EMAIL\"}")"
  promote_code="${promote_out%%|*}"
  [[ "$promote_code" == "200" ]] || fail "seed promote admin HTTP $promote_code (need SEED_TEST_ACCOUNTS=1)"
  ok "seed promote admin"

  admin_login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")"
  admin_login_code="${admin_login_out%%|*}"
  admin_login_body="${admin_login_out#*|}"
  [[ "$admin_login_code" == "200" ]] || fail "admin login HTTP $admin_login_code"
  ADMIN_TOKEN="$(json_field "$admin_login_body" token)"
  [[ -n "$ADMIN_TOKEN" ]] || fail "admin token missing"

  SUSPEND_UNTIL="$(node -e "process.stdout.write(new Date(Date.now()+86400000).toISOString())")"
  patch_out="$(curl_json PATCH "$API_BASE/api/v1/admin/users/${OWNER_USER_ID}/acquisition-publish-suspend" "{\"suspended_until\":\"$SUSPEND_UNTIL\"}" "$ADMIN_TOKEN")"
  patch_code="${patch_out%%|*}"
  patch_body="${patch_out#*|}"
  [[ "$patch_code" == "200" ]] || fail "admin suspend PATCH HTTP $patch_code body=$patch_body"
  echo "$patch_body" | grep -q '"acquisition_publish_suspended".*true' || fail "PATCH missing acquisition_publish_suspended=true"
  ok "admin PATCH acquisition publish suspend"

  detail_out="$(curl_json GET "$API_BASE/api/v1/admin/users/${OWNER_USER_ID}" "" "$ADMIN_TOKEN")"
  detail_code="${detail_out%%|*}"
  detail_body="${detail_out#*|}"
  [[ "$detail_code" == "200" ]] || fail "admin GET user detail HTTP $detail_code"
  echo "$detail_body" | grep -q '"acquisition_publish_suspended".*true' || fail "GET detail missing suspend=true: $detail_body"
  ok "admin GET user detail reflects suspend"

  list_out="$(curl_json GET "$API_BASE/api/v1/admin/users?limit=500" "" "$ADMIN_TOKEN")"
  list_code="${list_out%%|*}"
  list_body="${list_out#*|}"
  [[ "$list_code" == "200" ]] || fail "admin GET users list HTTP $list_code"
  echo "$list_body" | grep -q "$OWNER_USER_ID" || fail "admin list missing owner id"
  echo "$list_body" | grep -q '"acquisition_publish_suspended".*true' || fail "admin list missing suspend projection"
  ok "admin GET users list reflects suspend"

  blocked_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" \
    "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"Smoke blocked ${STAMP}\"}}" \
    "$OWNER_TOKEN")"
  blocked_code="${blocked_out%%|*}"
  blocked_body="${blocked_out#*|}"
  [[ "$blocked_code" == "403" ]] || fail "publish while suspended expected 403 got $blocked_code body=$blocked_body"
  echo "$blocked_body" | grep -q 'acquisition_publish_suspended' || fail "403 missing acquisition_publish_suspended"
  ok "publish blocked while admin suspended"

  lift_out="$(curl_json PATCH "$API_BASE/api/v1/admin/users/${OWNER_USER_ID}/acquisition-publish-suspend" '{"suspended_until":null}' "$ADMIN_TOKEN")"
  lift_code="${lift_out%%|*}"
  lift_body="${lift_out#*|}"
  [[ "$lift_code" == "200" ]] || fail "admin lift suspend HTTP $lift_code body=$lift_body"
  echo "$lift_body" | grep -q '"acquisition_publish_suspended".*false' || fail "lift PATCH missing acquisition_publish_suspended=false"
  ok "admin lift acquisition publish suspend"
else
  echo "smoke-acquisition-pd009: SKIP admin suspend block (SMOKE_SKIP_ADMIN_ACQUISITION=1)"
fi

list_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" \
  "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"Smoke Acquisition ${STAMP}\",\"bountyMinUsdc\":120,\"bountyMaxUsdc\":350}}" \
  "$OWNER_TOKEN")"
list_code="${list_out%%|*}"
list_body="${list_out#*|}"
[[ "$list_code" == "200" ]] || fail "POST listing HTTP $list_code body=$list_body"
LISTING_ID="$(json_field "$list_body" listing_id)"
[[ -n "$LISTING_ID" ]] || fail "listing_id missing"
ok "published listing $LISTING_ID"

order_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings/${LISTING_ID}/orders" "{}" "$CARRIER_TOKEN")"
order_code="${order_out%%|*}"
order_body="${order_out#*|}"
[[ "$order_code" == "200" ]] || fail "POST listing order HTTP $order_code body=$order_body"
ORDER_ID="$(json_nested "$order_body" order.id)"
[[ -n "$ORDER_ID" ]] || fail "order.id missing"
ok "carrier created order $ORDER_ID"

accept_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/accept" "{}" "$CARRIER_TOKEN")"
accept_code="${accept_out%%|*}"
accept_body="${accept_out#*|}"
[[ "$accept_code" == "200" ]] || fail "accept HTTP $accept_code body=$accept_body"
ok "guide accepted order"

pay_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$OWNER_TOKEN")"
pay_code="${pay_out%%|*}"
pay_body="${pay_out#*|}"
[[ "$pay_code" == "200" ]] || fail "mock-pay HTTP $pay_code body=$pay_body"
pay_status="$(json_nested "$pay_body" order.status)"
[[ "$pay_status" == "escrowed" ]] || fail "expected escrowed got $pay_status"
ok "mock-pay → escrowed"

get_out="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$OWNER_TOKEN")"
get_code="${get_out%%|*}"
get_body="${get_out#*|}"
[[ "$get_code" == "200" ]] || fail "GET order HTTP $get_code"
get_status="$(json_nested "$get_body" order.status)"
[[ "$get_status" == "escrowed" ]] || fail "GET order status $get_status"
ok "GET order confirms escrowed"

complete_carrier_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$CARRIER_TOKEN")"
complete_carrier_code="${complete_carrier_out%%|*}"
complete_carrier_body="${complete_carrier_out#*|}"
[[ "$complete_carrier_code" == "200" ]] || fail "carrier confirm-completion HTTP $complete_carrier_code body=$complete_carrier_body"
carrier_status="$(json_nested "$complete_carrier_body" order.status)"
[[ "$carrier_status" == "escrowed" ]] || fail "carrier confirm expected escrowed got $carrier_status"
ok "carrier confirm-completion → service_completion_pending"

complete_owner_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$OWNER_TOKEN")"
complete_owner_code="${complete_owner_out%%|*}"
complete_owner_body="${complete_owner_out#*|}"
[[ "$complete_owner_code" == "200" ]] || fail "owner confirm-completion HTTP $complete_owner_code body=$complete_owner_body"
complete_status="$(json_nested "$complete_owner_body" order.status)"
[[ "$complete_status" == "completed" ]] || fail "expected completed got $complete_status"
ok "owner confirm-completion → completed (bilateral)"

review_payload='{"score":5,"comment":"smoke pd009 l5"}'
for tok in "$OWNER_TOKEN" "$CARRIER_TOKEN"; do
  rev_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/reviews" "$review_payload" "$tok")"
  rev_code="${rev_out%%|*}"
  rev_body="${rev_out#*|}"
  [[ "$rev_code" == "200" ]] || fail "POST review HTTP $rev_code body=$rev_body"
done
ok "bilateral reviews submitted"

me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$OWNER_TOKEN")"
me_code="${me_out%%|*}"
me_body="${me_out#*|}"
[[ "$me_code" == "200" ]] || fail "GET /me HTTP $me_code"
me_score="$(json_nested "$me_body" trust.acquisition_trust_score)"
[[ -n "$me_score" ]] || fail "acquisition_trust_score missing on /me"
ok "GET /me acquisition_trust_score=$me_score"

if [[ "${SMOKE_SKIP_TRUST_PARITY:-0}" != "1" ]]; then
  export SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS="${OWNER_USER_ID},${CARRIER_USER_ID}"
  export SMOKE_ACQUISITION_TRUST_ME_SCORE="$me_score"
  bash scripts/dev/smoke-acquisition-trust-parity-local.sh
  ok "PG ↔ memory acquisition trust parity"
fi

echo ""
echo "smoke-acquisition-pd009-local: ALL PASSED (① local · not ②③ GO)"
echo "  listing_id=$LISTING_ID order_id=$ORDER_ID"
FRONTEND_PORT="${FRONTEND_PORT:-3012}"
echo "  escrow: http://localhost:${FRONTEND_PORT}/escrow/${ORDER_ID} (if frontend up)"
