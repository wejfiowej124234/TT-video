#!/usr/bin/env bash
# Phase 2.5 · CH-H03 · Stripe webhook exception + charge.refunded staging smoke
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-phase25-h3-stripe-webhook-exceptions-staging.sh
#
# Requires: TRAVELTRUST_STRIPE_WEBHOOK_SECRET (whsec) on staging or in .env.staging-secrets.local
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"
# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"

API="$(phase25_api_base)"
HOOK="${API}/api/v1/hooks/stripe/onboarding"
STAMP="$(date +%s)"

echo "== smoke-phase25-h3-stripe-webhook-exceptions-staging HOOK=${HOOK} =="
phase25_require_health "$API"

stripe_lib_load_staging_env
export API_BASE="$API"

# 1) Missing signature → 400
missing_code="$(curl --noproxy "*" -sS -o /tmp/p25-wh-miss.json -w '%{http_code}' \
  -X POST "$HOOK" -H "Content-Type: application/json" -d '{"id":"evt_p25_miss"}' 2>/dev/null || echo "000")"
[[ "$missing_code" == "400" ]] || phase25_fail "missing Stripe-Signature expected 400 got ${missing_code}"
grep -q 'missing_stripe_signature' /tmp/p25-wh-miss.json || phase25_fail "missing_stripe_signature not in body"
phase25_ok "webhook rejects missing signature (400)"

# 2) Invalid signature → 400
bad_code="$(curl --noproxy "*" -sS -o /tmp/p25-wh-bad.json -w '%{http_code}' \
  -X POST "$HOOK" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=${STAMP},v1=deadbeef" \
  -d '{"id":"evt_p25_bad","type":"payment_intent.succeeded"}' 2>/dev/null || echo "000")"
[[ "$bad_code" == "400" ]] || phase25_fail "invalid signature expected 400 got ${bad_code}"
grep -q 'stripe_webhook_invalid_signature' /tmp/p25-wh-bad.json || \
  grep -q 'missing_stripe_signature' /tmp/p25-wh-bad.json || \
  phase25_fail "expected webhook signature error in body"
phase25_ok "webhook rejects invalid signature (400)"

# 3) Signed charge.refunded (synthetic) → 200 received/applied:false (refund path alive)
whsec="${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}"
if [[ -z "$whsec" ]] || stripe_lib_is_placeholder "$whsec"; then
  echo "phase25: SKIP signed charge.refunded (TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset)"
else
  evt_id="evt_p25_refund_${STAMP}"
  evt_body="$(node -e "
    process.stdout.write(JSON.stringify({
      id: process.argv[1],
      type: 'charge.refunded',
      data: { object: { payment_intent: 'pi_p25_nonexistent', amount: 0, amount_refunded: 0 } }
    }));
  " "$evt_id")"
  signed_out="$(WHSEC="$whsec" HOOK="$HOOK" node -e "
    const crypto=require('crypto');
    const body=process.argv[1];
    const secret=Buffer.from(process.env.WHSEC.replace(/^whsec_/,''),'base64');
    const ts=Math.floor(Date.now()/1000);
    const sig=crypto.createHmac('sha256',secret).update(ts+'.'+body).digest('hex');
    fetch(process.env.HOOK,{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':'t='+ts+',v1='+sig},body})
      .then(async r=>{const t=await r.text(); process.stdout.write(r.status+'|'+t);})
      .catch(e=>{process.stdout.write('000|'+e.message);});
  " "$evt_body")"
  ref_code="${signed_out%%|*}"
  ref_body="${signed_out#*|}"
  [[ "$ref_code" == "200" ]] || phase25_fail "signed charge.refunded expected 200 got ${ref_code} body=${ref_body}"
  echo "$ref_body" | grep -q '"received".*true' || phase25_fail "charge.refunded missing received:true"
  phase25_ok "signed charge.refunded accepted (200 · refund handler reachable)"
fi

rm -f /tmp/p25-wh-miss.json /tmp/p25-wh-bad.json 2>/dev/null || true
echo "TT_PHASE25_H3_STRIPE_WEBHOOK_EXCEPTIONS: OK"
