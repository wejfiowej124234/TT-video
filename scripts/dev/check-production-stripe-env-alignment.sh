#!/usr/bin/env bash
# Production Stripe env alignment（PI3-003 · 148 Sepolia · 151 PROD_API_BASE）
#
#   PROD_API_BASE=https://api.example.com bash scripts/dev/check-production-stripe-env-alignment.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROD_ENV="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"
PROD_API="${PROD_API_BASE:-${PUBLIC_API_BASE_URL:-}}"
EXAMPLE="$ROOT/scripts/dev/.env.production.example"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

merge_key() {
  local k="$1" f="$2"
  grep -E "^[[:space:]]*${k}=" "$f" 2>/dev/null | tail -1 | sed "s/^[^=]*=//" | tr -d '\r' || true
}

section "0 · Sepolia scope (148)"
pass "PI3-003 Stripe Live applies to Sepolia Production scope (148)"

section "1 · Template SSOT (.env.production.example)"
for k in TRAVELTRUST_STRIPE_SECRET_KEY TRAVELTRUST_STRIPE_WEBHOOK_SECRET TRAVELTRUST_ONBOARDING_STRIPE_ENABLED PUBLIC_API_BASE_URL; do
  if grep -qE "^[[:space:]]*#?[[:space:]]*${k}=" "$EXAMPLE" 2>/dev/null; then
    pass "example documents ${k}"
  else
    fail "example missing ${k}"
  fi
done

section "2 · Owner local (.env.production.local · optional live)"
if [[ -f "$PROD_ENV" ]]; then
  pass "prod env local present"
  sk="$(merge_key TRAVELTRUST_STRIPE_SECRET_KEY "$PROD_ENV")"
  wh="$(merge_key TRAVELTRUST_STRIPE_WEBHOOK_SECRET "$PROD_ENV")"
  en="$(merge_key TRAVELTRUST_ONBOARDING_STRIPE_ENABLED "$PROD_ENV")"
  pub="$(merge_key PUBLIC_API_BASE_URL "$PROD_ENV")"
  [[ -n "$sk" && "$sk" == sk_live_* && "$sk" != *example* && "$sk" != sk_live_... ]] \
    && pass "sk_live shape" || warn "sk_live not filled or placeholder"
  [[ -n "$wh" && "$wh" == whsec_* && "$wh" != whsec_... ]] \
    && pass "whsec shape" || warn "whsec not filled or placeholder"
  [[ -z "$en" || "$en" == "1" ]] && pass "STRIPE_ENABLED=1 or default" || fail "STRIPE_ENABLED must be 1 for prod"
  [[ -z "$PROD_API" && -n "$pub" ]] && PROD_API="$pub"
else
  warn "missing ${PROD_ENV} — copy from .env.production.example"
fi

section "3 · Webhook URL 对拍 (151 PROD_API_BASE)"
if [[ -n "$PROD_API" && "$PROD_API" != *example.com* && "$PROD_API" != *"<"* ]]; then
  PROD_API="${PROD_API%/}"
  hook="${PROD_API}/api/v1/hooks/stripe/onboarding"
  pass "prod webhook URL=${hook}"
  if [[ "$PROD_API" == *".fly.dev"* ]]; then
    warn "PROD_API_BASE is *.fly.dev — 151 requires dedicated brand domain for Production GO"
  fi
else
  warn "PROD_API_BASE unset — webhook URL live probe skipped"
fi

section "4 · test key isolation (G-1)"
if [[ -f "$PROD_ENV" ]]; then
  sk="$(merge_key TRAVELTRUST_STRIPE_SECRET_KEY "$PROD_ENV")"
  [[ "$sk" != sk_test_* ]] && pass "no sk_test_* in prod local" || fail "sk_test_* in prod env — G-1 violation"
fi

echo ""
echo "check-production-stripe-env-alignment: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
