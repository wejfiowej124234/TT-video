#!/usr/bin/env bash
# Stripe webhook signature verification · static SSOT（PI3-003 · no product code change）
#
#   bash scripts/dev/verify-production-stripe-webhook-signature-static.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · Route + handler SSOT"
rg -q 'hooks/stripe/onboarding' crates/api/src/routes/onboarding/mod.rs \
  && pass "onboarding routes document stripe webhook path" || fail "webhook path missing in onboarding mod"
rg -q 'stripe_webhook_not_configured' crates/api/src/stripe_onboarding_legacy_monolith.rs \
  && pass "503 stripe_webhook_not_configured when whsec unset" || fail "whsec guard missing"
rg -q 'stripe_webhook_invalid_signature' crates/api/src/stripe_onboarding_legacy_monolith.rs \
  && pass "400 stripe_webhook_invalid_signature" || fail "invalid signature path missing"
rg -q 'Stripe-Signature' crates/api/src/stripe_onboarding_legacy_monolith.rs \
  && pass "Stripe-Signature header verified" || fail "Stripe-Signature handling missing"

section "2 · Auth public whitelist"
grep -q 'path.starts_with("/api/v1/hooks/")' "$ROOT/crates/api/src/middleware/auth_pause_metrics/mod.rs" \
  && pass "stripe webhook on auth public whitelist (/api/v1/hooks/)" || fail "hooks public whitelist missing"

section "3 · Staging regression script (② baseline)"
[[ -f "$ROOT/scripts/dev/smoke-phase25-h3-stripe-webhook-exceptions-staging.sh" ]] \
  && pass "staging H3 webhook exception smoke present" || fail "missing H3 staging smoke"

section "4 · Prod env template"
rg -q 'TRAVELTRUST_STRIPE_SECRET_KEY=sk_live' "$ROOT/scripts/dev/.env.production.example" \
  && pass ".env.production.example registers sk_live" || fail "sk_live missing in prod example"
rg -q 'TRAVELTRUST_STRIPE_WEBHOOK_SECRET=whsec' "$ROOT/scripts/dev/.env.production.example" \
  && pass ".env.production.example registers whsec" || fail "whsec missing in prod example"
rg -q 'TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1' "$ROOT/scripts/dev/.env.production.example" \
  && pass "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1 documented" || fail "stripe enabled flag missing"

section "5 · 121 webhook URL topology"
rg -q 'api\.<brand-domain>/api/v1/hooks/stripe/onboarding' \
  "$ROOT/docs/handbook/engineering/121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md" \
  && pass "121 prod webhook URL template" || warn "121 webhook template grep miss"

echo ""
echo "verify-production-stripe-webhook-signature-static: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
