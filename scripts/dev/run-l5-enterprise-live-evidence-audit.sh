#!/usr/bin/env bash
# L5 Enterprise Live Evidence · matrix + three track audits (164)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_LE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-live-evidence-${STAMP}}"
EVID="$ROOT/evidence/l5_enterprise_live_evidence"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 Enterprise Live Evidence · $STAMP =="
echo "baselines: 163 L5_ENTERPRISE_RELIABILITY_GO · 162 L5_PRODUCT_EXCELLENCE_GO"

python "$ROOT/scripts/dev/seed-l5-enterprise-live-evidence-bundles.py" 2>&1 | tee "$OUT/seed.log"

for track in rujr-live a11y-live-evidence resilience-live; do
  bash "$ROOT/scripts/dev/l5-le-${track}-audit.sh" 2>&1 | tee "$OUT/${track}.log"
done

SKIP="${L5_LE_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-enterprise-live-evidence-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-enterprise-live-evidence-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
