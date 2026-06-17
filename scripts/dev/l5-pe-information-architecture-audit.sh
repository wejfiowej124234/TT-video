#!/usr/bin/env bash
# L5 Product Excellence · Information Architecture audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE Information Architecture Audit =="
check "admin sidebar SSOT" "rg -q 'ADMIN_SHELL_SIDEBAR_GROUPS' '$ROOT/frontend/lib/admin/adminShellSidebarModel.ts'"
check "me settings nav" "rg -q 'MeSettingsNavSection' '$ROOT/frontend/lib/me/meSettingsNavModel.ts'"
check "five main freeze" "test -f '$ROOT/frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md'"
check "growth nav links" "rg -q 'ADMIN_SHELL_GROWTH_NAV_LINKS' '$ROOT/frontend/lib/admin/adminShellGrowthNavLinks.ts'"
check "conversion in nav" "rg -q 'conversion-analytics' '$ROOT/frontend/lib/admin/adminShellMoreNavLinks.ts'"
check "growth hub links" "rg -q 'data-tt-admin-growth-hub-link' '$ROOT/frontend/app/admin/growth/AdminGrowthHubMain.tsx'"
[[ "$fail" -eq 0 ]] && echo "TT_IA: IA_L5_GO" || { echo "TT_IA: HOLD"; exit 2; }
