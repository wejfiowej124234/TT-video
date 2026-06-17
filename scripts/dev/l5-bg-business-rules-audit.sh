#!/usr/bin/env bash
# L5 Enterprise Business & Governance · Business Rules audit (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 BG Business Rules Audit =="
check "G-S8 freeze report" "test -f '$ROOT/docs/handbook/engineering/133-G-S8-Growth-Release-Freeze-Report.md'"
check "G-S8 gate" "test -f '$ROOT/scripts/check-g-s8-growth-release-freeze.sh'"
check "102 blueprint" "test -f '$ROOT/docs/handbook/engineering/102-Referral与早鸟增长系统v1.0实施蓝图.md'"
check "growth ledger SSOT" "rg -q 'append-only SSOT' '$ROOT/crates/api/src/db/growth_ledger.rs'"
check "airdrop disclaimer" "rg -q 'admin_growth_airdrop_disclaimer' '$ROOT/frontend/app/admin/growth/airdrop-campaigns/AdminAirdropCampaignsPageMain.tsx'"
check "early bird reconcile" "rg -q 'data-tt-admin-growth-early-bird-reconcile' '$ROOT/frontend/app/admin/growth/early-bird/AdminEarlyBirdPageMain.tsx'"
check "me referrals center" "rg -q 'data-tt-me-referrals-page' '$ROOT/frontend/app/me/referrals/MeReferralsPageMain.tsx'"
[[ "$fail" -eq 0 ]] && echo "TT_BUSINESS_RULES: BUSINESS_RULES_GO" || { echo "TT_BUSINESS_RULES: HOLD"; exit 2; }
