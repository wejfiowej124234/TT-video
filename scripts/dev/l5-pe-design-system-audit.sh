#!/usr/bin/env bash
# L5 Product Excellence · Design System audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE Design System Audit =="
check "admin L5 tokens" "rg -q 'ADMIN_SHELL_NAV_IDLE_CLASS' '$ROOT/frontend/lib/adminUi.ts'"
check "ops state panel" "rg -q 'data-tt-ops-plane-loading' '$ROOT/frontend/components/admin/ops/OpsPlaneFetchStates.tsx'"
check "consumer state panel" "rg -q 'data-tt-cold-start-loading' '$ROOT/frontend/components/consumer/ConsumerSurfaceStatePanel.tsx'"
check "me settings shell" "rg -q 'MeSettingsL5FlowPage' '$ROOT/frontend/components/me/MeSettingsL5FlowPage.tsx'"
check "auth freeze doc" "test -f '$ROOT/frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md'"
check "home layout lock" "test -f '$ROOT/frontend/lib/traveltrustHomeLayoutLockL5.test.ts'"
[[ "$fail" -eq 0 ]] && echo "TT_DESIGN_SYSTEM: DESIGN_SYSTEM_L5_GO" || { echo "TT_DESIGN_SYSTEM: HOLD"; exit 2; }
