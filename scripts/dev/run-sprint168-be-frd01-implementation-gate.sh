#!/usr/bin/env bash
# BE-FRD-01 · fraud-scan implementation gate (Sprint 168-B)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { local name="$1"; shift; if "$@"; then echo "OK   $name"; else echo "FAIL $name"; fail=1; fi; }

echo "== Sprint 168-B BE-FRD-01 Implementation Gate =="

check "migration" test -f "$ROOT/crates/api/migrations/20260608120000_sprint168_business_expansion.sql"
check "growth_fraud_scan.rs" test -f "$ROOT/crates/api/src/db/growth_fraud_scan.rs"
rg -q 'fraud-scan|fraud_scan' "$ROOT/crates/api/src/routes/internal/growth.rs" && echo "OK   internal fraud-scan route" || { echo "FAIL internal route"; fail=1; }
rg -q 'run_growth_fraud_scan_best_effort' "$ROOT/crates/api/src/chain_off/auth.rs" && echo "OK   register hook" || { echo "FAIL register hook"; fail=1; }
rg -q 'scan-runs' "$ROOT/crates/api/src/routes/admin/admin_growth_fraud_http.rs" && echo "OK   admin scan-runs" || { echo "FAIL admin scan-runs"; fail=1; }

cd "$ROOT"
cargo test -p traveltrust-api growth_fraud_scan::tests -- --nocapture >/dev/null && echo "OK   cargo unit tests" || { echo "FAIL cargo tests"; fail=1; }

cd "$ROOT/frontend"
npx vitest run app/admin/growth/anti-fraud/adminGrowthAntiFraud.contract.test.ts --silent 2>/dev/null && echo "OK   anti-fraud contract" || { echo "FAIL contract"; fail=1; }

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "BE_FRD_01_GO"
  exit 0
fi
echo "BE_FRD_01_HOLD"
exit 2
