#!/usr/bin/env bash
# 最小 Playwright 验收：已部署的 tt-web-staging
#
#   bash scripts/dev/smoke-staging-web.sh
#   STAGING_WEB_BASE=https://tt-web-staging.fly.dev bash scripts/dev/smoke-staging-web.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

export STAGING_WEB_SMOKE=1
export PLAYWRIGHT_BASE_URL="$WEB_BASE"
export PLAYWRIGHT_API_BASE_URL="$API_BASE"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_EXPECT_CHAIN_ID=11155111

if [[ -n "${HTTPS_PROXY:-}" ]]; then
  export PLAYWRIGHT_PROXY_SERVER="$HTTPS_PROXY"
elif [[ -n "${HTTP_PROXY:-}" ]]; then
  export PLAYWRIGHT_PROXY_SERVER="$HTTP_PROXY"
fi

echo "smoke-staging-web: preflight alignment …"
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  --web-base "$WEB_BASE" \
  --api-base "$API_BASE"

cd "$ROOT/frontend"
npx playwright test e2e/staging-web-smoke.spec.ts \
  --config=playwright.p2fc-staging.config.ts \
  --project=chromium

echo "smoke-staging-web: OK · ${WEB_BASE} · ≠ Production GO"
