#!/usr/bin/env bash
# L5 Product Excellence · matrix + six track audits (162)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_PE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-product-excellence-${STAMP}}"
EVID="$ROOT/evidence/l5_product_excellence"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 Product Excellence · $STAMP =="
echo "baselines: 160 UI_UX_L5_GO · 161 L5_ENTERPRISE_ACCEPTANCE_GO"

for track in user-journey information-architecture design-system conversion mobile-responsive accessibility; do
  bash "$ROOT/scripts/dev/l5-pe-${track}-audit.sh" 2>&1 | tee "$OUT/${track}.log"
done

SKIP="${L5_PE_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-product-excellence-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-product-excellence-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
