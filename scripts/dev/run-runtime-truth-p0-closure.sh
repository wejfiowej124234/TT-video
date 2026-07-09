#!/usr/bin/env bash
# Runtime Truth P0 closure — PRM-RT-B001/B002/B003 + PRM-EVID-B001/REG-B001
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="evidence/GO_production_readiness/runtime-truth-p0/${STAMP}"
export AUDIT_STAMP="$STAMP"

echo "== Runtime Truth P0 Closure =="
echo "stamp=$STAMP"

echo "── Call graph anchors ──"
node scripts/dev/audit-runtime-truth-call-graph.cjs

echo "── P0 static + matrix gap checks ──"
node scripts/dev/validate-runtime-truth-p0.cjs --evidence-dir "$EVID"

echo "── Master Matrix reconcile ──"
node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_RUNTIME_TRUTH_P0: PASS"
echo "Evidence: $EVID"
