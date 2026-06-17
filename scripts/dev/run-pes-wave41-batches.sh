#!/usr/bin/env bash
# PES Wave 4.1 · 分批浏览器验证
# smoke(10) → batch 1..5 (各10) → aggregate merge
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/frontend"
PW="npx playwright test e2e/pes-wave4-validation.spec.ts --project=chromium"

if [[ "${PES_WAVE41_SKIP_SMOKE:-}" != "1" ]]; then
  echo "== Wave 4.1 smoke (10 runs, events non-empty) =="
  PES_WAVE41_MODE=smoke PES_WAVE41_RUNS=10 $PW
else
  echo "== Wave 4.1 smoke skipped (PES_WAVE41_SKIP_SMOKE=1) =="
fi

echo "== Wave 4.1 batches 1..5 (10 runs each) =="
for B in 1 2 3 4 5; do
  echo "--- batch $B/5 ---"
  PES_WAVE41_MODE=batch PES_WAVE41_BATCH="$B" PES_WAVE41_RUNS=10 $PW
done

echo "== Wave 4.1 aggregate (merge + gate wave5) =="
PES_WAVE41_MODE=aggregate $PW --grep aggregate

echo "Done. Evidence: frontend/evidence/pes-wave41-validation-20260607/"
