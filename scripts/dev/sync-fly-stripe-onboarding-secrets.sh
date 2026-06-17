#!/usr/bin/env bash
# Sync Stripe onboarding secrets to Fly tt-api-staging (G4 · whsec + sk_test).
#
# Prereq: fly auth login · scripts/dev/.env.staging-secrets.local filled
#
#   bash scripts/dev/sync-fly-stripe-onboarding-secrets.sh
#
# Optional: FLY_APP=tt-api-staging
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${STAGING_SECRETS_FILE:-$ROOT/scripts/dev/.env.staging-secrets.local}"
FLY_APP="${FLY_APP:-tt-api-staging}"

[[ -f "$ENV_FILE" ]] || { echo "FAIL: missing $ENV_FILE" >&2; exit 2; }

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"
stripe_lib_merge_env_file "$ENV_FILE"

stripe_lib_validate_stripe_secret_key || exit 2
[[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] || { echo "FAIL: TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset" >&2; exit 2; }
[[ "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" == whsec_* ]] || { echo "FAIL: whsec required" >&2; exit 2; }

echo "sync-fly-stripe-onboarding-secrets: setting secrets on ${FLY_APP} (no values printed)"
fly secrets set \
  "TRAVELTRUST_STRIPE_SECRET_KEY=${TRAVELTRUST_STRIPE_SECRET_KEY}" \
  "TRAVELTRUST_STRIPE_WEBHOOK_SECRET=${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" \
  "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1" \
  -a "$FLY_APP"

echo "TT_SYNC_FLY_STRIPE_ONBOARDING_SECRETS: OK app=${FLY_APP}"
echo "  Next: fly deploy -c deploy/fly/tt-api-staging/fly.toml (if API code changed)"
echo "  Then: SKIP_API_RESTART=1 bash scripts/dev/record-phase2-closing-gap-g4-g5-evidence.sh"
