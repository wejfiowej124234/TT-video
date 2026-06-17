#!/usr/bin/env bash
# Sync Stripe Live onboarding secrets to Fly tt-api-prod（PI3-003 · Owner）
#
#   cp scripts/dev/.env.production.example scripts/dev/.env.production.local
#   # 填 sk_live_* · whsec_* · DATABASE_URL 等
#   bash scripts/dev/sync-fly-stripe-onboarding-secrets-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"
FLY_APP="${FLY_PROD_API_APP:-tt-api-prod}"

[[ -f "$ENV_FILE" ]] || { echo "FAIL: missing $ENV_FILE" >&2; exit 2; }

# shellcheck source=scripts/dev/stripe-live-onboarding-lib.sh
source "$ROOT/scripts/dev/stripe-live-onboarding-lib.sh"
stripe_live_lib_merge_env_file "$ENV_FILE"

stripe_live_lib_validate_live_secret_key || exit 2
stripe_live_lib_validate_webhook_secret || exit 2

echo "sync-fly-stripe-onboarding-secrets-prod: setting secrets on ${FLY_APP} (no values printed)"
fly secrets set \
  "TRAVELTRUST_STRIPE_SECRET_KEY=${TRAVELTRUST_STRIPE_SECRET_KEY}" \
  "TRAVELTRUST_STRIPE_WEBHOOK_SECRET=${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" \
  "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1" \
  -a "$FLY_APP"

echo "TT_SYNC_FLY_STRIPE_ONBOARDING_SECRETS_PROD: OK app=${FLY_APP}"
echo "  Next: bash scripts/dev/phase3-production-fly-deploy-and-sync.sh (if API redeploy needed)"
