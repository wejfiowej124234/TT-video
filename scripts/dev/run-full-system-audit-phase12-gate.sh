#!/usr/bin/env bash
# TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST v1.3 · Phase ①→② subset (§11 D46–D60 + U12 hooks)
# Full master gate: bash scripts/dev/run-full-system-audit-master-gate.sh
#
#   bash scripts/dev/run-full-system-audit-phase12-gate.sh
#
# Optional:
#   SKIP_GO_LOCAL_PHASE1=1     — skip U12-1 (debug only; not valid U12 evidence)
#   SKIP_ENTERPRISE_BUNDLE=1   — skip run-final-system-audit.sh
#   SKIP_SITE10=1              — skip run-enterprise-site-10-local.sh (still need D60 manual matrix)
#   SKIP_CDIA=1                — skip cross-domain-integration-audit.py (needs running API)
#   SKIP_ACCOUNT_NAV=1         — skip smoke-account-nav-full-local.sh (needs running stack)
#
# Success grep: TT_FULL_SYSTEM_AUDIT_PHASE12: READY
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §11.0 · §3.1 U12
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0

run_step() {
  local label="$1"
  shift
  echo "== $label =="
  if "$@"; then
    echo "OK   $label"
  else
    echo "FAIL $label"
    fail=1
  fi
}

echo "== TT Full System Audit Phase ①→② Gate (D46–D60 bundle + U12 hooks) =="

if [[ "${SKIP_GO_LOCAL_PHASE1:-}" != "1" ]]; then
  run_step "U12-1 run-go-local-phase1-acceptance" bash "$ROOT/scripts/dev/run-go-local-phase1-acceptance.sh"
else
  echo "SKIP U12-1 (SKIP_GO_LOCAL_PHASE1=1) — not valid alone for U12"
fi

if [[ "${SKIP_ENTERPRISE_BUNDLE:-}" != "1" ]]; then
  run_step "D26-D45 run-final-system-audit" bash "$ROOT/scripts/dev/run-final-system-audit.sh"
else
  echo "SKIP enterprise bundle (SKIP_ENTERPRISE_BUNDLE=1)"
fi

run_step "D46 run-check-04-routes" bash "$ROOT/scripts/run-check-04-routes.sh"
run_step "D46 check-spec93-routes-vs-app (WARN default)" python "$ROOT/scripts/check-spec93-routes-vs-app.py"

run_step "D47 key error.tsx present" test \
  -f "$ROOT/frontend/app/error.tsx" \
  -a -f "$ROOT/frontend/app/admin/error.tsx" \
  -a -f "$ROOT/frontend/app/me/publish/error.tsx" \
  -a -f "$ROOT/frontend/app/auth/error.tsx"

run_step "D48 providerRegisterValidation vitest" bash -c "cd '$ROOT/frontend' && npx vitest run providerRegisterValidation --reporter=dot"

run_step "D50 l5-pe-mobile-responsive-audit" bash "$ROOT/scripts/dev/l5-pe-mobile-responsive-audit.sh"
run_step "D47/D50 l5-pe-accessibility-audit" bash "$ROOT/scripts/dev/l5-pe-accessibility-audit.sh"

run_step "D51 playwright multi-engine config" bash -c "rg -q 'chromium' '$ROOT/frontend/playwright.config.ts' && rg -q 'chromium-sepolia' '$ROOT/frontend/playwright.config.ts'"

run_step "D52 meta rate_limits field" rg -q 'rate_limits' "$ROOT/crates/api/src"

run_step "D53 upload-media route" rg -q 'upload-media' "$ROOT/crates/api/src"

run_step "D54 useMarketPage hook" test -f "$ROOT/frontend/components/market/useMarketPage.ts"

if [[ "${SKIP_CDIA:-}" != "1" ]]; then
  run_step "D55 cross-domain-integration-audit" python "$ROOT/scripts/dev/cross-domain-integration-audit.py"
else
  echo "SKIP D55 CDIA (SKIP_CDIA=1) — document manual idempotency check for U12"
fi

run_step "D57 terms/privacy/settings routes" test \
  -f "$ROOT/frontend/app/terms/page.tsx" \
  -a -f "$ROOT/frontend/app/privacy/page.tsx" \
  -a -f "$ROOT/frontend/app/me/settings/privacy/page.tsx" \
  -a -f "$ROOT/frontend/app/me/settings/data/page.tsx"

run_step "D59 page-brief analytics contract" rg -q 'analytics_events' "$ROOT/scripts/dev/post-start-api-abi-smoke.ps1"

run_step "D45 l5-pe-user-journey-audit" bash "$ROOT/scripts/dev/l5-pe-user-journey-audit.sh"

if [[ "${SKIP_ACCOUNT_NAV:-}" != "1" ]]; then
  run_step "D49/D57 smoke-account-nav-full-local" bash "$ROOT/scripts/dev/smoke-account-nav-full-local.sh"
else
  echo "SKIP account nav smoke (SKIP_ACCOUNT_NAV=1)"
fi

if [[ "${SKIP_SITE10:-}" != "1" ]]; then
  run_step "D60 run-enterprise-site-10-local" bash "$ROOT/scripts/dev/run-enterprise-site-10-local.sh"
else
  echo "SKIP site-10 (SKIP_SITE10=1) — U12 still requires D60 manual matrix in evidence/"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_FULL_SYSTEM_AUDIT_EXTREME: OK"
  echo "TT_FULL_SYSTEM_AUDIT_PHASE12: READY"
  echo "Note: D60 human acceptance matrix must be signed separately (§11 D60 table)."
  exit 0
fi

echo "TT_FULL_SYSTEM_AUDIT_EXTREME: FAIL"
echo "TT_FULL_SYSTEM_AUDIT_PHASE12: NO-GO"
exit 1
