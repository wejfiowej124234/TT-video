#!/usr/bin/env bash
# L5 Product Excellence · Mobile Responsive audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE Mobile Responsive Audit =="
check "sidebar media query" "rg -q 'ADMIN_SHELL_SIDEBAR_LAYOUT_MEDIA' '$ROOT/frontend/lib/admin/useAdminShellSidebarVisible.ts'"
check "admin mobile nav fold" "rg -q 'data-tt-admin-shell-mobile-nav-fold' '$ROOT/frontend/components/admin/AdminShellBar.tsx'"
check "touch target helpers" "rg -q 'touchTargetLink44Classes' '$ROOT/frontend/lib/travelLinkFocus.ts'"
check "community feed" "test -f '$ROOT/frontend/components/community/CommunityFeedMain.tsx'"
check "me settings flow" "rg -q 'MeSettingsL5FlowPage' '$ROOT/frontend/app/me/referrals/MeReferralsPageMain.tsx'"
check "growth hub grid" "rg -q 'sm:grid-cols-2' '$ROOT/frontend/app/admin/growth/AdminGrowthHubMain.tsx'"
[[ "$fail" -eq 0 ]] && echo "TT_MOBILE: MOBILE_L5_GO" || { echo "TT_MOBILE: HOLD"; exit 2; }
