#!/usr/bin/env bash
# G1 Reality Verification — Release Train layer (G1 already Formal PASS · re-verify five truths).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g1-reality-verification/${STAMP}"
STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

mkdir -p "$EVID/production-runtime-identity/staging"
# shellcheck source=scripts/dev/lib/g2-prod-probe.sh
source "$ROOT/scripts/dev/lib/g2-prod-probe.sh"

echo "=== G1 Reality Verification · $STAMP ==="
g2_probe_meta_build "$STAGING_API_BASE" staging "$EVID/production-runtime-identity/staging"
cp "$EVID/production-runtime-identity/staging/meta-summary.txt" "$EVID/production-runtime-identity/meta-summary.txt"
cp "$EVID/production-runtime-identity/staging/meta-build.json" "$EVID/production-runtime-identity/meta-build.json"

set +e
node scripts/dev/validate-g1-reality-verification.cjs --evidence-dir "$EVID"
verify_exit=$?
set -e

echo ""
echo "TT_G1_REALITY_VERIFICATION: see $EVID/g1-reality-verification-signoff.json"
echo "Plan: docs/runbook/TT-RELEASE-TRAIN-REALITY-VERIFICATION.md"

exit "$verify_exit"
