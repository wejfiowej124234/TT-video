#!/usr/bin/env bash
# DOMAIN-QA2 · Audit Quality Audit
#
#   bash scripts/dev/run-audit-quality-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §33
# Success: TT_AUDIT_QUALITY: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${QA2_AUDIT_OUT:-$ROOT/evidence/audit-quality/${STAMP}}"
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
echo "== DOMAIN-QA2 · Audit Quality Audit · out=$OUT =="

run_step "QA2-01 checklist SSOT" test -f "$CL"
run_step "QA2-02 DOMAIN-QA2 section" grep -q "DOMAIN-QA2" "$CL"
run_step "QA2-03 root cause compression" grep -q "Root Cause Compression" "$CL"
run_step "QA2-04 FZ prerequisite" test -f "$ROOT/scripts/dev/run-freeze-governance-gate.sh"

run_step "QA2 artifacts bundle" python "$ROOT/scripts/dev/generate-audit-quality-artifacts.py" "$OUT"

if [[ -f "$OUT/root-cause-compression.v1.json" ]]; then
  run_step "QA2-05 duplicate report" test -s "$OUT/duplicate-findings-report.v1.json"
  run_step "QA2-06 conflict report" test -s "$OUT/conflicting-findings-report.v1.json"
  run_step "QA2-07 top10 root causes" test -s "$OUT/top10-root-causes.v1.json"
  run_step "QA2-08 audit efficiency" test -s "$OUT/audit-efficiency-score.v1.json"
  run_step "QA2-09 ai efficiency" test -s "$OUT/ai-output-efficiency-score.v1.json"
  run_step "QA2-10 executive summary" test -s "$OUT/AUDIT-QUALITY-EXECUTIVE-SUMMARY.md"
else
  echo "FAIL QA2 artifacts missing"
  fail=1
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  ratio="$(grep -o '"ratio": [0-9.]*' "$OUT/root-cause-compression.v1.json" | tail -1 | grep -o '[0-9.]*')"
  echo "TT_AUDIT_QUALITY: OK"
  echo "Evidence: $OUT"
  echo "Root cause compression ratio: ${ratio}:1"
  exit 0
fi

echo "TT_AUDIT_QUALITY: FAIL"
exit 1
