#!/usr/bin/env bash
# BE-RS-01 · RegionShare Reconcile implementation gate (Sprint 170-B)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { local name="$1"; shift; if "$@"; then echo "OK   $name"; else echo "FAIL $name"; fail=1; fi; }

echo "== Sprint 170-B BE-RS-01 Implementation Gate =="

check "region_share_reconcile_ops.rs" test -f "$ROOT/crates/api/src/db/region_share_reconcile_ops.rs"
check "internal route module" test -f "$ROOT/crates/api/src/routes/internal/region_share_reconcile.rs"
check "admin route module" test -f "$ROOT/crates/api/src/routes/admin/admin_region_share_reconcile_http.rs"
check "region-share-reconcile.sh" test -f "$ROOT/scripts/ops/region-share-reconcile.sh"
check "cron wrapper" test -f "$ROOT/scripts/ops/region-share-reconcile-cron.sh"
rg -q 'region-share-reconcile' "$ROOT/crates/api/src/routes/internal/region_share_reconcile.rs" && echo "OK   internal POST route" || { echo "FAIL internal POST"; fail=1; }
rg -q 'region-share/reconcile' "$ROOT/crates/api/src/routes/admin/admin_region_share_reconcile_http.rs" && echo "OK   admin reconcile routes" || { echo "FAIL admin routes"; fail=1; }
rg -q 'region_share_projection_closure_observability' "$ROOT/crates/api/src/routes/admin/admin_observability_overview/handler.rs" && echo "OK   observability overview key" || { echo "FAIL overview"; fail=1; }
test -f "$ROOT/frontend/app/admin/region-share/reconcile/page.tsx" && echo "OK   admin UI page" || { echo "FAIL admin UI"; fail=1; }
test -f "$ROOT/evidence/GO_BE_RS_01/README.md" && echo "OK   evidence pack" || { echo "FAIL evidence"; fail=1; }
test -f "$ROOT/docs/handbook/engineering/171-BE-RS-01-RegionShare-Reconcile-Implementation-Report.md" && echo "OK   171 report" || { echo "FAIL 171 report"; fail=1; }

cd "$ROOT"
cargo test -p traveltrust-api region_share_reconcile_ops::tests -- --nocapture >/dev/null && echo "OK   cargo unit tests" || { echo "FAIL cargo tests"; fail=1; }

cd "$ROOT/frontend"
npx vitest run app/admin/region-share/reconcile/adminRegionShareReconcile.contract.test.ts --silent 2>/dev/null && echo "OK   contract test" || { echo "FAIL contract"; fail=1; }

bash "$ROOT/scripts/dev/run-business-expansion-enterprise-gap-audit.sh" >/dev/null && echo "OK   167 gap audit probe" || { echo "FAIL gap audit"; fail=1; }

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "BE_RS_01_GO"
  exit 0
fi
echo "BE_RS_01_HOLD"
exit 2
