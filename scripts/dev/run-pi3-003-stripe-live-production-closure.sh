#!/usr/bin/env bash
# PI3-003 · Stripe Live Production closure (secrets + webhook + smoke + gate)
#
# Classification (2026-07-08): P1 optional onboarding fiat on-ramp — NOT core trip/market payment.
# Core G3-02 payment verification: scripts/check-web3-payment-production-readiness.sh
#
# Prerequisites:
#   - OCS_PRODUCTION_PARITY_AUDIT=PASS
#   - scripts/dev/.env.production.local with sk_live_* + whsec_* + TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1
#
# Usage:
#   bash scripts/dev/run-pi3-003-stripe-live-production-closure.sh
#   PROD_API_BASE=https://tt-api-prod.fly.dev bash scripts/dev/run-pi3-003-stripe-live-production-closure.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${PI3_003_CLOSURE_EVIDENCE:-$ROOT/evidence/GO_production_readiness/G3-03/pi3-003-closure-${STAMP}}"
ENV_FILE="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"
PROD_API="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/closure.log") 2>&1

echo "== PI3-003 Stripe Live Production Closure · ${STAMP} =="
echo "prod_api=${PROD_API}"
echo "discipline: OCS PASS → Stripe Live → CDN → Domain → Monitoring → Backup → Owner Signoff"

# 0 · OCS parity gate (must be PASS before Stripe Live)
ocs_latest="$ROOT/evidence/GO_ocs_production_bootstrap/OCS-PROD-BOOTSTRAP-LATEST.json"
if [[ -f "$ocs_latest" ]]; then
  ocs_parity="$(node -e "const j=require(process.argv[1]); process.stdout.write(j.machine_keys?.OCS_PRODUCTION_PARITY_AUDIT||'UNKNOWN');" "$ocs_latest")"
  echo "OCS_PRODUCTION_PARITY_AUDIT=${ocs_parity}"
  [[ "$ocs_parity" == "PASS" ]] || { echo "FAIL: OCS parity must be PASS before Stripe Live"; exit 2; }
else
  echo "WARN: missing ${ocs_latest} — confirm OCS parity manually"
fi

# 1 · Env alignment (WARN/FAIL logged; continue to secret probe)
PROD_API_BASE="${PROD_API}" bash "$ROOT/scripts/dev/check-production-stripe-env-alignment.sh" | tee "$EVID/env-alignment.log" || true

# shellcheck source=scripts/dev/stripe-live-onboarding-lib.sh
source "$ROOT/scripts/dev/stripe-live-onboarding-lib.sh"
stripe_live_lib_load_prod_env

if ! stripe_live_lib_validate_live_secret_key; then
  echo "PI3-003_WAITING_OWNER_STRIPE: fill TRAVELTRUST_STRIPE_SECRET_KEY=sk_live_* in ${ENV_FILE}"
  node -e "
    const fs=require('fs');
    fs.writeFileSync(process.argv[1], JSON.stringify({
      schema:'traveltrust.pi3_003_stripe_live_closure.v1',
      stamp:process.argv[2],
      verdict:'PI3-003_WAITING_OWNER_STRIPE',
      blocker:'TRAVELTRUST_STRIPE_SECRET_KEY missing or invalid',
      next_steps:[
        'Owner: Stripe Dashboard → Live mode → API keys → sk_live_*',
        'Owner: register webhook or copy whsec_*',
        'Edit scripts/dev/.env.production.local (never commit)',
        'bash scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh',
        'PROD_API_BASE=${PROD_API} bash scripts/dev/register-stripe-live-webhook-prod.sh',
        'PROD_API_BASE=${PROD_API} bash scripts/dev/smoke-stripe-live-webhook-prod.sh',
        'bash scripts/dev/run-pi3-003-stripe-live-production-closure.sh'
      ]
    },null,2)+'\n');
  " "$EVID/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json" "$STAMP"
  cp "$EVID/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json" "$ROOT/evidence/GO_production_readiness/G3-03/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json" 2>/dev/null || true
  exit 0
fi

if ! stripe_live_lib_validate_webhook_secret; then
  echo "PI3-003_WAITING_OWNER_STRIPE: fill TRAVELTRUST_STRIPE_WEBHOOK_SECRET=whsec_* in ${ENV_FILE}"
  echo "  Or run: PROD_API_BASE=${PROD_API} bash scripts/dev/register-stripe-live-webhook-prod.sh"
  exit 0
fi

# 2 · Fly secrets (no values printed)
bash "$ROOT/scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh" | tee "$EVID/sync-fly-secrets.log"

# 3 · Webhook register (idempotent)
PROD_API_BASE="${PROD_API}" bash "$ROOT/scripts/dev/register-stripe-live-webhook-prod.sh" | tee "$EVID/register-webhook.log"

# Re-sync if register created new whsec
bash "$ROOT/scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh" | tee -a "$EVID/sync-fly-secrets.log"

# 4 · Live webhook smoke (signature + signed event)
PROD_API_BASE="${PROD_API}" bash "$ROOT/scripts/dev/smoke-stripe-live-webhook-prod.sh" | tee "$EVID/smoke-webhook.log"

# 5 · Full PI3-003 gate
bash "$ROOT/scripts/check-pi3-003-stripe-live-production-webhook-execution.sh" | tee "$EVID/pi3-003-gate.log"

verdict="$(node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write(j.verdict||'UNKNOWN');" \
  "$(ls -td "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-003-exec-"* 2>/dev/null | head -1)/summary.json")"

node -e "
  const fs=require('fs');
  const out={
    schema:'traveltrust.pi3_003_stripe_live_closure.v1',
    stamp:process.argv[1],
    prod_api:process.argv[2],
    verdict:process.argv[3],
    machine_keys:{
      PI3_003_STRIPE_LIVE: process.argv[3]==='PI3-003_GO'?'PASS':'FAIL',
      TT_PRODUCTION_STRIPE_LIVE: process.argv[3]==='PI3-003_GO'?'READY':'NOT_READY'
    },
    evidence_dir:process.argv[4]
  };
  fs.writeFileSync(process.argv[5], JSON.stringify(out,null,2)+'\n');
" "$STAMP" "$PROD_API" "$verdict" "$EVID" "$EVID/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json"

mkdir -p "$ROOT/evidence/GO_production_readiness/G3-03"
cp "$EVID/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json" "$ROOT/evidence/GO_production_readiness/G3-03/PI3-003-STRIPE-LIVE-CLOSURE-LATEST.json"

echo ""
echo "PI3-003 closure verdict: ${verdict}"
echo "Evidence: ${EVID}"
[[ "$verdict" == "PI3-003_GO" ]] || exit 2
