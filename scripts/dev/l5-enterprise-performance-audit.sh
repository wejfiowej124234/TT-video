#!/usr/bin/env bash
# L5 Enterprise · Performance static + optional benchmark (161 · PERF track)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }

echo "== L5 Enterprise Performance Audit =="
check "performance benchmark harness" "test -f '$ROOT/scripts/dev/l5-enterprise-performance-benchmark.sh'"
check "admin l5 green bundle" "rg -q 'adminContentCs1.contract.test.ts' '$ROOT/scripts/dev/run-admin-l5-green.sh'"
check "cold start contract in green" "rg -q 'coldStartCampaignE2eA01.contract.test.ts' '$ROOT/scripts/dev/run-admin-l5-green.sh'"
check "cms content smoke" "test -f '$ROOT/scripts/dev/smoke-admin-content-p0-local.sh'"
check "growth analytics page" "test -f '$ROOT/frontend/app/admin/growth/analytics/page.tsx'"

if [[ "${L5_PERF_RUN_BENCHMARK:-0}" == "1" ]]; then
  bash "$ROOT/scripts/dev/l5-enterprise-performance-benchmark.sh" || fail=1
else
  echo "INFO: set L5_PERF_RUN_BENCHMARK=1 to run live benchmark"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "TT_PERFORMANCE: HOLD"
  exit 2
fi
echo "TT_PERFORMANCE: PERFORMANCE_GO"
exit 0
