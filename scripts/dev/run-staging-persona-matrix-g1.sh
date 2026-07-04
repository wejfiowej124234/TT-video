#!/usr/bin/env bash
# G1 · Staging persona matrix (C1–C4, E2) — ② only · E1 skipped per registry
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID_REL="${G1_STAGING_EVID:-evidence/GO_production_readiness/wave-1-1-g1/${STAMP}/staging-persona-matrix}"
EVID="$ROOT/$EVID_REL"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
RESULTS="$EVID/browser-results.json"

mkdir -p "$EVID"

echo "=== G1 Staging Persona Matrix · $STAMP ==="
echo "web=$WEB api=$API"

if ! curl --noproxy "*" -sf --max-time 20 "${API}/health" >/dev/null; then
  echo "FAIL: staging API down ($API)" >&2
  exit 2
fi

curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true

export STAGING_WEB_BASE="$WEB"
export STAGING_API_BASE="$API"
export FTAE_BROWSER_JSON="$RESULTS"
export PLAYWRIGHT_BASE_URL="$WEB"
export PLAYWRIGHT_API_BASE_URL="$API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_EXPECT_CHAIN_ID=11155111

cd "$ROOT/frontend"
npx playwright test e2e/full-test-account-e2e-staging.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --reporter=list > "$EVID/playwright.log" 2>&1
PW_RC=$?
cat "$EVID/playwright.log"
if [[ "$PW_RC" -ne 0 ]]; then
  echo "FAIL: staging persona playwright exit $PW_RC" >&2
  exit "$PW_RC"
fi

node "$ROOT/scripts/dev/validate-staging-persona-matrix-g1.cjs" \
  --results "$EVID_REL/browser-results.json" \
  --evidence-dir "$EVID_REL"

echo "G1_STAGING_PERSONA_MATRIX: PASS · $EVID"
