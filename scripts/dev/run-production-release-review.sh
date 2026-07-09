#!/usr/bin/env bash
# Production Release Review · Business Domain Validation (not a new audit type)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_production_release_review/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

echo "== Production Release Review · Business Domain Validation · $STAMP =="
echo "SSOT: docs/runbook/TT-PRODUCTION-RELEASE-REVIEW.md"

echo "== [1/6] Prior gates (SSOT) =="
bash "$ROOT/scripts/gates/check-release-pipeline-ssot.sh" | tee "$EVID/gates.log"

echo "== [2/6] Business domain API probes (local + staging) =="
bash -c "API_BASE=http://127.0.0.1:8080 ENV_LABEL=local node $ROOT/scripts/dev/business-domain-validation-probes.cjs" 2>&1 | tee "$EVID/bdv-probes-local.log" || echo "WARN local API probes skipped"
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  node "$ROOT/scripts/dev/business-domain-validation-probes.cjs" 2>&1 | tee "$EVID/bdv-probes-staging.log"

echo "== [3/6] Frontend-API consistency (staging strict) =="
STRICT_WARNINGS=1 API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash "$ROOT/scripts/dev/run-frontend-api-consistency-audit.sh" 2>&1 | tee "$EVID/fe-api.log"

echo "== [4/7] Business domain browser (staging) =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev STAGING_API_BASE=https://tt-api-staging.fly.dev \
    npx playwright test e2e/business-domain-validation.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/bdv-browser.log" || echo "WARN: bdv-browser had failures (see log)"

echo "== [5/7] Enterprise Release Review browser (Guide-depth parity) =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev STAGING_API_BASE=https://tt-api-staging.fly.dev \
    npx playwright test e2e/enterprise-release-review.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/err-browser.log" || echo "WARN: err-browser had failures (see log)"

echo "== [6/7] Release Review Ledger =="
ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$EVID" \
  node "$ROOT/scripts/dev/gen-production-release-review-ledger.cjs" | tee "$EVID/ledger-gen.log"

echo "== [7/7] Summary =="
node -e "const j=require(process.argv[1]);console.log(JSON.stringify(j.summary,null,2));" "$EVID/release-review-ledger.json"
echo "Evidence: $EVID"
