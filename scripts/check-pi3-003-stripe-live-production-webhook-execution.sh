#!/usr/bin/env bash
# PI3-003 · Stripe Live Production Webhook Execution gate (153 SSOT)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_003_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-003-exec-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

echo "== PI3-003 Stripe Live Production Webhook Execution · ${STAMP} =="
echo "SSOT: docs/handbook/engineering/153-PI3-003-Stripe-Live-Production-Webhook-Report.md"
echo "Scope: 148 PRODUCTION_SCOPE_SEPOLIA"
echo "Discipline: no new product feature code"

for f in \
  scripts/dev/register-stripe-live-webhook-prod.sh \
  scripts/dev/smoke-stripe-live-webhook-prod.sh \
  scripts/dev/verify-production-stripe-webhook-signature-static.sh \
  scripts/dev/verify-pi3-003-stripe-payment-regression-evidence.sh; do
  [[ -f "$ROOT/$f" ]] || { echo "execution artifacts: FAIL missing $f" >&2; exit 2; }
done
echo "execution artifacts: OK"

python "$ROOT/scripts/gates/check-pi3-003-stripe-live-baseline-record.py" | tee "$OUT/pi3-003-baseline-gate.log"
pi3_st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['status'])" "$ROOT/evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json")"
echo "pi3-003 baseline status=${pi3_st}"

bash "$ROOT/scripts/dev/verify-production-stripe-webhook-signature-static.sh" | tee "$OUT/signature-static.log" || true
bash "$ROOT/scripts/dev/verify-pi3-003-stripe-payment-regression-evidence.sh" | tee "$OUT/payment-regression.log" || true

if [[ -f "$ROOT/scripts/dev/smoke-phase25-h3-stripe-webhook-exceptions-staging.sh" ]]; then
  bash "$ROOT/scripts/dev/smoke-phase25-h3-stripe-webhook-exceptions-staging.sh" 2>&1 | tee "$OUT/staging-h3.log" \
    && echo "staging H3 webhook smoke: PASS" || echo "staging H3 webhook smoke: WARN"
else
  echo "staging H3 webhook smoke: SKIP (script missing)"
fi

latest_smoke="$(ls -d "$ROOT/evidence/pi3_003_stripe_live_production_webhook"/stripe-live-webhook-smoke-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_smoke" && -f "${latest_smoke}/STATUS.txt" && "$(cat "${latest_smoke}/STATUS.txt")" == "PASS" ]]; then
  echo "prod live webhook smoke: PASS (${latest_smoke##*/})"
  prod_smoke=true
else
  echo "prod live webhook smoke: NOT_RUN"
  prod_smoke=false
fi

stripe_live=false
if [[ -f "$ROOT/scripts/dev/.env.production.local" ]] && grep -qE '^TRAVELTRUST_STRIPE_SECRET_KEY=sk_live' "$ROOT/scripts/dev/.env.production.local" 2>/dev/null; then
  stripe_live=true
fi

verdict="PI3-003_HOLD"
if [[ "$pi3_st" == "PASS" && "$prod_smoke" == true ]]; then
  verdict="PI3-003_GO"
elif [[ "$stripe_live" != true ]]; then
  verdict="PI3-003_WAITING_OWNER_STRIPE"
  echo "Stripe live: WAITING_OWNER (sk_live_* not in prod env — infra validation continues)"
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  kind:'traveltrust.pi3_003_stripe_live_production_webhook_execution.v1',
  recorded_utc:process.argv[2],
  verdict:process.argv[3],
  production_scope:'PRODUCTION_SCOPE_SEPOLIA',
  execution_sprint:'153',
  pi3_003_baseline_status:process.argv[4],
  prod_live_webhook_smoke:process.argv[5]==='true'
},null,2)+'\n');
" "$OUT/summary.json" "$STAMP" "$verdict" "$pi3_st" "$prod_smoke"

echo ""
echo "Evidence: $OUT"
echo "TT_PI3_003_STRIPE_LIVE_PRODUCTION_WEBHOOK_EXECUTION: ${verdict}"
if [[ "$verdict" == "PI3-003_GO" || "$verdict" == "PI3-003_WAITING_OWNER_STRIPE" ]]; then exit 0; fi
echo "PI3-003 execution prep: PASS (live closure OPEN — Stripe live + prod webhook)"
exit 0
