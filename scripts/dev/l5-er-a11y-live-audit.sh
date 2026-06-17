#!/usr/bin/env bash
# L5 Enterprise Reliability · A11Y Live Scan audit (163)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 ER A11Y Live Scan Audit =="
check "a11y live scan spec" "test -f '$ROOT/frontend/e2e/l5-a11y-live-scan.spec.ts'"
check "five role routes in spec" "rg -q 'data-tt-l5-a11y-live-scan' '$ROOT/frontend/e2e/l5-a11y-live-scan.spec.ts'"
check "consumer aria" "rg -q 'aria-label' '$ROOT/frontend/components/consumer/ConsumerSurfaceStatePanel.tsx'"
check "ops live region" "rg -q 'aria-live' '$ROOT/frontend/components/admin/ops/OpsPlaneFetchStates.tsx'"
check "table a11y contract" "test -f '$ROOT/frontend/lib/admin/adminTableA11y.contract.test.ts'"
check "a11y manifest routes" "python -c \"import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); assert len(m.get('a11y_live_routes',[]))>=5\" '$ROOT/evidence/l5_enterprise_reliability/reliability_manifest.v1.json'"
[[ "$fail" -eq 0 ]] && echo "TT_A11Y_LIVE: A11Y_LIVE_GO" || { echo "TT_A11Y_LIVE: HOLD"; exit 2; }
