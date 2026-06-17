#!/usr/bin/env bash
# P0-01～P0-03 + bootstrap-phase2-g1-g2.sh（暂停新功能 · 无链上 broadcast）
#
#   bash scripts/dev/phase2-staging-p0-clearance.sh
#   STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/phase2-staging-p0-clearance.sh
#   PHASE2_STAGING_FLY_DEPLOY=1 bash scripts/dev/phase2-staging-p0-clearance.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "phase2-staging-p0-clearance: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-staging-p0-clearance: OK $*"; }

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"

echo "=== P0-01 · Stripe Test Mode ==="
stripe_lib_load_staging_env
stripe_lib_validate_stripe_secret_key || fail "P0-01 Stripe sk_test invalid"
[[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] || fail "P0-01 whsec unset"
[[ "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" == whsec_* ]] || fail "P0-01 whsec format"
ok "P0-01 Stripe keys valid"

echo "=== P0-03 · Sepolia env merge ==="
bash "$ROOT/scripts/dev/phase2-staging-merge-sepolia-env.sh"

echo "=== P0-02 · Fly persistent HTTPS ==="
STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API_BASE="${STAGING_API_BASE%/}"

if [[ "${PHASE2_STAGING_FLY_DEPLOY:-0}" == "1" ]]; then
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh"
else
  hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "${STAGING_API_BASE}/health" 2>/dev/null || echo 000)"
  if [[ "$hc" != "200" ]]; then
    echo "phase2-staging-p0-clearance: WARN ${STAGING_API_BASE}/health=$hc — run:" >&2
    echo "  fly auth login" >&2
    echo "  PHASE2_STAGING_FLY_DEPLOY=1 bash scripts/dev/phase2-staging-p0-clearance.sh" >&2
    fail "P0-02 Fly not reachable (fly.io may be blocked on this network)"
  fi
  ok "P0-02 ${STAGING_API_BASE}/health=200"
fi

echo "=== bootstrap-phase2-g1-g2.sh ==="
export STAGING_API_BASE
bash "$ROOT/scripts/dev/bootstrap-phase2-g1-g2.sh"

ok "P0-01～P0-03 + bootstrap complete · next: T9/C1-C12 full matrix (already in bootstrap tail)"
