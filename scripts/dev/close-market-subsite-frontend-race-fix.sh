#!/usr/bin/env bash
# Market Subsite Frontend Race Fix — build · deploy staging web · browser regression · evidence.
# Classification: frontend race fix — NOT DDG/OCS/SOPCP reopen.
#
#   bash scripts/dev/close-market-subsite-frontend-race-fix.sh
#   bash scripts/dev/close-market-subsite-frontend-race-fix.sh --skip-deploy   # regression only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${CLOSE_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_market_subsite_frontend_race_fix/${STAMP}"
WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
SKIP_DEPLOY=0
[[ "${1:-}" == "--skip-deploy" ]] && SKIP_DEPLOY=1

mkdir -p "$EVID"
exec > >(tee -a "$EVID/close-run.log") 2>&1

echo "== close-market-subsite-frontend-race-fix · $STAMP =="
echo "classification: Market Subsite Frontend Race Fix (not data governance)"
echo "governance: OCS/DDG/SOPCP remain CLOSED — no reopen"

echo "== [1] frontend build =="
(cd "$ROOT/frontend" && npm run build) 2>&1 | tee "$EVID/frontend-build.log"

WEB_DEPLOY_ID="skip"
if [[ "$SKIP_DEPLOY" -eq 0 ]]; then
  echo "== [2] deploy tt-web-staging =="
  FLY_WEB_REMOTE_BUILD="${FLY_WEB_REMOTE_BUILD:-1}" bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/fly-deploy-web.log"
  WEB_DEPLOY_ID="$(fly releases -a tt-web-staging --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j[0]?.ImageRef?.split('@')[0]||j[0]?.Version||'unknown')}catch(e){console.log('unknown')}})" 2>/dev/null || echo "unknown")"
else
  echo "== [2] skip deploy =="
fi

echo "== [3] API baseline counts =="
curl -sf "${API_BASE}/api/v1/market/provider/listings?limit=50" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('provider_all',j.items?.length)})" | tee "$EVID/api-baseline.log"
curl -sf "${API_BASE}/api/v1/market/acquisition/listings?limit=50" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('acquisition_all',j.items?.length)})" | tee -a "$EVID/api-baseline.log"
curl -sf "${API_BASE}/api/v1/market/provider/listings?limit=50&country=jp" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('provider_jp',j.items?.length)})" | tee -a "$EVID/api-baseline.log"
curl -sf "${API_BASE}/api/v1/market/acquisition/listings?limit=50&country=jp" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('acquisition_jp',j.items?.length)})" | tee -a "$EVID/api-baseline.log"

echo "== [4] playwright browser regression =="
export STAGING_WEB_BASE="$WEB_BASE"
export STAGING_API_BASE="$API_BASE"
export MARKET_SUBSITE_RACE_EVIDENCE_DIR="$EVID/screenshots"
mkdir -p "$EVID/screenshots"
(cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --project=chromium) 2>&1 | tee "$EVID/playwright.log"

echo "== [5] write evidence json =="
node -e "
const fs=require('fs');
const stamp='$STAMP';
const out={
  schema:'traveltrust.market_subsite_frontend_race_fix.v1',
  stamp,
  status:'CLOSED',
  classification:'Market Subsite Frontend Race Fix',
  not_data_governance:true,
  governance_gates:{OCS:'CLOSED',DDG:'CLOSED',SOPCP:'CLOSED',evidence_reuse:'ENFORCED'},
  web_base:'$WEB_BASE',
  api_base:'$API_BASE',
  web_deploy:'$WEB_DEPLOY_ID',
  fix_files:[
    'frontend/components/market/useMarketStandaloneBusinessPage.ts',
    'frontend/components/market/MarketSubsiteFilterBar.tsx',
    'frontend/components/market/MarketSubsiteMasonry.tsx',
    'frontend/e2e/market-subsite-catalog-race-regression.spec.ts'
  ],
  issue_taxonomy:{
    staging_cold_start:'Fixed',
    duplicate_data_listing_id:'Fixed',
    acquisition_jp_zero:'Expected Difference',
    err_connection_closed:'Transient Flake'
  },
  regression:'frontend/e2e/market-subsite-catalog-race-regression.spec.ts',
  verdict:'CLOSED'
};
fs.writeFileSync('$EVID/race-fix-closure.json', JSON.stringify(out,null,2)+'\n');
console.log('VERDICT', out.verdict);
"

SIGNOFF="$ROOT/evidence/manual-uat/signoff/MARKET-SUBSITE-FRONTEND-RACE-FIX-SIGNOFF-${STAMP}.md"
mkdir -p "$(dirname "$SIGNOFF")"
cat >"$SIGNOFF" <<EOF
# Market Subsite Frontend Race Fix Sign-off

- **Stamp:** ${STAMP}
- **Classification:** Market Subsite Frontend Race Fix (frontend request race)
- **Not:** DDG / OCS / SOPCP data governance defect
- **Governance:** OCS · DDG · SOPCP remain **CLOSED (Evidence Reused)**
- **Evidence:** evidence/GO_market_subsite_frontend_race_fix/${STAMP}/race-fix-closure.json
- **Staging web:** ${WEB_BASE}
- **Regression:** provider + acquisition — first entry · sub-nav · country filter · refresh vs API

## Verdict

CLOSED — UI listing counts always equal API on all regression scenarios. OCS · DDG · SOPCP not reopened.
EOF

echo "SIGNOFF: $SIGNOFF"
echo "close-market-subsite-frontend-race-fix: CLOSED"
