#!/usr/bin/env bash
# Staging · Frontend–API Consistency Audit · API strict + browser Playwright + screenshots
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_frontend_api_consistency_audit/staging_browser_${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

echo "== [1/3] API layer strict audit =="
STRICT_WARNINGS=1 API_BASE="$API" ENV_LABEL=staging \
  EVIDENCE_JSON="$EVID/audit-report.json" \
  bash "$ROOT/scripts/dev/run-frontend-api-consistency-audit.sh"

echo "== [2/3] Browser layer Playwright =="
(
  cd "$ROOT/frontend"
  STAGING_WEB_BASE="$WEB" STAGING_API_BASE="$API" \
  CONSISTENCY_AUDIT_SCREENSHOT_DIR="$EVID/screenshots" \
  npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium --reporter=line
)

echo "== [3/3] Summary report =="
node -e "
const fs=require('fs');
const p=process.argv[1];
const api=JSON.parse(fs.readFileSync(p+'/audit-report.json','utf8'));
const report={
  schema:'traveltrust.frontend_api_consistency_audit_browser.v1',
  stamp: process.argv[2],
  web: process.argv[3],
  api: process.argv[4],
  api_layer:{blocking:api.blocking.length,warnings:api.warnings.length,pass:api.pass,strict:api.strict_warnings},
  browser_layer:{playwright:'frontend/e2e/frontend-api-consistency-audit.spec.ts',screenshots_dir:p+'/screenshots'},
  deploy_web:'tt-web-staging',
  verdict: api.pass ? 'PASS' : 'FAIL',
};
fs.writeFileSync(p+'/browser-report.json', JSON.stringify(report,null,2));
" "$EVID" "$STAMP" "$WEB" "$API"

cat "$EVID/browser-report.json"
echo "Evidence: $EVID"
echo "TT_FRONTEND_API_CONSISTENCY_AUDIT_STAGING_BROWSER: OK"
