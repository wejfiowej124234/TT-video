#!/usr/bin/env bash
# L5 Product Excellence · Accessibility audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE Accessibility Audit =="
check "table a11y contract" "test -f '$ROOT/frontend/lib/admin/adminTableA11y.contract.test.ts'"
check "modal a11y contract" "test -f '$ROOT/frontend/lib/admin/adminModalA11yL5.contract.test.ts'"
check "consumer aria" "rg -q 'aria-label' '$ROOT/frontend/components/consumer/ConsumerSurfaceStatePanel.tsx'"
check "ops live region" "rg -q 'aria-live' '$ROOT/frontend/components/admin/ops/OpsPlaneFetchStates.tsx'"
check "focus rings" "rg -q 'travelFocusRing' '$ROOT/frontend/lib/travelLinkFocus.ts'"
check "error alert roles" "rg -q 'role=\"alert\"' '$ROOT/frontend/app/me/referrals/MeReferralsPageMain.tsx'"
[[ "$fail" -eq 0 ]] && echo "TT_ACCESSIBILITY: ACCESSIBILITY_L5_GO" || { echo "TT_ACCESSIBILITY: HOLD"; exit 2; }
