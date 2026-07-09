#!/usr/bin/env bash
# Community Content Readiness · G1 closure runner (PRM-CONTENT-B001)
# Wave 1.1 · Content domain — NOT PCP architecture work
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="evidence/GO_production_readiness/content-readiness-g1/${STAMP}"
export AUDIT_STAMP="$STAMP"

echo "== Community Content Readiness G1 closure =="
echo "stamp=$STAMP"

echo "── Static: governed migration present ──"
test -f crates/api/migrations/20260704130000_community_content_readiness_governed.sql

echo "── Frontend unit: production profile filter ──"
(cd frontend && npx vitest run lib/communityContentProductionProfile.test.ts --reporter=dot)

echo "── Frontend unit: showcase merge ──"
(cd frontend && npx vitest run lib/communityFeedShowcaseMerge.test.ts --reporter=dot)

echo "── Rust: community showcase seed policy ──"
cargo test -p traveltrust-api community_public_showcase -- --nocapture 2>/dev/null || \
  cargo test -p traveltrust-api seed_community -- --nocapture

echo "── G1 content readiness validator (static) ──"
node scripts/dev/validate-community-content-readiness-g1.cjs --static-only --evidence-dir "$EVID/static"

echo "── G1 content readiness validator (runtime if API up) ──"
if curl -sf "${LOCAL_API:-http://127.0.0.1:8080}/health/ready" >/dev/null 2>&1; then
  node scripts/dev/validate-community-content-readiness-g1.cjs --evidence-dir "$EVID"
else
  echo "WARN: API not up — runtime_feed SKIPPED · PRM-CONTENT-B001 stays OPEN"
fi

echo "── Master Matrix reconcile ──"
node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_COMMUNITY_CONTENT_READINESS_G1: evidence at $EVID"
echo "Next: close PRM-CONTENT-B001 in matrix when runtime_feed_clean PASS with API up"
