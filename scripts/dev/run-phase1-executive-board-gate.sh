#!/usr/bin/env bash
# PHASE1_EXECUTIVE_BOARD · Phase ① Executive Freeze Dashboard
#
#   bash scripts/dev/run-phase1-executive-board-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §35
# Success: TT_PHASE1_EXECUTIVE_BOARD: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${PEB_AUDIT_OUT:-$ROOT/evidence/phase1-executive-board/${STAMP}}"
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
echo "== PHASE1_EXECUTIVE_BOARD · Executive Freeze Dashboard · out=$OUT =="

run_step "PEB-01 checklist SSOT" test -f "$CL"
run_step "PEB-02 convergence policy" grep -q "停止新增一级治理域" "$CL"
run_step "PEB-03 EXECUTIVE_BOARD section" grep -q "PHASE1_EXECUTIVE_BOARD" "$CL"
run_step "PEB-04 FZ prerequisite" test -f "$ROOT/scripts/dev/run-freeze-governance-gate.sh"
run_step "PEB-05 QA2 prerequisite" test -f "$ROOT/scripts/dev/run-audit-quality-gate.sh"
run_step "PEB-05b EX submodule" test -f "$ROOT/scripts/dev/run-execution-audit-gate.sh"

# Refresh upstream closure layers when not skipped (best-effort)
if [[ "${SKIP_DOMAIN_FZ:-}" != "1" ]]; then
  bash "$ROOT/scripts/dev/run-freeze-governance-gate.sh" >/dev/null 2>&1 || true
fi
if [[ "${SKIP_DOMAIN_QA2:-}" != "1" ]]; then
  bash "$ROOT/scripts/dev/run-audit-quality-gate.sh" >/dev/null 2>&1 || true
fi

run_step "PEB artifacts bundle" python "$ROOT/scripts/dev/generate-phase1-executive-board-artifacts.py" "$OUT"

if [[ -f "$OUT/EXECUTIVE-FREEZE-DASHBOARD.md" ]]; then
  run_step "PEB-06 dashboard" test -s "$OUT/EXECUTIVE-FREEZE-DASHBOARD.md"
  run_step "PEB-07 readiness score" test -s "$OUT/phase1-readiness-score.v1.json"
  run_step "PEB-08 domain matrix" test -s "$OUT/domain-completion-matrix.v1.json"
  run_step "PEB-09 sprint queue" test -s "$OUT/closure-sprint-queue.v1.json"
  run_step "PEB-10 freeze recommendation" test -s "$OUT/freeze-recommendation.v1.json"
  run_step "PEB-11 top10 root causes" test -s "$OUT/top10-root-causes.v1.json"
  run_step "PEB-12 top20 blockers" test -s "$OUT/top20-blockers.v1.json"
  run_step "PEB-13 EX execution-audit" test -s "$OUT/execution-audit/EXECUTION-DASHBOARD.md"
  run_step "PEB-14 phase1 exit forecast" test -s "$OUT/phase1-exit-forecast.v1.json"
else
  echo "FAIL PEB artifacts missing"
  fail=1
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  score="$(grep -o '"score": [0-9]*' "$OUT/phase1-readiness-score.v1.json" | tail -1 | grep -o '[0-9]*')"
  rec="$(grep -o '"recommendation": "[^"]*"' "$OUT/freeze-recommendation.v1.json" | tail -1 | cut -d'"' -f4)"
  echo "TT_PHASE1_EXECUTIVE_BOARD: OK"
  echo "Evidence: $OUT"
  echo "Dashboard: EXECUTIVE-FREEZE-DASHBOARD.md"
  echo "Readiness: score=$score recommendation=$rec"
  exit 0
fi

echo "TT_PHASE1_EXECUTIVE_BOARD: FAIL"
exit 1
