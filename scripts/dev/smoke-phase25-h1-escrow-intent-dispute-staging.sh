#!/usr/bin/env bash
# Phase 2.5 · CH-H01 · Escrow / Intent / Dispute write-path staging smoke
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-phase25-h1-escrow-intent-dispute-staging.sh
#
# Covers: order create → accept → mock-pay → dispute open → intent shape negative
# Boundary: ② coverage hardening · ≠ Production GO · ≠ Phase ③
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"

API="$(phase25_api_base)"
STAMP="$(date +%s)"
EMAIL_A="${PHASE25_TOURIST_EMAIL:-tourist@test.com}"
EMAIL_B="${PHASE25_GUIDE_EMAIL:-guide@test.com}"
PASSWORD="${PHASE25_SEED_PASSWORD:-Test123!}"

echo "== smoke-phase25-h1-escrow-intent-dispute-staging API=${API} =="
phase25_require_health "$API"

curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true

phase25_seed_and_login "$API" "$EMAIL_B" "$PASSWORD"
GUIDE_TOKEN="$PHASE25_TOKEN"
me_guide_out="$(phase25_curl_json GET "${API}/api/v1/me" "" "$GUIDE_TOKEN")"
[[ "${me_guide_out%%|*}" == "200" ]] || phase25_fail "GET /me guide HTTP ${me_guide_out%%|*}"
GUIDE_ID="$(phase25_json_nested "${me_guide_out#*|}" guide.id)"
[[ -z "$GUIDE_ID" ]] && GUIDE_ID="$(phase25_json_nested "${me_guide_out#*|}" user.guide_id)"
[[ -n "$GUIDE_ID" ]] || phase25_fail "guide@test.com missing guide.id on /me"
phase25_ok "guide_id=${GUIDE_ID} (from guide session)"

phase25_seed_and_login "$API" "$EMAIL_A" "$PASSWORD"
TOKEN_A="$PHASE25_TOKEN"
phase25_ok "seed accounts tourist+guide"

SKIP_ACCEPT=0
SKIP_PAY=0
SKIP_DISPUTE_OPEN=0
ORDER_STATE=""

create_out="$(phase25_curl_json POST "${API}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"100\",\"currency\":\"USD\"}" "$TOKEN_A")"
create_code="${create_out%%|*}"
create_body="${create_out#*|}"

if [[ "$create_code" == "409" ]] && echo "$create_body" | grep -q 'guide_has_active_order'; then
  list_out="$(phase25_curl_json GET "${API}/api/v1/orders?limit=50" "" "$TOKEN_A")"
  [[ "${list_out%%|*}" == "200" ]] || phase25_fail "GET /orders for reuse HTTP ${list_out%%|*}"
  ORDER_ID="$(node -e "
    const j=JSON.parse(process.argv[1]);
    const gid=process.argv[2];
    const items=Array.isArray(j.items)?j.items:(Array.isArray(j.orders)?j.orders:[]);
    const hit=items.find(o=>(o.guide_id||o.guideId||'')===gid);
    process.stdout.write(hit?(hit.id||hit.order_id||''):'');
  " "${list_out#*|}" "$GUIDE_ID")"
  [[ -n "$ORDER_ID" ]] || phase25_fail "guide_has_active_order but no order in tourist list"
  detail_out="$(phase25_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$TOKEN_A")"
  [[ "${detail_out%%|*}" == "200" ]] || phase25_fail "GET order reuse HTTP ${detail_out%%|*}"
  ORDER_STATE="$(phase25_json_nested "${detail_out#*|}" order.status)"
  [[ -z "$ORDER_STATE" ]] && ORDER_STATE="$(phase25_json_nested "${detail_out#*|}" status)"
  phase25_ok "reuse order ${ORDER_ID} state=${ORDER_STATE} (guide slot busy)"
  case "$ORDER_STATE" in
    accepted) SKIP_ACCEPT=1 ;;
    escrowed) SKIP_ACCEPT=1; SKIP_PAY=1 ;;
    disputed) SKIP_ACCEPT=1; SKIP_PAY=1; SKIP_DISPUTE_OPEN=1 ;;
  esac
elif [[ "$create_code" == "200" || "$create_code" == "201" ]]; then
  ORDER_ID="$(phase25_json_nested "$create_body" order.id)"
  [[ -z "$ORDER_ID" ]] && ORDER_ID="$(phase25_json_nested "$create_body" id)"
  [[ -z "$ORDER_ID" ]] && ORDER_ID="$(phase25_json_field "$create_body" id)"
  [[ -n "$ORDER_ID" ]] || phase25_fail "order id missing"
  phase25_ok "created order ${ORDER_ID}"
else
  phase25_fail "POST /orders HTTP ${create_code} body=${create_body}"
fi

if [[ "$SKIP_ACCEPT" != "1" ]]; then
  accept_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/accept" "{}" "$GUIDE_TOKEN")"
  accept_code="${accept_out%%|*}"
  accept_body="${accept_out#*|}"
  [[ "$accept_code" == "200" ]] || phase25_fail "accept HTTP ${accept_code} body=${accept_body}"
  phase25_ok "guide accepted"
fi

pay_code=""
if [[ "$SKIP_PAY" != "1" ]]; then
  pay_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOKEN_A")"
  pay_code="${pay_out%%|*}"
  pay_body="${pay_out#*|}"
  if [[ "$pay_code" == "501" ]]; then
    echo "phase25: SKIP mock-pay (501 chain_off) — dispute/intent negatives still run"
  else
    [[ "$pay_code" == "200" ]] || phase25_fail "mock-pay HTTP ${pay_code} body=${pay_body}"
    st="$(phase25_json_nested "$pay_body" order.status)"
    [[ "$st" == "escrowed" ]] || phase25_fail "expected escrowed got ${st}"
    phase25_ok "mock-pay → escrowed"
  fi
else
  pay_code="200"
  phase25_ok "mock-pay skipped (order already ${ORDER_STATE})"
fi

if [[ "$SKIP_DISPUTE_OPEN" != "1" && "$pay_code" != "501" ]]; then
  disp_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/dispute" \
    "{\"reason\":\"phase25 coverage hardening ${STAMP}\"}" "$TOKEN_A")"
  disp_code="${disp_out%%|*}"
  disp_body="${disp_out#*|}"
  if [[ "$disp_code" == "409" ]] && echo "$disp_body" | grep -q 'dispute_already_open'; then
    phase25_ok "dispute already open (409) — reuse"
    SKIP_DISPUTE_OPEN=1
  else
    [[ "$disp_code" == "200" || "$disp_code" == "201" ]] || \
      phase25_fail "POST dispute HTTP ${disp_code} body=${disp_body}"
    phase25_ok "dispute opened"
  fi
fi

if [[ "$pay_code" != "501" ]]; then
  list_out="$(phase25_curl_json GET "${API}/api/v1/disputes" "" "$TOKEN_A")"
  [[ "${list_out%%|*}" == "200" ]] || phase25_fail "GET /disputes not 200"
  phase25_ok "disputes list readable"
  DISPUTE_ID="$(node -e "
    const j=JSON.parse(process.argv[1]);
    const items=Array.isArray(j.items)?j.items:(Array.isArray(j.disputes)?j.disputes:[]);
    const oid=process.argv[2];
    const hit=items.find(d=>(d.order_id||d.orderId||'')===oid) || items[0];
    process.stdout.write(hit?(hit.id||''):'');
  " "${list_out#*|}" "$ORDER_ID")"
  if [[ -n "$DISPUTE_ID" ]]; then
    bad_exec='{"chain_id":11155111,"verifying_contract":"","signer":"0x0000000000000000000000000000000000000001","signature":"0x","typed_data":{}}'
    exec_out="$(phase25_curl_json POST "${API}/api/v1/disputes/${DISPUTE_ID}/execute-resolution-intent" \
      "$bad_exec" "$TOKEN_A")"
    [[ "${exec_out%%|*}" == "400" ]] || phase25_fail "execute-resolution-intent bad shape expected 400 got ${exec_out%%|*}"
    phase25_ok "execute-resolution-intent rejects invalid shape (400)"
  fi
fi

# Intent negative: empty verifying_contract → 400 invalid_intent
bad_intent='{"chain_id":11155111,"verifying_contract":"","signer":"0x0000000000000000000000000000000000000001","signature":"0x","typed_data":{}}'
intent_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/open-dispute-intent" \
  "$bad_intent" "$TOKEN_A")"
intent_code="${intent_out%%|*}"
intent_body="${intent_out#*|}"
[[ "$intent_code" == "400" ]] || phase25_fail "open-dispute-intent bad shape expected 400 got ${intent_code} body=${intent_body}"
echo "$intent_body" | grep -q 'invalid_intent' || phase25_fail "missing invalid_intent error"
phase25_ok "open-dispute-intent rejects invalid shape (400)"

echo "TT_PHASE25_H1_ESCROW_INTENT_DISPUTE: OK"
echo "  order_id=${ORDER_ID} api=${API}"
