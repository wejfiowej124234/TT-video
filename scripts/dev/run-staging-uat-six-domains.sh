#!/usr/bin/env bash
# Phase ② · tt-web-staging 六大域 UAT + 缺陷 JSON
#
#   bash scripts/dev/run-staging-uat-six-domains.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
OUT="${STAGING_UAT_OUT:-$ROOT/evidence/staging-uat-six-domains/$(date -u +%Y%m%dT%H%M%SZ)}"
STAGING_UAT_EMAIL="${STAGING_UAT_EMAIL:-tourist@test.com}"
STAGING_UAT_PASSWORD="${STAGING_UAT_PASSWORD:-Test123!}"

export STAGING_UAT_SIX_DOMAINS=1
export STAGING_UAT_OUT="$OUT"
export STAGING_UAT_EMAIL
export STAGING_UAT_PASSWORD
export PLAYWRIGHT_BASE_URL="$WEB"
export PLAYWRIGHT_API_BASE_URL="$API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_EXPECT_CHAIN_ID=11155111

mkdir -p "$OUT"

echo "run-staging-uat-six-domains: alignment preflight …"
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" --web-base "$WEB" --api-base "$API" || true

echo "run-staging-uat-six-domains: seed + login (Bearer for auth-gated routes) …"
curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null 2>&1 || true
curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -d "{\"promote_admin_email\":\"${STAGING_UAT_EMAIL}\"}" >/dev/null 2>&1 || true

LOGIN_JSON="$(curl --noproxy "*" -sS -X POST "${API}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${STAGING_UAT_EMAIL}\",\"password\":\"${STAGING_UAT_PASSWORD}\"}" 2>/dev/null || echo '{}')"

read -r STAGING_UAT_BEARER_TOKEN STAGING_UAT_USER_ID <<<"$(echo "$LOGIN_JSON" | python -c "import sys,json; b=json.load(sys.stdin); print((b.get('token') or '').strip(), (b.get('user_id') or '').strip())" 2>/dev/null || echo ' ')"
if [[ -z "$STAGING_UAT_BEARER_TOKEN" ]]; then
  echo "run-staging-uat-six-domains: FAIL login — ensure SEED_TEST_ACCOUNTS=1 and ${STAGING_UAT_EMAIL} on ${API}" >&2
  exit 2
fi
export STAGING_UAT_BEARER_TOKEN
export STAGING_UAT_USER_ID
echo "run-staging-uat-six-domains: OK bearer token (${#STAGING_UAT_BEARER_TOKEN} chars) user_id=${STAGING_UAT_USER_ID:-?} for ${STAGING_UAT_EMAIL}"

cd "$ROOT/frontend"
npx playwright test e2e/staging-uat-six-domains.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --reporter=list

echo "run-staging-uat-six-domains: findings → $OUT/uat-findings.json"
ln -sfn "$(basename "$OUT")" "$ROOT/evidence/staging-uat-six-domains/latest" 2>/dev/null || \
  cp -r "$OUT" "$ROOT/evidence/staging-uat-six-domains/latest" 2>/dev/null || true

echo "run-staging-uat-six-domains: generate matrix …"
python "$ROOT/scripts/dev/generate-staging-uat-readiness-matrix.py" \
  --findings "$OUT/uat-findings.json" \
  --out "$ROOT/docs/runbook/PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md"

echo "run-staging-uat-six-domains: OK · $OUT · ≠ Production GO"
