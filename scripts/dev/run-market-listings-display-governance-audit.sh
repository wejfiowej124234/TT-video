#!/usr/bin/env bash
# Provider + Acquisition · Display Data Governance + FE/API parity audit (staging)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_market_listings_display_governance/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"

echo "== Market Listings Display Governance · $STAMP =="

echo "== [0/6] Purge smoke listings (Multi-demo / probe / smoke) =="
API_BASE="$API_BASE" \
  node "$ROOT/scripts/dev/purge-staging-smoke-market-listings.cjs" 2>&1 | tee "$EVID/purge-smoke.log" || echo "WARN purge"

echo "== [1/6] Display data governance (guides + market_listings) =="
API_BASE="$API_BASE" ENV_LABEL=staging \
  bash "$ROOT/scripts/dev/run-display-data-governance.sh" 2>&1 | tee "$EVID/ddg.log" || echo "WARN ddg"

echo "== [2/6] ML display governance audit =="
API="$API_BASE" ML_DG_JSON="$EVID/ml-dg-audit.json" \
  node "$ROOT/scripts/dev/market-listings-display-governance-audit.cjs" 2>&1 | tee "$EVID/ml-dg.log"

echo "== [3/6] Seed showcase listings (merchant@test.com) =="
API_BASE="$API_BASE" \
  node "$ROOT/scripts/dev/seed-staging-showcase-market-listings.cjs" 2>&1 | tee "$EVID/seed-showcase.log" || echo "WARN seed"

echo "== [4/6] Frontend-API strict (S12 listings) =="
STRICT_WARNINGS=1 API="$API_BASE" ENV_LABEL=staging EVIDENCE_JSON="$EVID/fe-api.json" \
  node "$ROOT/scripts/dev/frontend-api-consistency-audit.cjs" 2>&1 | tee "$EVID/fe-api.log"

echo "== [5/6] BDV probes =="
API_BASE="$API_BASE" ENV_LABEL=staging \
  node "$ROOT/scripts/dev/business-domain-validation-probes.cjs" 2>&1 | tee "$EVID/bdv.log"

echo "== [6/6] Browser parity (ERR + V-MARKET provider/acquisition) =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE="$WEB_BASE" STAGING_API_BASE="$API_BASE" \
    npx playwright test e2e/enterprise-release-review.spec.ts -g "ERR-PROVIDER|ERR-ACQUISITION" --project=chromium --reporter=line
) 2>&1 | tee "$EVID/err-browser.log"
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE="$WEB_BASE" STAGING_API_BASE="$API_BASE" \
    npx playwright test e2e/frontend-api-consistency-audit.spec.ts -g "V-MARKET-PROVIDER|V-MARKET-ACQUISITION" --project=chromium --reporter=line
) 2>&1 | tee "$EVID/fe-browser.log"

echo "Evidence: $EVID"
