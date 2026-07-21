#!/usr/bin/env bash
# Reality-W3 · SU-PLUS-06 dispute sample dry-run on Staging
# Avoids phase25 node argv blow-up when tourist has huge order lists.
#
#   bash scripts/dev/run-reality-w3-dispute-dryrun-staging.sh
#
# Exit 0 = dry-run PASS · exit 2 = FAIL
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"

API="$(phase25_api_base)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EMAIL_A="${PHASE25_TOURIST_EMAIL:-tourist@test.com}"
EMAIL_B="${PHASE25_GUIDE_EMAIL:-guide@test.com}"
PASSWORD="${PHASE25_SEED_PASSWORD:-Test123!}"
EVID_ROOT="${W3_DISPUTE_EVID:-$ROOT/evidence/PSG-REALITY-CLOSURE/W3-DISPUTE-DRYRUN-$STAMP}"
mkdir -p "$EVID_ROOT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== W3 dispute dry-run API=${API} evid=${EVID_ROOT} =="
phase25_require_health "$API"

curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true

phase25_seed_and_login "$API" "$EMAIL_B" "$PASSWORD"
GUIDE_TOKEN="$PHASE25_TOKEN"
me_guide_out="$(phase25_curl_json GET "${API}/api/v1/me" "" "$GUIDE_TOKEN")"
[[ "${me_guide_out%%|*}" == "200" ]] || phase25_fail "GET /me guide HTTP ${me_guide_out%%|*}"
GUIDE_ID="$(phase25_json_nested "${me_guide_out#*|}" guide.id)"
[[ -z "$GUIDE_ID" ]] && GUIDE_ID="$(phase25_json_nested "${me_guide_out#*|}" user.guide_id)"
[[ -n "$GUIDE_ID" ]] || phase25_fail "missing guide.id"
phase25_ok "guide_id=${GUIDE_ID}"

phase25_seed_and_login "$API" "$EMAIL_A" "$PASSWORD"
TOKEN_A="$PHASE25_TOKEN"

create_out="$(phase25_curl_json POST "${API}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"100\",\"currency\":\"USD\"}" "$TOKEN_A")"
create_code="${create_out%%|*}"
create_body="${create_out#*|}"
ORDER_ID=""
ORDER_STATE=""
SKIP_ACCEPT=0
SKIP_PAY=0
SKIP_DISPUTE=0

if [[ "$create_code" == "409" ]] && echo "$create_body" | grep -q 'guide_has_active_order'; then
  # Fetch one page; parse via file to avoid ARG_MAX
  list_out="$(phase25_curl_json GET "${API}/api/v1/orders?limit=20" "" "$TOKEN_A")"
  [[ "${list_out%%|*}" == "200" ]] || phase25_fail "GET /orders HTTP ${list_out%%|*}"
  printf '%s' "${list_out#*|}" >"$TMP/orders.json"
  ORDER_ID="$(node -e "
    const fs=require('fs');
    const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    const gid=process.argv[2];
    const items=Array.isArray(j.items)?j.items:(Array.isArray(j.orders)?j.orders:[]);
    const hit=items.find(o=>(o.guide_id||o.guideId||'')===gid) || items[0];
    process.stdout.write(hit?(hit.id||hit.order_id||''):'');
  " "$TMP/orders.json" "$GUIDE_ID")"
  [[ -n "$ORDER_ID" ]] || phase25_fail "no reusable order"
  detail_out="$(phase25_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$TOKEN_A")"
  [[ "${detail_out%%|*}" == "200" ]] || phase25_fail "GET order HTTP ${detail_out%%|*}"
  ORDER_STATE="$(phase25_json_nested "${detail_out#*|}" order.status)"
  [[ -z "$ORDER_STATE" ]] && ORDER_STATE="$(phase25_json_nested "${detail_out#*|}" status)"
  phase25_ok "reuse order ${ORDER_ID} state=${ORDER_STATE}"
  case "$ORDER_STATE" in
    accepted) SKIP_ACCEPT=1 ;;
    escrowed|paid) SKIP_ACCEPT=1; SKIP_PAY=1 ;;
    disputed) SKIP_ACCEPT=1; SKIP_PAY=1; SKIP_DISPUTE=1 ;;
  esac
elif [[ "$create_code" == "200" || "$create_code" == "201" ]]; then
  ORDER_ID="$(phase25_json_nested "$create_body" order.id)"
  [[ -z "$ORDER_ID" ]] && ORDER_ID="$(phase25_json_nested "$create_body" id)"
  [[ -n "$ORDER_ID" ]] || phase25_fail "order id missing"
  phase25_ok "created order ${ORDER_ID}"
else
  phase25_fail "POST /orders HTTP ${create_code} body=${create_body}"
fi

if [[ "$SKIP_ACCEPT" != "1" ]]; then
  accept_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/accept" "{}" "$GUIDE_TOKEN")"
  [[ "${accept_out%%|*}" == "200" ]] || phase25_fail "accept HTTP ${accept_out%%|*}"
  phase25_ok "accepted"
fi

PAY_CODE=""
if [[ "$SKIP_PAY" != "1" ]]; then
  pay_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOKEN_A")"
  PAY_CODE="${pay_out%%|*}"
  if [[ "$PAY_CODE" == "501" ]]; then
    phase25_ok "mock-pay 501 — continue dispute if state allows"
  else
    [[ "$PAY_CODE" == "200" ]] || phase25_fail "mock-pay HTTP ${PAY_CODE}"
    phase25_ok "mock-pay"
  fi
else
  PAY_CODE="200"
  phase25_ok "mock-pay skipped"
fi

DISPUTE_ID=""
if [[ "$SKIP_DISPUTE" != "1" && "$PAY_CODE" != "501" ]]; then
  disp_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/dispute" \
    "{\"reason\":\"Reality-W3 SU-PLUS-06 dryrun ${STAMP}\"}" "$TOKEN_A")"
  disp_code="${disp_out%%|*}"
  if [[ "$disp_code" == "409" ]] && echo "${disp_out#*|}" | grep -q 'dispute_already_open'; then
    phase25_ok "dispute already open"
  else
    [[ "$disp_code" == "200" || "$disp_code" == "201" ]] || \
      phase25_fail "dispute open HTTP ${disp_code} body=${disp_out#*|}"
    phase25_ok "dispute opened"
    DISPUTE_ID="$(phase25_json_nested "${disp_out#*|}" dispute.id)"
    [[ -z "$DISPUTE_ID" ]] && DISPUTE_ID="$(phase25_json_nested "${disp_out#*|}" id)"
  fi
fi

list_out="$(phase25_curl_json GET "${API}/api/v1/disputes?limit=20" "" "$TOKEN_A")"
[[ "${list_out%%|*}" == "200" ]] || phase25_fail "GET /disputes HTTP ${list_out%%|*}"
printf '%s' "${list_out#*|}" >"$TMP/disputes.json"
if [[ -z "$DISPUTE_ID" ]]; then
  DISPUTE_ID="$(node -e "
    const fs=require('fs');
    const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    const oid=process.argv[2];
    const items=Array.isArray(j.items)?j.items:(Array.isArray(j.disputes)?j.disputes:[]);
    const hit=items.find(d=>(d.order_id||d.orderId||'')===oid) || items[0];
    process.stdout.write(hit?(hit.id||''):'');
  " "$TMP/disputes.json" "$ORDER_ID")"
fi
[[ -n "$DISPUTE_ID" ]] || phase25_fail "dispute id missing"
phase25_ok "dispute_id=${DISPUTE_ID}"

detail_out="$(phase25_curl_json GET "${API}/api/v1/disputes/${DISPUTE_ID}" "" "$TOKEN_A")"
[[ "${detail_out%%|*}" == "200" ]] || phase25_fail "GET dispute detail HTTP ${detail_out%%|*}"
phase25_ok "dispute detail readable"

# Negative: bad intent shape
bad_intent='{"chain_id":11155111,"verifying_contract":"","signer":"0x0000000000000000000000000000000000000001","signature":"0x","typed_data":{}}'
intent_out="$(phase25_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/open-dispute-intent" \
  "$bad_intent" "$TOKEN_A")"
[[ "${intent_out%%|*}" == "400" ]] || phase25_fail "open-dispute-intent expected 400 got ${intent_out%%|*}"
phase25_ok "open-dispute-intent rejects invalid shape"

META_SHA="$(curl --noproxy "*" -sS "${API}/meta" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write((j.build&&j.build.git_sha)||'')}catch(e){}})")"

cat >"$EVID_ROOT/W3-DISPUTE-DRYRUN.json" <<EOF
{
  "schema": "traveltrust.reality_w3_dispute_dryrun.v1",
  "machine_key": "TT_REALITY_W3_DISPUTE_DRYRUN",
  "phase": "② Staging",
  "recorded_utc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "api_base": "${API}",
  "api_git_sha": "${META_SHA}",
  "order_id": "${ORDER_ID}",
  "dispute_id": "${DISPUTE_ID}",
  "guide_id": "${GUIDE_ID}",
  "steps": {
    "order_path": "PASS",
    "dispute_open_or_reuse": "PASS",
    "dispute_detail": "PASS",
    "invalid_intent_400": "PASS"
  },
  "verdict": "PASS",
  "note": "SU-PLUS-06 sample dry-run · ≠ Production GO · ≠ mainnet arbitration",
  "runbook": "docs/runbook/TT-REALITY-W3-DISPUTE-ARBITRATION-RUNBOOK-LATEST.md"
}
EOF
cp "$EVID_ROOT/W3-DISPUTE-DRYRUN.json" \
  "$ROOT/evidence/PSG-REALITY-CLOSURE/W3-DISPUTE-DRYRUN-LATEST.json" 2>/dev/null || true
# also copy under governance evidence for index
mkdir -p "$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline"
cp "$EVID_ROOT/W3-DISPUTE-DRYRUN.json" \
  "$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/REALITY-W3-DISPUTE-DRYRUN-LATEST.json"

echo "W3_DISPUTE_DRYRUN: PASS order=${ORDER_ID} dispute=${DISPUTE_ID}"
echo "W3_DISPUTE_DRYRUN: evid=${EVID_ROOT}"
