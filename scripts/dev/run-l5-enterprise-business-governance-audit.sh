#!/usr/bin/env bash
# L5 Enterprise Business & Governance · five track audits (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_BG_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-business-governance-${STAMP}}"
EVID="$ROOT/evidence/l5_enterprise_business_governance"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 Enterprise Business & Governance · $STAMP =="
echo "baselines: 164 LIVE_EVIDENCE · 133 G-S8 · 133 Growth Freeze"

for track in business-rules tokenomics economic-attack governance investor-readiness; do
  bash "$ROOT/scripts/dev/l5-bg-${track}-audit.sh" 2>&1 | tee "$OUT/${track}.log"
done

SKIP="${L5_BG_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-enterprise-business-governance-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-enterprise-business-governance-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
