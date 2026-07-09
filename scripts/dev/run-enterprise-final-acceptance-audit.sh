#!/usr/bin/env bash
# Enterprise Final Acceptance Audit · synthesis of closed product gates + staging re-verify
# NOT a new recurring audit dimension — one-shot capstone ledger (see TT-PRODUCT-DEVELOPMENT-FREEZE)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_enterprise_final_acceptance/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

echo "== Enterprise Final Acceptance Audit · $STAMP =="
echo "SSOT: docs/runbook/TT-ENTERPRISE-FINAL-ACCEPTANCE-AUDIT.md"
echo "Synthesizes: Phase12 · PRR · FE-API · BDV · ERR browser · Guide visual consistency"

echo "== [1/8] Release pipeline + product freeze gates =="
bash "$ROOT/scripts/gates/check-release-pipeline-ssot.sh" 2>&1 | tee "$EVID/gates.log"

echo "== [2/8] Business domain API probes (staging) =="
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  node "$ROOT/scripts/dev/business-domain-validation-probes.cjs" 2>&1 | tee "$EVID/bdv-probes-staging.log"

echo "== [3/8] Frontend-API consistency API layer (staging strict) =="
STRICT_WARNINGS=1 API=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  EVIDENCE_JSON="$EVID/fe-api-audit.json" \
  node "$ROOT/scripts/dev/frontend-api-consistency-audit.cjs" 2>&1 | tee "$EVID/fe-api.log" || echo "WARN fe-api strict failed"

echo "== [4/8] Guide-depth visual consistency browser =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev STAGING_API_BASE=https://tt-api-staging.fly.dev \
    npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/fe-api-browser.log" || echo "WARN fe-api browser failures"

echo "== [5/8] Business domain browser =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev STAGING_API_BASE=https://tt-api-staging.fly.dev \
    npx playwright test e2e/business-domain-validation.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/bdv-browser.log" || echo "WARN bdv browser failures"

echo "== [6/8] Enterprise Release Review browser (all domains parity) =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev STAGING_API_BASE=https://tt-api-staging.fly.dev \
    npx playwright test e2e/enterprise-release-review.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/err-browser.log" || echo "WARN err browser failures"

echo "== [7/8] Enterprise Acceptance Ledger =="
ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$EVID" \
  node "$ROOT/scripts/dev/gen-enterprise-acceptance-ledger.cjs" 2>&1 | tee "$EVID/ledger-gen.log"

echo "== [8/8] Summary =="
node -e "
const j=require(process.argv[1]);
console.log(JSON.stringify({ summary: j.summary, machine_keys: j.machine_keys, issue_counts: j.issue_counts }, null, 2));
" "$EVID/enterprise-acceptance-ledger.json"
echo "Evidence: $EVID"
