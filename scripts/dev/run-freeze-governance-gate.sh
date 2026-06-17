#!/usr/bin/env bash
# DOMAIN-FZ · Freeze Governance · Closure Readiness Gate
#
#   bash scripts/dev/run-freeze-governance-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §32–§34
# Success: TT_FREEZE_GOVERNANCE: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${FZ_AUDIT_OUT:-$ROOT/evidence/freeze-governance/${STAMP}}"
CL="$ROOT/docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md"
fail=0

run_step() {
  local label="$1"
  shift
  echo "== $label =="
  if "$@"; then
    echo "OK   $label"
  else
    echo "FAIL $label"
    fail=1
  fi
}

mkdir -p "$OUT"
echo "== DOMAIN-FZ · Freeze Governance · out=$OUT =="

run_step "FZ-01 checklist SSOT" test -f "$CL"
run_step "FZ-02 convergence phase §0.2" grep -q "收敛优化" "$CL"
run_step "FZ-03 no new primary domain lock" grep -q "停止新增一级治理域" "$CL"
run_step "FZ-04 DOMAIN-FZ section" grep -q "DOMAIN-FZ" "$CL"
run_step "FZ-05 Closure Readiness thresholds" grep -q "PHASE1_EXIT_READY" "$CL"
run_step "FZ-06 MA prerequisite" test -f "$ROOT/scripts/dev/run-meta-audit-gate.sh"

run_step "FZ artifacts bundle" python "$ROOT/scripts/dev/generate-freeze-governance-artifacts.py" "$OUT"

if [[ -f "$OUT/closure-readiness-score.v1.json" ]]; then
  run_step "FZ-07 readiness artifact" test -s "$OUT/closure-readiness-score.v1.json"
  run_step "FZ-08 domain matrix" test -s "$OUT/domain-completion-matrix.v1.json"
  run_step "FZ-09 backlog registry" test -s "$OUT/phase1-closure-backlog-registry.v1.json"
  run_step "FZ-10 freeze report" test -s "$OUT/PHASE1-FREEZE-RECOMMENDATION-REPORT.md"
else
  echo "FAIL FZ artifacts missing"
  fail=1
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  artifact="$OUT/closure-readiness-score.v1.json"
  score="$(grep -o '"score": [0-9]*' "$artifact" | tail -1 | grep -o '[0-9]*')"
  band="$(grep -o '"band": "[^"]*"' "$artifact" | tail -1 | cut -d'"' -f4)"
  echo "TT_FREEZE_GOVERNANCE: OK"
  echo "Evidence: $OUT"
  echo "Closure Readiness: score=$score band=$band"
  echo "Bands: <80 NO_GO · 80-89 HOLD · 90+ FREEZE_CANDIDATE · 95+ PHASE1_EXIT_READY"
  exit 0
fi

echo "TT_FREEZE_GOVERNANCE: FAIL"
exit 1
