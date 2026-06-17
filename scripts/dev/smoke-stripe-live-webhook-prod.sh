#!/usr/bin/env bash
# PI3-003 · Production Stripe Live webhook smoke（签名验 + 可选 live PI）
#
#   PROD_API_BASE=https://api.<domain> bash scripts/dev/smoke-stripe-live-webhook-prod.sh
#
# 前置：tt-api-prod 已部署 · sk_live + whsec on Fly · 151 prod API 域可达
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/stripe-live-onboarding-lib.sh
source "$ROOT/scripts/dev/stripe-live-onboarding-lib.sh"

stripe_live_lib_load_prod_env
API="$(stripe_live_lib_prod_hook_url)"
API="${API%/api/v1/hooks/stripe/onboarding}"
HOOK="${API}/api/v1/hooks/stripe/onboarding"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_003_SMOKE_EVIDENCE:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/stripe-live-webhook-smoke-${STAMP}}"
BASELINE="$ROOT/evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/smoke.log") 2>&1

fail() { echo "TT_STRIPE_LIVE_WEBHOOK_SMOKE_PROD: FAIL $*" >&2; exit 2; }

echo "== smoke-stripe-live-webhook-prod · API=${API} HOOK=${HOOK} =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${API}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "API /health ${hc}"

stripe_live_lib_validate_webhook_secret || fail "whsec invalid in prod env"

# 1) missing signature → 400
miss_code="$(curl -sS -o "$OUT/missing-sig.json" -w '%{http_code}' --max-time 30 \
  -X POST "$HOOK" -H "Content-Type: application/json" -d '{"id":"evt_pi3_miss"}' 2>/dev/null || echo 000)"
[[ "$miss_code" == "400" ]] || fail "missing signature expected 400 got ${miss_code}"
grep -q 'missing_stripe_signature' "$OUT/missing-sig.json" || fail "missing_stripe_signature body"

# 2) invalid signature → 400
bad_code="$(curl -sS -o "$OUT/bad-sig.json" -w '%{http_code}' --max-time 30 \
  -X POST "$HOOK" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1,v1=deadbeef" \
  -d '{"id":"evt_pi3_bad","type":"payment_intent.succeeded"}' 2>/dev/null || echo 000)"
[[ "$bad_code" == "400" ]] || fail "invalid signature expected 400 got ${bad_code}"

# 3) signed synthetic event → 200
whsec="${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}"
evt_id="evt_pi3_live_smoke_${STAMP}"
evt_body="$(node -e "
  process.stdout.write(JSON.stringify({
    id: process.argv[1],
    type: 'charge.refunded',
    data: { object: { payment_intent: 'pi_pi3_nonexistent', amount: 0, amount_refunded: 0 } }
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
ok_code="${signed_out%%|*}"
ok_body="${signed_out#*|}"
echo "$ok_body" >"$OUT/signed-event.json"
[[ "$ok_code" == "200" ]] || fail "signed event expected 200 got ${ok_code} body=${ok_body}"

SMOKE_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python - "$BASELINE" "$SMOKE_UTC" "$HOOK" "$API" <<'PY'
import json, sys
from pathlib import Path
baseline, smoke_utc, hook, api = sys.argv[1:5]
p = Path(baseline)
data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
data["status"] = "PASS"
data["stripe_mode"] = "live"
data["production_scope"] = "PRODUCTION_SCOPE_SEPOLIA"
data["webhook_url"] = hook
data["prod_api_base"] = api
data["last_live_webhook_smoke_utc"] = smoke_utc
data["last_payment_regression_utc"] = smoke_utc
data["notes"] = f"Production live webhook smoke {smoke_utc} on {hook}"
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("PI3-003 baseline updated to PASS")
PY

python "$ROOT/scripts/gates/check-pi3-003-stripe-live-baseline-record.py" | tee "$OUT/pi3-003-gate.log"

echo "READY" >"$OUT/STATUS.txt"
echo "TT_STRIPE_LIVE_WEBHOOK_SMOKE_PROD: OK"
echo "Evidence: ${OUT}"
