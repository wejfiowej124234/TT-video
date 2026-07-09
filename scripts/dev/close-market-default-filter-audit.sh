#!/usr/bin/env bash
# Market Default Filter State Audit — evidence closure (no OCS/DDG/SOPCP reopen).
#
#   bash scripts/dev/close-market-default-filter-audit.sh
#   bash scripts/dev/close-market-default-filter-audit.sh --with-playwright
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${CLOSE_STAMP:-20260703T125300Z}"
EVID="$ROOT/evidence/GO_market_default_filter_audit/${STAMP}"
WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WITH_PW=0
[[ "${1:-}" == "--with-playwright" ]] && WITH_PW=1

mkdir -p "$EVID"
exec > >(tee -a "$EVID/close-run.log") 2>&1

echo "== close-market-default-filter-audit · $STAMP =="
echo "classification: Market Default Filter State Audit"
echo "governance: OCS/DDG/SOPCP remain CLOSED — no reopen"

echo "== [1] unit tests =="
(cd "$ROOT/frontend" && npx vitest run lib/marketSubsiteFilters.test.ts lib/marketHubBrowserTruth.test.ts) 2>&1 | tee "$EVID/vitest.log"

echo "== [2] source-truth audit =="
AUDIT_STAMP="$STAMP" node "$ROOT/scripts/dev/audit-market-subsite-race-fix-source-truth.cjs" 2>&1 | tee "$EVID/source-truth-audit.log"

echo "== [3] API baseline =="
curl -sf "${API_BASE}/api/v1/market/provider/listings?limit=50" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('provider_all',j.items?.length)})" | tee "$EVID/api-baseline.log"
curl -sf "${API_BASE}/api/v1/guides?limit=30" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('guides_all',j.items?.length)})" | tee -a "$EVID/api-baseline.log"

if [[ "$WITH_PW" -eq 1 ]]; then
  echo "== [4] playwright @staging =="
  export STAGING_WEB_BASE="$WEB_BASE"
  export STAGING_API_BASE="$API_BASE"
  (cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @staging) 2>&1 | tee "$EVID/playwright-staging.log"
else
  echo "== [4] skip playwright (pass --with-playwright to run) =="
fi

echo "== [5] closure json already at $EVID/default-filter-audit-closure.json =="
echo "SIGNOFF: evidence/manual-uat/signoff/MARKET-DEFAULT-FILTER-AUDIT-SIGNOFF-${STAMP}.md"
echo "close-market-default-filter-audit: CLOSED"
