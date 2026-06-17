#!/usr/bin/env bash
# L5 Enterprise Acceptance · matrix + track audits (161)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_ENTERPRISE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-enterprise-acceptance-${STAMP}}"
EVID="$ROOT/evidence/l5_enterprise_acceptance"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 Enterprise Acceptance · $STAMP =="
echo "baselines: 157 OPERATIONS_L5_AUDIT_GO · 160 UI_UX_L5_GO · 158 Production Readiness"

for track in data-integrity rbac-security performance human-acceptance; do
  bash "$ROOT/scripts/dev/l5-enterprise-${track}-audit.sh" 2>&1 | tee "$OUT/${track}.log"
done

SKIP="${L5_ENTERPRISE_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-enterprise-acceptance-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-enterprise-acceptance-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
