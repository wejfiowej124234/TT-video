#!/usr/bin/env bash
# Production Readiness Deep Audit · matrix generation (158)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PROD_READINESS_AUDIT_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/prod-readiness-audit-${STAMP}}"
EVID="$ROOT/evidence/production_readiness_deep_audit"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== Production Readiness Deep Audit · $STAMP =="
echo "tracks: PI3-001 PI3-002 PI3-003 PI3-004 PI3-005 PI3-006"

SKIP_GATES="${PROD_READINESS_SKIP_GATES:-0}"
if [[ "$SKIP_GATES" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-production-readiness-deep-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-production-readiness-deep-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
