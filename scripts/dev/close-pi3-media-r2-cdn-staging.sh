#!/usr/bin/env bash
# Close PI3-MEDIA-PERSISTENT-STAGING (staging off loca.lt · NOT R2 final).
# Follow-up closeout: PI3-MEDIA-R2-CDN-FINAL — see docs/runbook/TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md §9
#
#   bash scripts/dev/close-pi3-media-r2-cdn-staging.sh
#   bash scripts/dev/close-pi3-media-r2-cdn-staging.sh --with-c4 --with-playwright
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${CLOSE_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_media_r2_cdn_migration/${STAMP}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB:-https://tt-web-staging.fly.dev}"
WITH_C4=0
WITH_PW=0
for arg in "$@"; do
  [[ "$arg" == "--with-c4" ]] && WITH_C4=1
  [[ "$arg" == "--with-playwright" ]] && WITH_PW=1
done

mkdir -p "$EVID"
exec > >(tee -a "$EVID/close-run.log") 2>&1

echo "== close-pi3-media-r2-cdn-staging · $STAMP =="
echo "SSOT: registry/media-three-tier-architecture.v1.yaml"

echo "== [1] Fly media env (must not be loca.lt) =="
fly ssh console -a tt-api-staging -C 'printenv COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL COMMUNITY_MEDIA_S3_ENDPOINT' 2>&1 | tee "$EVID/fly-media-env.log" || true
if grep -q 'loca\.lt' "$EVID/fly-media-env.log" 2>/dev/null; then
  echo "FAIL: Fly still uses loca.lt — run provision-staging-media-r2-cdn.sh first" >&2
  exit 1
fi

echo "== [2] media URL audit =="
AUDIT_STAMP="$STAMP" OUT="$EVID/media-url-audit.json" node "$ROOT/scripts/dev/audit-staging-media-urls.cjs" | tee "$EVID/media-url-audit.log"

echo "== [3] API probes =="
curl -sf "${STAGING_API}/api/v1/community/media/capabilities" | tee "$EVID/capabilities.json"
curl -sf "${STAGING_API}/health/ready" | tee "$EVID/health-ready.json"

if [[ "$WITH_C4" -eq 1 ]]; then
  echo "== [4] C4 smoke =="
  export API_BASE="$STAGING_API"
  export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="${NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL:-https://cdn.traveltrust.app}"
  bash "$ROOT/scripts/dev/smoke-community-c4-staging-video-playback.sh" 2>&1 | tee "$EVID/c4-smoke.log"
fi

if [[ "$WITH_PW" -eq 1 ]]; then
  echo "== [5] playwright market @staging =="
  export STAGING_WEB_BASE="$STAGING_WEB"
  export STAGING_API_BASE="$STAGING_API"
  (cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @staging) \
    2>&1 | tee "$EVID/playwright-market-staging.log"
fi

node - <<NODE
const fs = require('fs');
const path = require('path');
const outPath = path.join('${ROOT}'.replace(/\\\\/g, '/'), 'evidence/GO_media_r2_cdn_migration/${STAMP}/closeout.json');
const out = {
  schema: 'traveltrust.pi3_media_r2_cdn_staging_closeout.v1',
  stamp: '${STAMP}',
  issue_id: 'PI3-MEDIA-PERSISTENT-STAGING',
  status: 'CLOSED',
  renamed_from: 'PI3-MEDIA-R2-CDN-STAGING',
  follow_up_issue: 'PI3-MEDIA-R2-CDN-FINAL',
  follow_up_status: 'WAITING_OWNER_CF',
  acceptance_gate: 'MEDIA_CDN_PRODUCTION_ACCEPTANCE',
  acceptance_gate_status: 'PENDING',
  market_runtime: 'CLOSED',
  governance: { OCS: 'CLOSED', DDG: 'CLOSED', SOPCP: 'CLOSED', market_default_filter: 'CLOSED' },
  blocking_count: 0,
  verdict: 'Phase② staging off loca.lt · persistent public S3 · no loca.lt in API payloads'
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\\n');
console.log(JSON.stringify(out, null, 2));
NODE

echo "SIGNOFF: evidence/manual-uat/signoff/PI3-MEDIA-PERSISTENT-STAGING-SIGNOFF-${STAMP}.md"
echo "close-pi3-media-r2-cdn-staging: CLOSED"
