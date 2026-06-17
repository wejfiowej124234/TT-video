#!/usr/bin/env bash
# ② Staging · PD-009 收购全链路 API 烟测
#
# create(listing) → match(catalog GET + carrier order) → accept → mock-pay(escrow) → complete
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-acquisition-pd009-staging.sh
#
# 默认跳过 admin suspend 轨 · PG trust parity（须本地 DB）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${STAGING_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}"
API_BASE="${API_BASE%/}"
export SMOKE_SKIP_ADMIN_ACQUISITION="${SMOKE_SKIP_ADMIN_ACQUISITION:-1}"
export SMOKE_SKIP_TRUST_PARITY="${SMOKE_SKIP_TRUST_PARITY:-1}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

STAMP="$(date +%s)"
OWNER_EMAIL="acq-stg-own-${STAMP}@traveltrust.test"
CARRIER_EMAIL="acq-stg-car-${STAMP}@traveltrust.test"
PASSWORD="${ACQ_STAGING_PASSWORD:-Test123!}"
WALLET="0xacquisitionpd009stagingaaaaaaaaaaaaaa"

fail() { echo "smoke-acquisition-pd009-staging: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-acquisition-pd009-staging: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$json" "$key"
}

json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    let v=o;
    for (const p of process.argv[2].split('.')) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  local args=(--noproxy "*" -sS -o "$tmp" -w '%{http_code}')
  if [[ -n "$body" ]]; then
    args+=(-X "$method" "$url" -H "Content-Type: application/json")
    [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
    args+=(-d "$body")
  else
    args+=(-X "$method" "$url")
    [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
  fi
  code="$(curl "${args[@]}" 2>/dev/null || echo "000")"
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

echo "== smoke-acquisition-pd009-staging (②) API=$API_BASE =="

health="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" 2>/dev/null || echo "000")"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"
ok "health 200"

reg_owner="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Acq Stg Owner\"}")"
[[ "${reg_owner%%|*}" == "200" || "${reg_owner%%|*}" == "201" ]] || fail "register owner HTTP ${reg_owner%%|*}"
OWNER_TOKEN="$(json_field "${reg_owner#*|}" token)"
[[ -n "$OWNER_TOKEN" ]] || fail "owner token missing"
ok "register owner"

reg_car="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$CARRIER_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Acq Stg Carrier\"}")"
[[ "${reg_car%%|*}" == "200" || "${reg_car%%|*}" == "201" ]] || fail "register carrier HTTP ${reg_car%%|*}"
CARRIER_TOKEN="$(json_field "${reg_car#*|}" token)"
[[ -n "$CARRIER_TOKEN" ]] || fail "carrier token missing"
ok "register carrier"

for tok in "$OWNER_TOKEN" "$CARRIER_TOKEN"; do
  w_out="$(curl_json PUT "$API_BASE/api/v1/me" "{\"default_wallet_address\":\"$WALLET\"}" "$tok")"
  [[ "${w_out%%|*}" == "200" ]] || fail "PUT /me wallet HTTP ${w_out%%|*}"
done
ok "wallets bound"

bond_out="$(curl_json POST "$API_BASE/api/v1/me/acquisition/publish-bond" '{"amount":"50"}' "$OWNER_TOKEN")"
[[ "${bond_out%%|*}" == "200" ]] || fail "publish-bond HTTP ${bond_out%%|*} body=${bond_out#*|}"
ok "publish bond locked"

list_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" \
  "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"TN-P1-003 Staging ${STAMP}\",\"bountyMinUsdc\":120,\"bountyMaxUsdc\":350}}" \
  "$OWNER_TOKEN")"
[[ "${list_out%%|*}" == "200" ]] || fail "POST listing HTTP ${list_out%%|*} body=${list_out#*|}"
LISTING_ID="$(json_field "${list_out#*|}" listing_id)"
[[ -n "$LISTING_ID" ]] || fail "listing_id missing"
ok "create listing $LISTING_ID"

match_out="$(curl_json GET "$API_BASE/api/v1/me/acquisition-listings" "" "$OWNER_TOKEN")"
[[ "${match_out%%|*}" == "200" ]] || fail "GET /me/acquisition-listings HTTP ${match_out%%|*} body=${match_out#*|}"
echo "${match_out#*|}" | grep -q "$LISTING_ID" || fail "match: owner acquisition-listings missing $LISTING_ID"
ok "match: owner acquisition-listings contains listing"

order_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings/${LISTING_ID}/orders" "{}" "$CARRIER_TOKEN")"
[[ "${order_out%%|*}" == "200" ]] || fail "POST listing order HTTP ${order_out%%|*} body=${order_out#*|}"
ORDER_ID="$(json_nested "${order_out#*|}" order.id)"
[[ -n "$ORDER_ID" ]] || fail "order.id missing"
ok "carrier matched order $ORDER_ID"

accept_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/accept" "{}" "$CARRIER_TOKEN")"
[[ "${accept_out%%|*}" == "200" ]] || fail "accept HTTP ${accept_out%%|*} body=${accept_out#*|}"
ok "accept"

pay_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$OWNER_TOKEN")"
pay_code="${pay_out%%|*}"
pay_body="${pay_out#*|}"
if [[ "$pay_code" == "501" ]]; then
  fail "mock-pay HTTP 501 (staging chain policy) — cannot reach escrow/complete on this host"
fi
[[ "$pay_code" == "200" ]] || fail "mock-pay HTTP $pay_code body=$pay_body"
pay_status="$(json_nested "$pay_body" order.status)"
[[ "$pay_status" == "escrowed" ]] || fail "expected escrowed got $pay_status"
ok "mock-pay → escrowed"

get_out="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$OWNER_TOKEN")"
[[ "${get_out%%|*}" == "200" ]] || fail "GET order HTTP ${get_out%%|*}"
[[ "$(json_nested "${get_out#*|}" order.status)" == "escrowed" ]] || fail "GET order not escrowed"
ok "GET order confirms escrowed"

complete_out="$(curl_json POST "$API_BASE/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$CARRIER_TOKEN")"
[[ "${complete_out%%|*}" == "200" ]] || fail "confirm-completion HTTP ${complete_out%%|*} body=${complete_out#*|}"
complete_status="$(json_nested "${complete_out#*|}" order.status)"
[[ "$complete_status" == "completed" ]] || fail "expected completed got $complete_status"
ok "confirm-completion → completed"

me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$OWNER_TOKEN")"
[[ "${me_out%%|*}" == "200" ]] || fail "GET /me HTTP ${me_out%%|*}"
[[ -n "$(json_nested "${me_out#*|}" trust.acquisition_trust_score)" ]] || fail "acquisition_trust_score missing"
ok "GET /me acquisition_trust_score present"

node -e "console.log(JSON.stringify({
  listing_id:process.argv[1],
  order_id:process.argv[2],
  owner_email:process.argv[3],
  carrier_email:process.argv[4],
  final_status:'completed',
  payment_mode:'mock-pay',
  api:process.argv[5]
},null,2))" "$LISTING_ID" "$ORDER_ID" "$OWNER_EMAIL" "$CARRIER_EMAIL" "$API_BASE" >"${ACQ_STAGING_SUMMARY_JSON:-$(mktemp)}"

echo ""
echo "TT_SMOKE_ACQUISITION_PD009_STAGING: OK"
echo "  listing_id=$LISTING_ID order_id=$ORDER_ID"
echo "  api=$API_BASE"
