#!/usr/bin/env bash
# L5 Enterprise Business & Governance · Economic Attack audit (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 BG Economic Attack Audit =="
check "anti-fraud admin UI" "rg -q 'data-tt-admin-growth-anti-fraud-rules' '$ROOT/frontend/app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx'"
check "G-S5 anti-fraud report" "test -f '$ROOT/docs/handbook/engineering/130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md'"
check "referral hourly limit" "rg -q 'referral_hourly_rate_limit' '$ROOT/crates/api/src/db/growth_referral.rs'"
check "fraud freeze ops" "rg -q 'growth_fraud' '$ROOT/crates/api/src/db/growth_fraud_ops.rs'"
check "airdrop snapshot only" "rg -q 'admin_growth_airdrop_disclaimer' '$ROOT/frontend/locales/en.ts'"
check "reward ledger reconcile" "test -f '$ROOT/frontend/app/admin/growth/reward-ledger/adminGrowthRewardLedger.contract.test.ts'"
[[ "$fail" -eq 0 ]] && echo "TT_ECONOMIC_ATTACK: ECONOMIC_ATTACK_GO" || { echo "TT_ECONOMIC_ATTACK: HOLD"; exit 2; }
