#!/usr/bin/env bash
# G2 Reality Audit closure — probe code/runtime/evidence · update Master Matrix · gap report
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g2-reality-audit/${STAMP}"
SIGNOFF="$EVID/g2-reality-audit-signoff.json"

echo "=== G2 Reality Audit · $STAMP ==="

node scripts/dev/validate-g2-reality-audit.cjs --evidence-dir "$EVID"

node scripts/dev/sync-production-readiness-g2-matrix.cjs \
  --signoff "$SIGNOFF" \
  --evidence-dir "$EVID" \
  --mode audit

node scripts/dev/validate-production-readiness-master-matrix.cjs

node scripts/dev/validate-production-readiness-g2-gate.cjs --evidence-dir "$EVID" || true

echo ""
echo "TT_G2_REALITY_AUDIT: COMPLETE"
echo "Evidence: $EVID"
echo "Gap report: docs/runbook/G2-REALITY-GAP-REPORT.md"
echo "Formal plan: docs/runbook/G2-FORMAL-ACCEPTANCE-PLAN.md"
