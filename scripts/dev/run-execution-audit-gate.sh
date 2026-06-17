#!/usr/bin/env bash
# EXECUTION_AUDIT (EX) · PEB submodule · execution & closure capability
#
#   bash scripts/dev/run-execution-audit-gate.sh
#
# NOT a new DOMAIN — SSOT: checklist §35.2
# Success: TT_EXECUTION_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${EX_AUDIT_OUT:-$ROOT/evidence/execution-audit/${STAMP}}"
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
echo "== EXECUTION_AUDIT (EX) · PEB submodule · out=$OUT =="

run_step "EX-01 checklist SSOT" test -f "$CL"
run_step "EX-02 PEB submodule not DOMAIN" grep -q "EXECUTION_AUDIT" "$CL"
run_step "EX-03 execution convergence" grep -q "执行收敛" "$CL"
run_step "EX-04 PEB parent section" grep -q "PHASE1_EXECUTIVE_BOARD" "$CL"

run_step "EX artifacts bundle" python "$ROOT/scripts/dev/generate-execution-audit-artifacts.py" "$OUT"

if [[ -f "$OUT/EXECUTION-DASHBOARD.md" ]]; then
  run_step "EX-05 execution dashboard" test -s "$OUT/EXECUTION-DASHBOARD.md"
  run_step "EX-06 phase1 exit forecast" test -s "$OUT/phase1-exit-forecast.v1.json"
  run_step "EX-07 top closure opportunities" test -s "$OUT/top-closure-opportunities.v1.json"
  run_step "EX-08 p0 elimination plan" test -s "$OUT/p0-elimination-plan.v1.json"
  run_step "EX-09 executive closure report" test -s "$OUT/EXECUTIVE-CLOSURE-REPORT.md"
  run_step "EX-10 execution efficiency" test -s "$OUT/execution-efficiency-score.v1.json"
else
  echo "FAIL EX artifacts missing"
  fail=1
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_EXECUTION_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Dashboard: EXECUTION-DASHBOARD.md"
  exit 0
fi

echo "TT_EXECUTION_AUDIT: FAIL"
exit 1
