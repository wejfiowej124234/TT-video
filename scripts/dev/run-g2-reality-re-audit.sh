#!/usr/bin/env bash
# G2 Reality Re-Audit — live re-probe after Reality Fix; gates Wave 2 Formal Acceptance.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FIX_STAMP="${G2_FIX_STAMP:-}"
if [[ -z "$FIX_STAMP" ]]; then
  FIX_STAMP="$(ls -1d evidence/GO_production_readiness/g2-reality-fix/*/ 2>/dev/null | sort | tail -1 | xargs basename 2>/dev/null || true)"
fi
[[ -n "$FIX_STAMP" ]] || { echo "No g2-reality-fix stamp — run run-g2-reality-fix.sh first" >&2; exit 2; }

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
FIX_DIR="evidence/GO_production_readiness/g2-reality-fix/${FIX_STAMP}"
EVID="evidence/GO_production_readiness/g2-reality-re-audit/${STAMP}"

echo "=== G2 Reality Re-Audit · $STAMP ==="
echo "Fix baseline: $FIX_DIR"

node scripts/dev/validate-g2-reality-re-audit.cjs \
  --fix-dir "$FIX_DIR" \
  --evidence-dir "$EVID"

node scripts/dev/sync-production-readiness-g2-matrix.cjs \
  --signoff "$EVID/g2-reality-re-audit-signoff.json" \
  --mode re-audit

echo ""
echo "Evidence: $EVID"
echo "Formal plan: docs/runbook/G2-FORMAL-ACCEPTANCE-PLAN.md"
