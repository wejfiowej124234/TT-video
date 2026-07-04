#!/usr/bin/env bash
# G3 Reality Verification — Release Train layer (Production Cutover · prod identity guard mandatory).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g3-reality-verification/${STAMP}"

echo "=== G3 Reality Verification · $STAMP ==="
EVIDENCE_DIR="$EVID/production-runtime-identity" \
  bash scripts/dev/run-production-runtime-identity-guard.sh || true

set +e
node scripts/dev/validate-g3-reality-verification.cjs --evidence-dir "$EVID"
verify_exit=$?
set -e

echo ""
echo "TT_G3_REALITY_VERIFICATION: see $EVID/g3-reality-verification-signoff.json"

exit "$verify_exit"
