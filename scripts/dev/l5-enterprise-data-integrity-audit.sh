#!/usr/bin/env bash
# L5 Enterprise · Data Integrity static audit (161 · DI track)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }

echo "== L5 Enterprise Data Integrity Audit =="
check "growth ledger db module" "test -f '$ROOT/crates/api/src/db/growth_ledger.rs'"
check "growth observer db module" "test -f '$ROOT/crates/api/src/db/growth_observer.rs'"
check "G-S2 gate script" "test -f '$ROOT/scripts/check-g-s2-growth-ledger-observer.sh'"
check "cross-domain audit script" "test -f '$ROOT/scripts/dev/cross-domain-integration-audit.py'"
check "reward ledger drift UI" "rg -q 'data-tt-admin-growth-ledger-drift' '$ROOT/frontend/app/admin/growth/reward-ledger/AdminRewardLedgerPageMain.tsx'"
check "early bird reconcile UI" "rg -q 'data-tt-admin-growth-early-bird-reconcile' '$ROOT/frontend/app/admin/growth/early-bird/AdminEarlyBirdPageMain.tsx'"
check "growth analytics readonly" "rg -q 'admin_growth_analytics_disclaimer' '$ROOT/frontend/app/admin/growth/analytics/AdminGrowthAnalyticsPageMain.tsx'"

if [[ "$fail" -ne 0 ]]; then
  echo "TT_DATA_INTEGRITY: HOLD"
  exit 2
fi
echo "TT_DATA_INTEGRITY: DATA_INTEGRITY_GO"
exit 0
