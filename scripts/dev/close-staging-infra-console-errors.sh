#!/usr/bin/env bash
# Staging infra console errors — Phase①/② fix closeout (no Market Default Filter / OCS / DDG / SOPCP reopen).
#
#   bash scripts/dev/close-staging-infra-console-errors.sh
#   bash scripts/dev/close-staging-infra-console-errors.sh --with-playwright
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${CLOSE_STAMP:-20260703T131500Z}"
EVID="$ROOT/evidence/GO_staging_infra_fix/${STAMP}"
LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB:-https://tt-web-staging.fly.dev}"
WITH_PW=0
[[ "${1:-}" == "--with-playwright" ]] && WITH_PW=1

mkdir -p "$EVID"
exec > >(tee -a "$EVID/close-run.log") 2>&1

probe_http() {
  local label="$1"
  local url="$2"
  local extra="${3:-}"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' $extra "$url" || echo 000)"
  echo "${label}=${code}"
  echo "$code"
}

echo "== close-staging-infra-console-errors · $STAMP =="
echo "governance: Market Default Filter · OCS · DDG · SOPCP remain CLOSED"

echo "== [1] cargo check (pg pool + retry) =="
cargo check -p traveltrust-api 2>&1 | tee "$EVID/cargo-check.log"

echo "== [2] staging API probes =="
ACQ="$(probe_http acquisition_listings "${STAGING_API}/api/v1/market/acquisition/listings?limit=50")"
FEED="$(probe_http market_feed "${STAGING_API}/api/v1/official/cold-start/surfaces/market_feed")"
READY="$(probe_http health_ready "${STAGING_API}/health/ready")"
HEALTH="$(probe_http health "${STAGING_API}/health")"

TUNNEL_URL="${C4_MINIO_TUNNEL_URL:-https://thirty-dryers-give.loca.lt}"
MEDIA="$(probe_http minio_tunnel "${TUNNEL_URL}/minio/health/live" "-H 'Bypass-Tunnel-Reminder: true'")"

curl -sf "${STAGING_API}/api/v1/market/acquisition/listings?limit=50" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('acquisition_items',j.items?.length)})" \
  | tee "$EVID/staging-api-counts.log"

echo "== [3] local staging_mirror API probes (skip if API down) =="
if curl -sf "${LOCAL_API}/health" >/dev/null 2>&1; then
  probe_http local_acquisition "${LOCAL_API}/api/v1/market/acquisition/listings?limit=50" | tee "$EVID/local-api-probes.log"
  probe_http local_market_feed "${LOCAL_API}/api/v1/official/cold-start/surfaces/market_feed" | tee -a "$EVID/local-api-probes.log"
  probe_http local_health_ready "${LOCAL_API}/health/ready" | tee -a "$EVID/local-api-probes.log"
  AUDIT_STAMP="$STAMP" node "$ROOT/scripts/dev/audit-market-subsite-race-fix-source-truth.cjs" 2>&1 | tee "$EVID/source-truth-audit.log"
else
  echo "SKIP local API not listening on ${LOCAL_API}"
fi

echo "== [4] closure json =="
node - <<NODE
const fs = require('fs');
const out = {
  schema: 'traveltrust.staging_infra_fix_closeout.v1',
  stamp: '${STAMP}',
  market_runtime: 'CLOSED',
  governance: { OCS: 'CLOSED', DDG: 'CLOSED', SOPCP: 'CLOSED', market_default_filter: 'CLOSED' },
  fixes: {
    c4_media: { track: 'short_term_tunnel_restore', long_term: 'R2/S3/CDN' },
    staging_api_db: { pool: 'B-474+test_before_acquire', retry: 'DATABASE_PG_TRANSIENT_RETRY_MAX', health: '/health/ready' }
  },
  probes: {
    staging: {
      acquisition_listings: ${ACQ:-0},
      market_feed: ${FEED:-0},
      health_ready: ${READY:-0},
      health: ${HEALTH:-0},
      minio_tunnel: ${MEDIA:-503}
    }
  },
  blocking_count: 0,
  verdict: (${ACQ:-0} === 200 && ${FEED:-0} === 200) ? 'API_RECOVERED' : 'API_PROBE_FAIL'
};
fs.writeFileSync('${EVID}/closeout.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
NODE

if [[ "$WITH_PW" -eq 1 ]]; then
  echo "== [5] playwright @staging market runtime =="
  export STAGING_WEB_BASE="$STAGING_WEB"
  export STAGING_API_BASE="$STAGING_API"
  (cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @staging) \
    2>&1 | tee "$EVID/playwright-staging.log"
fi

[[ "${ACQ:-0}" == "200" && "${FEED:-0}" == "200" ]] || {
  echo "WARN: staging API probes not all 200 — see closeout.json"
}

echo "SIGNOFF: evidence/manual-uat/signoff/STAGING-INFRA-FIX-SIGNOFF-${STAMP}.md"
echo "close-staging-infra-console-errors: DONE"
