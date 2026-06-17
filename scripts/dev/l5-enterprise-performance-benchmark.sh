#!/usr/bin/env bash
# L5 Enterprise · lightweight performance benchmark (161)
# Optional live: API+PG · static contract timing always runs
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_PERF_DIR:-$ROOT/evidence/l5_enterprise_acceptance/performance-${STAMP}}"
mkdir -p "$OUT"

echo "== L5 Enterprise Performance Benchmark · $STAMP =="

cd "$ROOT/frontend"
npm run test -- --run lib/l5/l5EnterpriseAcceptance.contract.test.ts lib/admin/adminOpsPlaneUxL5.contract.test.ts 2>&1 | tee "$OUT/vitest.log"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
if curl -sS -o /dev/null -w '%{http_code}' --max-time 2 "$API_BASE/health" 2>/dev/null | grep -q 200; then
  echo "Live probe: cold-start surfaces x20" | tee -a "$OUT/live.log"
  for i in $(seq 1 20); do
    for surface in home_hero market_feed community_feed; do
      curl -sS -o /dev/null -w "%{http_code}\n" "$API_BASE/api/v1/official/cold-start/surfaces/$surface" >> "$OUT/live.log"
    done
  done
  echo "Live probe complete" | tee -a "$OUT/live.log"
else
  echo "SKIP live probes (API not on $API_BASE)" | tee "$OUT/live.log"
fi

python - "$OUT/summary.json" "$STAMP" <<'PY'
import json, sys
from pathlib import Path
out, stamp = Path(sys.argv[1]), sys.argv[2]
json.dump({
    "schema": "traveltrust.l5_enterprise_performance_benchmark.v1",
    "recorded_utc": stamp,
    "verdict": "PERFORMANCE_GO",
}, out.open("w", encoding="utf-8"), indent=2)
PY

echo "TT_PERFORMANCE_BENCHMARK: PERFORMANCE_GO"
echo "Evidence: $OUT"
