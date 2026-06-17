#!/usr/bin/env bash
# Business Expansion Audit (166) · 五域静态缺口探针
# 不含 UI/UX · 不含页面级验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }

echo "== Business Expansion Audit · 五域静态探针 =="

echo "-- RegionShare --"
check "RegionVault ABI" "test -f '$ROOT/contracts/abi/RegionVault.json'"
check "RegionDistributionClaim" "test -f '$ROOT/contracts/abi/RegionDistributionClaim.json'"
check "CountryPoolLedger pilot" "test -f '$ROOT/contracts/abi/CountryPoolLedgerV0.json'"
check "governance vault-forwards" "rg -q 'governance/vault-forwards' '$ROOT/frontend/lib/api/routes.ts' 2>/dev/null || rg -q 'vault-forwards' '$ROOT/frontend/app/governance'"

echo "-- DAO 链上治理 --"
check "Sepolia spine doc" "test -f '$ROOT/docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md'"
check "Governor ABI" "test -f '$ROOT/contracts/abi/TravelTrustGovernor.json'"
check "Safe deploy flow test" "test -f '$ROOT/contracts/test/GovernanceSafeDeployFlow.t.sol'"
check "ITG audit harness" "test -f '$ROOT/scripts/dev/identity-trust-governance-deep-audit.py'"

echo "-- 自动风控引擎 --"
check "anti-fraud admin" "test -f '$ROOT/frontend/app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx'"
check "referral rate limit" "rg -q 'referral_hourly_rate_limit' '$ROOT/crates/api/src/db/growth_referral.rs'"
check "fraud-scan HOLD doc" "rg -q 'fraud-scan' '$ROOT/docs/handbook/engineering/133-G-S8-Growth-Release-Freeze-Report.md'"

echo "-- 投资人收益模拟 --"
check "InvestorDistributionClaim" "test -f '$ROOT/contracts/src/InvestorDistributionClaim.sol'"
check "IC simulation doc" "test -f '$ROOT/docs/fundraising/internal/49-企业级投资委员会决策模拟.md'"
check "dataroom export" "test -f '$ROOT/scripts/export-investor-dataroom.sh'"

echo "-- 全球国家市场运营 --"
check "catalog geo validation" "test -f '$ROOT/docs/handbook/engineering/140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md'"
check "country ledger route" "rg -q 'country_ledger' '$ROOT/crates/api/src/routes/mod.rs'"
check "CMS countries admin" "test -f '$ROOT/frontend/app/admin/content/countries/AdminContentCountriesPageMain.tsx'"

check "gap matrix" "test -f '$ROOT/evidence/business_expansion/gap_matrix.v1.json'"
check "166 report" "test -f '$ROOT/docs/handbook/engineering/166-Business-Expansion-Audit-Report.md'"

[[ "$fail" -eq 0 ]] && echo "TT_BUSINESS_EXPANSION: STATIC_PROBE_OK" || { echo "TT_BUSINESS_EXPANSION: HOLD"; exit 2; }
