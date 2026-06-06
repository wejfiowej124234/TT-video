#!/usr/bin/env bash
# Phase 2.5 · CH-H02 · Acquisition accept + fulfillment-bond staging smoke
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-phase25-h2-acquisition-fulfillment-staging.sh
#
# Covers: publish-bond → high-bounty listing → fulfillment-bond gate → accept order → mock-pay
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"

API="$(phase25_api_base)"
STAMP="$(date +%s)"
OWNER_EMAIL="p25-acq-own-${STAMP}@traveltrust.test"
CARRIER_EMAIL="p25-acq-car-${STAMP}@traveltrust.test"
PASSWORD="Test123!"
WALLET="0xphase25acquisitionfulfillment000000000001"

echo "== smoke-phase25-h2-acquisition-fulfillment-staging API=${API} =="
phase25_require_health "$API"

phase25_register_user "$API" "$OWNER_EMAIL" "$PASSWORD" "P25 Acq Owner"
OWNER_TOKEN="$PHASE25_TOKEN"
phase25_register_user "$API" "$CARRIER_EMAIL" "$PASSWORD" "P25 Acq Carrier"
CARRIER_TOKEN="$PHASE25_TOKEN"

for tok_var in OWNER_TOKEN CARRIER_TOKEN; do
  tok="${!tok_var}"
  w_out="$(phase25_curl_json PUT "${API}/api/v1/me" "{\"default_wallet_address\":\"${WALLET}\"}" "$tok")"
  [[ "${w_out%%|*}" == "200" ]] || phase25_fail "PUT /me wallet HTTP ${w_out%%|*}"
done
phase25_ok "wallets bound"

bond_out="$(phase25_curl_json POST "${API}/api/v1/me/acquisition/publish-bond" "{\"amount\":\"50\"}" "$OWNER_TOKEN")"
[[ "${bond_out%%|*}" == "200" ]] || phase25_fail "publish-bond HTTP ${bond_out%%|*} body=${bond_out#*|}"
phase25_ok "publish bond locked"

list_out="$(phase25_curl_json POST "${API}/api/v1/market/acquisition/listings" \
  "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"P25 high bounty ${STAMP}\",\"bountyMinUsdc\":1200,\"bountyMaxUsdc\":1500}}" \
  "$OWNER_TOKEN")"
[[ "${list_out%%|*}" == "200" ]] || phase25_fail "POST listing HTTP ${list_out%%|*} body=${list_out#*|}"
LISTING_ID="$(phase25_json_field "${list_out#*|}" listing_id)"
[[ -n "$LISTING_ID" ]] || phase25_fail "listing_id missing"
phase25_ok "published high-bounty listing ${LISTING_ID}"

blocked_out="$(phase25_curl_json POST "${API}/api/v1/market/acquisition/listings/${LISTING_ID}/orders" "{}" "$CARRIER_TOKEN")"
blocked_code="${blocked_out%%|*}"
blocked_body="${blocked_out#*|}"
[[ "$blocked_code" == "400" ]] || phase25_fail "accept without fulfillment bond expected 400 got ${blocked_code} body=${blocked_body}"
echo "$blocked_body" | grep -q 'acquisition_fulfillment_bond_required' || \
  phase25_fail "expected acquisition_fulfillment_bond_required"
phase25_ok "fulfillment-bond gate blocks accept (400)"

ff_out="$(phase25_curl_json POST "${API}/api/v1/me/acquisition/fulfillment-bond" "{\"amount\":\"100\"}" "$CARRIER_TOKEN")"
[[ "${ff_out%%|*}" == "200" ]] || phase25_fail "fulfillment-bond HTTP ${ff_out%%|*} body=${ff_out#*|}"
phase25_ok "fulfillment bond locked"

order_out="$(phase25_curl_json POST "${API}/api/v1/market/acquisition/listings/${LISTING_ID}/orders" "{}" "$CARRIER_TOKEN")"
[[ "${order_out%%|*}" == "200" ]] || phase25_fail "POST listing order HTTP ${order_out%%|*} body=${order_out#*|}"
ORDER_ID="$(phase25_json_nested "${order_out#*|}" order.id)"
[[ -n "$ORDER_ID" ]] || phase25_fail "order.id missing"
phase25_ok "carrier created order ${ORDER_ID}"

accept_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/accept" "{}" "$CARRIER_TOKEN")"
[[ "${accept_out%%|*}" == "200" ]] || phase25_fail "accept HTTP ${accept_out%%|*}"

pay_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$OWNER_TOKEN")"
pay_code="${pay_out%%|*}"
if [[ "$pay_code" == "501" ]]; then
  phase25_ok "mock-pay 501 (chain_off policy) — accept+fulfillment path verified"
else
  [[ "$pay_code" == "200" ]] || phase25_fail "mock-pay HTTP ${pay_code}"
  phase25_ok "mock-pay → escrowed"
fi

echo "TT_PHASE25_H2_ACQUISITION_FULFILLMENT: OK"
echo "  listing_id=${LISTING_ID} order_id=${ORDER_ID}"
