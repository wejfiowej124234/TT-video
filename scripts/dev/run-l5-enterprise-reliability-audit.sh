#!/usr/bin/env bash
# L5 Enterprise Reliability · matrix + three track audits (163)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_ER_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-enterprise-reliability-${STAMP}}"
EVID="$ROOT/evidence/l5_enterprise_reliability"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 Enterprise Reliability · $STAMP =="
echo "baselines: 162 L5_PRODUCT_EXCELLENCE_GO · 161 L5_ENTERPRISE_ACCEPTANCE_GO"

for track in rujr a11y-live chaos-resilience; do
  bash "$ROOT/scripts/dev/l5-er-${track}-audit.sh" 2>&1 | tee "$OUT/${track}.log"
done

SKIP="${L5_ER_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-enterprise-reliability-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-enterprise-reliability-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
