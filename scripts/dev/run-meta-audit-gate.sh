#!/usr/bin/env bash
# DOMAIN-MA · Meta Audit · Governance Standard Self-Audit
#
#   bash scripts/dev/run-meta-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §30–§31
# Success: TT_META_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${MA_AUDIT_OUT:-$ROOT/evidence/meta-audit/${STAMP}}"
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
echo "== DOMAIN-MA · Meta Audit · out=$OUT =="

run_step "MA-01 checklist SSOT exists" test -f "$CL"
run_step "MA-01 §0 positioning" grep -q "## §0 ·" "$CL"
run_step "MA-02 §3.1 upgrade gates" grep -q "## §3.1 ·" "$CL"
run_step "MA-04 U12-12 MASTER row" grep -q "U12-12" "$CL"
run_step "MA-06 MASTER gate script" test -f "$ROOT/scripts/dev/run-full-system-audit-master-gate.sh"

for g in run-product-forensic-audit-gate.sh run-doa-audit-gate.sh \
  run-lifecycle-forensic-audit-gate.sh run-platform-governance-audit-gate.sh \
  run-admin-governance-audit-gate.sh; do
  run_step "MA-06 domain gate $g" test -f "$ROOT/scripts/dev/$g"
done

run_step "MA-16 TT_PHASE1_CLOSURE grep anchor" grep -q "TT_PHASE1_CLOSURE_GOVERNANCE" "$CL"
run_step "MA-18 read summary table" grep -q "## 读前摘要" "$CL"
run_step "MA-19 §9 revision history" grep -q "## §9 · 修订记录" "$CL"
run_step "MA-20 DOMAIN-MA section" grep -q "DOMAIN-MA" "$CL"

python "$ROOT/scripts/dev/generate-meta-audit-registry-stub.py" "$OUT/meta-audit-registry.v1.json"
run_step "MA artifacts bundle" python "$ROOT/scripts/dev/generate-meta-audit-artifacts.py" "$OUT"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_META_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Layers: L1–L6 · Verdicts: KEEP/MERGE/RETIRE/REFACTOR/UPDATE/DEPRECATE/REMOVE"
  echo "Queue: NOW/NEXT/LATER"
  exit 0
fi

echo "TT_META_AUDIT: FAIL"
exit 1
