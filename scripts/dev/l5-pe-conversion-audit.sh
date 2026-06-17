#!/usr/bin/env bash
# L5 Product Excellence · Conversion audit (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 PE Conversion Audit =="
check "funnel dashboard" "rg -q 'data-tt-pes-funnel-dashboard' '$ROOT/frontend/components/product-enhancement/ConversionFunnelDashboard.tsx'"
check "pes analytics hook" "rg -q 'usePesTouchpointImpression' '$ROOT/frontend/lib/usePesAnalytics.ts'"
check "auth return flow" "rg -q 'buildPesAuthHref' '$ROOT/frontend/lib/pesAuthReturnFlow.ts'"
check "funnel rail" "rg -q 'data-tt-pes-funnel-rail' '$ROOT/frontend/components/product-enhancement/ConversionFunnelRail.tsx'"
check "referrals login CTA" "rg -q 'data-tt-me-referrals-login-cta' '$ROOT/frontend/app/me/referrals/MeReferralsPageMain.tsx'"
check "growth hub KPI" "rg -q 'data-tt-admin-growth-hub-kpi' '$ROOT/frontend/app/admin/growth/AdminGrowthHubMain.tsx'"
[[ "$fail" -eq 0 ]] && echo "TT_CONVERSION: CONVERSION_L5_GO" || { echo "TT_CONVERSION: HOLD"; exit 2; }
