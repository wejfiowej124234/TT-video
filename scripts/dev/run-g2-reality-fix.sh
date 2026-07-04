#!/usr/bin/env bash
# G2 Reality Fix — prod evidence collection · matrix sync for VERIFIED items only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g2-reality-fix/${STAMP}"
SIGNOFF="$EVID/g2-reality-fix-signoff.json"

echo "=== G2 Reality Fix · $STAMP ==="
echo "PROD_API_BASE=${PROD_API_BASE:-https://tt-api-prod.fly.dev}"

bash scripts/dev/run-g2-reality-fix-probes.sh "$EVID"

set +e
node scripts/dev/validate-g2-reality-fix.cjs --evidence-dir "$EVID"
fix_exit=$?
set -e

node scripts/dev/sync-production-readiness-g2-matrix.cjs \
  --signoff "$SIGNOFF" \
  --mode fix

node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_G2_REALITY_FIX: see $SIGNOFF"
echo "Evidence: $EVID"
echo "Next: bash scripts/dev/run-g2-reality-re-audit.sh (after all VERIFIED)"

exit "$fix_exit"
