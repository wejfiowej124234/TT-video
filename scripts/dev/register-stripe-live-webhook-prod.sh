#!/usr/bin/env bash
# Register Stripe Live webhook endpoint on prod API domain（PI3-003 · Owner）
#
#   PROD_API_BASE=https://api.<domain> bash scripts/dev/register-stripe-live-webhook-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/stripe-live-onboarding-lib.sh
source "$ROOT/scripts/dev/stripe-live-onboarding-lib.sh"

stripe_live_lib_load_prod_env
HOOK="$(stripe_live_lib_prod_hook_url)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_003_WEBHOOK_REGISTER_EVIDENCE:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/stripe-live-webhook-register-${STAMP}}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/register.log") 2>&1

echo "== register Stripe Live webhook · ${HOOK} =="
whsec="$(stripe_live_lib_ensure_webhook_endpoint "$HOOK" | tee "$OUT/whsec-shape.txt")"
echo "whsec_len=${#whsec}" >"$OUT/whsec-meta.txt"

echo "webhook_url=${HOOK}" >"$OUT/webhook-url.txt"
echo "READY" >"$OUT/STATUS.txt"
echo "TT_REGISTER_STRIPE_LIVE_WEBHOOK_PROD: OK"
echo "Evidence: ${OUT}"
echo "  Save whsec to .env.production.local TRAVELTRUST_STRIPE_WEBHOOK_SECRET if newly created"
echo "  Then: bash scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh"
