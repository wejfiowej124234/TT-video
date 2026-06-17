#!/usr/bin/env bash
# Six-domain matrix verification（PI3-004 · staging baseline + optional prod）
#
#   bash scripts/dev/verify-pi3-004-six-domain-matrix.sh
#   PROD_WEB_BASE=… PROD_API_BASE=… bash scripts/dev/verify-pi3-004-six-domain-matrix.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · Staging six-domain UAT (② baseline · must exist)"
[[ -f "$ROOT/scripts/dev/run-staging-uat-six-domains.sh" ]] && pass "run-staging-uat-six-domains.sh" || fail "missing staging UAT script"
[[ -f "$ROOT/frontend/e2e/staging-uat-six-domains.spec.ts" ]] && pass "Playwright six-domain spec" || fail "missing spec"

if [[ -L "$ROOT/evidence/staging-uat-six-domains/latest" || -d "$ROOT/evidence/staging-uat-six-domains/latest" ]]; then
  pass "staging-uat-six-domains/latest evidence"
  [[ -f "$ROOT/evidence/staging-uat-six-domains/latest/uat-findings.json" ]] \
    && pass "staging uat-findings.json" || warn "staging uat-findings.json missing"
else
  latest="$(ls -d "$ROOT/evidence/staging-uat-six-domains"/*/ 2>/dev/null | sort | tail -1 || true)"
  if [[ -n "$latest" ]]; then
    pass "staging UAT dir ${latest##*/}"
  else
    warn "no staging six-domain UAT evidence — run run-staging-uat-six-domains.sh"
  fi
fi

section "2 · Production six-domain (Owner · optional)"
[[ -f "$ROOT/scripts/dev/run-production-uat-six-domains.sh" ]] && pass "run-production-uat-six-domains.sh" || fail "missing prod UAT script"
latest_prod="$(ls -d "$ROOT/evidence/pi3_004_production_readiness_verification"/prod-uat-six-domains-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_prod" && -f "${latest_prod}/STATUS.txt" ]]; then
  st="$(cat "${latest_prod}/STATUS.txt")"
  [[ "$st" == "READY" ]] && pass "prod six-domain UAT READY (${latest_prod##*/})" || warn "prod UAT STATUS=${st}"
else
  warn "no prod six-domain UAT evidence (expected until Owner runs run-production-uat-six-domains.sh)"
fi

section "3 · D1–D6 case anchors in PI3-004 report skeleton"
CHECK_DIR="$ROOT/evidence/pi3_004_production_readiness_verification/_six-domain-check"
rm -rf "$CHECK_DIR" 2>/dev/null || true
if python "$ROOT/scripts/dev/generate-pi3-004-production-report-skeleton.py" \
  --out "$CHECK_DIR" \
  --prod-api-base https://api.check.invalid \
  --prod-web-base https://app.check.invalid >/dev/null 2>&1; then
  for d in D1-DISCOVER-MKT D2-GUIDE-ESCROW D3-ORDERS-MSG D4-GOV-STAKE D5-ME-PROFILE D6-COMMUNITY-UGC; do
    if grep -q "\"id\": \"${d}\"" "$CHECK_DIR/report.json" 2>/dev/null; then
      pass "report case ${d}"
    else
      fail "missing ${d}"
    fi
  done
  rm -rf "$CHECK_DIR" 2>/dev/null || true
else
  fail "generate-pi3-004-production-report-skeleton.py"
fi

echo ""
echo "verify-pi3-004-six-domain-matrix: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
