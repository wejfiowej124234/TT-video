#!/usr/bin/env bash
# Full Test Account E2E Validation — all business seed accounts on staging
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_full_test_account_e2e/$STAMP"
mkdir -p "$EVID"
ln -sfn "$EVID" "$ROOT/evidence/GO_full_test_account_e2e/latest" 2>/dev/null || true
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"

echo "== Full Test Account E2E Validation · $STAMP =="
echo "API=$API_BASE WEB=$WEB_BASE"

echo "== [1/4] Health =="
curl -fsS "$API_BASE/health" | tee "$EVID/health.json"
curl -fsSI "$WEB_BASE/" | head -5 | tee "$EVID/web-head.txt"

echo "== [2/4] API + DB-proxy probes (all accounts) =="
API="$API_BASE" FTAE_PROBE_JSON="$EVID/ftae-probes.json" \
  node "$ROOT/scripts/dev/full-test-account-e2e-probes.cjs" 2>&1 | tee "$EVID/ftae-probes.log"

echo "== [3/4] Browser E2E (UI + API parity per account) =="
(
  cd "$ROOT/frontend"
  PLAYWRIGHT_GOTO_RETRY_ATTEMPTS=3 \
  STAGING_WEB_BASE="$WEB_BASE" STAGING_API_BASE="$API_BASE" \
  FTAE_BROWSER_JSON="$EVID/browser-results.json" \
    npx playwright test e2e/full-test-account-e2e-staging.spec.ts --project=chromium --reporter=line
) 2>&1 | tee "$EVID/ftae-browser.log"

echo "== [4/4] Ledger =="
ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$EVID" \
  node "$ROOT/scripts/dev/gen-full-test-account-e2e-ledger.cjs" 2>&1 | tee "$EVID/ledger-gen.log"

echo "Evidence: $EVID"
node -e "
const j=require(process.argv[1]);
console.log(JSON.stringify({ verdict: j.verdict, summary: j.summary, accounts: j.accounts }, null, 2));
" "$EVID/ftae-ledger.json"
