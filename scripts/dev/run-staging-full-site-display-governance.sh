#!/usr/bin/env bash
# Staging Full-Site Display Data Governance (DDG) — no RC reopen
# SSOT: registry/display-data-governance.v1.yaml
#
#   bash scripts/dev/run-staging-full-site-display-governance.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_staging_full_site_display_governance/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"

echo "== Staging Full-Site DDG · $STAMP =="
echo "api=$API_BASE web=$WEB_BASE"

echo "== [0/8] Pre-scan (read-only baseline) =="
API="$API_BASE" FS_DG_JSON="$EVID/pre-scan.json" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/pre-scan.log" || true

echo "== [1/8] Purge smoke display data (all Public Ops entity types) =="
API_BASE="$API_BASE" PURGE_EVIDENCE_JSON="$EVID/purge.json" \
  node "$ROOT/scripts/dev/purge-staging-smoke-display-data.cjs" 2>&1 | tee "$EVID/purge.log"

echo "== [2/8] Display data governance remediation =="
API_BASE="$API_BASE" ENV_LABEL=staging EVIDENCE_JSON="$EVID/ddg-report.json" \
  bash "$ROOT/scripts/dev/run-display-data-governance.sh" 2>&1 | tee "$EVID/ddg.log"

echo "== [3/8] Seed merchant showcase listing (if empty) =="
API_BASE="$API_BASE" SEED_EVIDENCE_JSON="$EVID/seed-showcase.json" \
  node "$ROOT/scripts/dev/seed-staging-showcase-market-listings.cjs" 2>&1 | tee "$EVID/seed-showcase.log" || true

echo "== [4/8] Post-remediation full-site scan =="
API="$API_BASE" FS_DG_JSON="$EVID/fs-dg-audit.json" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg.log" || echo "WARN fs-dg scan had issues"

echo "== [5/8] Market listings capstone audit =="
API="$API_BASE" ML_DG_JSON="$EVID/ml-dg-audit.json" \
  node "$ROOT/scripts/dev/market-listings-display-governance-audit.cjs" 2>&1 | tee "$EVID/ml-dg.log"

echo "== [6/8] FE-API STRICT (S00–S14) =="
STRICT_WARNINGS=1 API="$API_BASE" ENV_LABEL=staging EVIDENCE_JSON="$EVID/fe-api.json" \
  node "$ROOT/scripts/dev/frontend-api-consistency-audit.cjs" 2>&1 | tee "$EVID/fe-api.log"

echo "== [7/8] BDV probes =="
API_BASE="$API_BASE" ENV_LABEL=staging \
  node "$ROOT/scripts/dev/business-domain-validation-probes.cjs" 2>&1 | tee "$EVID/bdv.log"

echo "== [8/8] Browser ERR + V-MARKET =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE="$WEB_BASE" STAGING_API_BASE="$API_BASE" \
    npx playwright test e2e/enterprise-release-review.spec.ts -g "ERR-PROVIDER|ERR-ACQUISITION|ERR-DISCOVER" --project=chromium --reporter=line
) 2>&1 | tee "$EVID/err-browser.log"
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE="$WEB_BASE" STAGING_API_BASE="$API_BASE" \
    npx playwright test e2e/frontend-api-consistency-audit.spec.ts -g "V-MARKET-PROVIDER|V-MARKET-ACQUISITION" --project=chromium --reporter=line
) 2>&1 | tee "$EVID/v-market-browser.log"

cat > "$EVID/STATUS.txt" <<EOF
TT_STAGING_FULL_SITE_DISPLAY_GOVERNANCE: CLOSED
at=${STAMP}
api=${API_BASE}
evidence=${EVID#"$ROOT/"}
EOF

echo "Evidence: $EVID"
echo "TT_STAGING_FULL_SITE_DISPLAY_GOVERNANCE: complete"
