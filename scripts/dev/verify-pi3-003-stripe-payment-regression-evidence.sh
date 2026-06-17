#!/usr/bin/env bash
# Stripe payment regression evidence chain（PI3-003 · staging baseline + prod optional）
#
#   bash scripts/dev/verify-pi3-003-stripe-payment-regression-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASELINE="$ROOT/evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · PI3-003 baseline record"
[[ -f "$BASELINE" ]] && pass "baseline_record.v1.json present" || fail "missing PI3-003 baseline"
python "$ROOT/scripts/gates/check-pi3-003-stripe-live-baseline-record.py" >/dev/null 2>&1 \
  && pass "PI3-003 shape gate OK" || fail "PI3-003 shape gate FAIL"
st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('status',''))" "$BASELINE")"
pass "PI3-003 status=${st}"

section "2 · Staging payment / webhook regression (②)"
[[ -f "$ROOT/scripts/dev/smoke-onboarding-testnet.sh" ]] && pass "smoke-onboarding-testnet.sh" || fail "missing onboarding smoke"
[[ -f "$ROOT/scripts/dev/smoke-phase25-h3-stripe-webhook-exceptions-staging.sh" ]] \
  && pass "H3 webhook exception smoke" || fail "missing H3 smoke"
if ls "$ROOT/evidence/GO_phase2_testnet_20260526/onboarding-smoke"/run-*.log >/dev/null 2>&1; then
  pass "onboarding-smoke evidence logs present"
else
  warn "no onboarding-smoke run-*.log (staging smoke may not have been recorded)"
fi

section "3 · Prod live webhook smoke evidence"
latest_prod="$(ls -d "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/stripe-live-webhook-smoke-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_prod" && -f "${latest_prod}/STATUS.txt" ]]; then
  pst="$(cat "${latest_prod}/STATUS.txt")"
  [[ "$pst" == "READY" ]] && pass "prod live webhook smoke READY (${latest_prod##*/})" || warn "prod smoke STATUS=${pst}"
else
  if [[ "$st" == "PASS" ]]; then
    fail "PI3-003 PASS but no stripe-live-webhook-smoke evidence"
  else
    warn "no prod live webhook smoke (expected until Owner runs smoke-stripe-live-webhook-prod.sh)"
  fi
fi

section "4 · Prod webhook register evidence"
latest_reg="$(ls -d "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/stripe-live-webhook-register-* 2>/dev/null | sort | tail -1 || true)"
[[ -n "$latest_reg" ]] && pass "webhook register evidence (${latest_reg##*/})" || warn "no stripe-live-webhook-register evidence"

section "5 · Derived GO readiness"
if [[ "$st" == "PASS" ]]; then
  pass "PI3-003 PASS → payment regression chain closed for Production GO"
else
  warn "PI3-003 ${st} → live payment regression not closed"
fi

echo ""
echo "verify-pi3-003-stripe-payment-regression-evidence: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
