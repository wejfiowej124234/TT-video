#!/usr/bin/env bash
# L5 Operations Deep Audit orchestrator (156)
#
# SSOT baselines: 120 · 133 · 145 · 146 · 150 · 155
# Discipline: no new product feature code
#
#   bash scripts/dev/run-l5-operations-deep-audit.sh
#   L5_RUN_LIVE_FREEZE_GATES=1 bash scripts/dev/run-l5-operations-deep-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_AUDIT_EVIDENCE_DIR:-$ROOT/evidence/l5_operations_deep_audit/run-${STAMP}}"
LIVE="${L5_RUN_LIVE_FREEZE_GATES:-0}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/audit.log") 2>&1

echo "== L5 Operations Deep Audit · ${STAMP} =="
echo "baselines: 120/133/145/146/150/155"
echo "live_freeze_gates=${LIVE}"

freeze_ok=1

run_gate() {
  local label="$1" script="$2" warn_ok="${3:-0}"
  echo ""
  echo "-- ${label} --"
  if bash "$ROOT/$script" 2>&1 | tee "$OUT/${label// /_}.log"; then
    echo "OK   ${label}"
  else
    if [[ "$warn_ok" == "1" ]]; then
      echo "WARN ${label} (non-blocking for L5 B-layer)"
    else
      echo "FAIL ${label}"
      freeze_ok=0
    fi
  fi
}

echo ""
echo "=== Freeze baseline gates ==="
run_gate "145-operations-platform" "scripts/check-operations-platform-release-freeze.sh" 0
run_gate "149-operations-e2e" "scripts/check-operations-e2e-acceptance.sh" 0
run_gate "150-cold-start-consumer" "scripts/check-e2e-a-01-cold-start-campaign-consumer.sh" 0
run_gate "146-c-s6-opt-in" "scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh" 0
run_gate "133-g-s8-growth" "scripts/check-g-s8-growth-release-freeze.sh" 0
run_gate "120-s5-catalog" "scripts/check-s5-catalog-release-freeze.sh" 1
run_gate "155-pi3-006-exec" "scripts/check-pi3-006-go-live-production-cutover-execution.sh" 1

if [[ "$LIVE" == "1" ]]; then
  echo ""
  echo "=== Optional live ops matrix ==="
  PI3_004_RUN_LIVE_FREEZE_GATES=1 bash "$ROOT/scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh" \
    2>&1 | tee "$OUT/ops-planes-live.log" || true
fi

echo ""
echo "=== Static ops freeze matrix ==="
bash "$ROOT/scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh" 2>&1 | tee "$OUT/ops-planes-static.log"

echo ""
echo "=== L5 audit matrix generation ==="
python "$ROOT/scripts/dev/generate-l5-operations-audit-matrix.py" \
  "$OUT/audit_matrix.v1.json" "$freeze_ok" 2>&1 | tee "$OUT/matrix-gen.log"

cp "$OUT/audit_matrix.v1.json" "$ROOT/evidence/l5_operations_deep_audit/audit_matrix.v1.json" 2>/dev/null || true

verdict="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('verdict',''))" "$OUT/audit_matrix.v1.json")"
score="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('enterprise_score',0))" "$OUT/audit_matrix.v1.json")"

echo ""
echo "Evidence: $OUT"
echo "TT_L5_OPERATIONS_DEEP_AUDIT: ${verdict} score=${score}/100 freeze_ok=${freeze_ok}"
