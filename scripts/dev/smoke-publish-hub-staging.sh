#!/usr/bin/env bash
# ② 测试网 · 发布中心 Wave 1 / PH-B-1～B-3 · B-7 烟测（非 ③ GO）
#
# 须 G-1/G-2 清闸 + Owner scope 后执行：
#   export STAGING_API_BASE=https://your-staging-api.example
#   export STAGING_FE_BASE=https://your-staging-fe.example   # 可选 · PW
#   bash scripts/dev/smoke-publish-hub-staging.sh
#
# 目标末行：TT_PUBLISH_HUB_STAGING: OK phase=② wave1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_BASE="${STAGING_API_BASE:-${API_BASE:-}}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"
PUBLISH_SUMMARY_EMAIL="${SMOKE_PUBLISH_HUB_EMAIL:-multi-demo@test.com}"

fail() { echo "smoke-publish-hub-staging: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-publish-hub-staging: OK $*"; }

if [[ -z "$API_BASE" ]]; then
  fail "G-2: set STAGING_API_BASE (staging API HTTPS reachable) — see PHASE2-START-CHECKLIST G-1/G-2"
fi

login() {
  local email="$1"
  local resp code
  curl -sS -X POST "$API_BASE/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login $email HTTP $code"
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.token);" "$resp"
}

probe_get() {
  local label="$1" token="$2" path="$3"
  local resp code
  resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE$path" -H "Authorization: Bearer $token")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "GET $path ($label) HTTP $code body=${resp:0:240}"
  ok "GET $path ($label)"
}

ok "G-2 preflight API_BASE=$API_BASE"

TOKEN="$(login "$PUBLISH_SUMMARY_EMAIL")"

# PH-B-1 · api publish-summary（W1-A3 · 未部署时 fail 为诚实 ② 未就绪）
probe_get "publish-summary" "$TOKEN" "/api/v1/me/publish-summary"

# PH-B-3 子集 · 五轨 owner 读 API（存在性探针）
probe_get "guide-profile" "$TOKEN" "/api/v1/me/guide-profile"
probe_get "merchant-listings" "$TOKEN" "/api/v1/me/merchant-listings"
probe_get "acquisition-listings" "$TOKEN" "/api/v1/me/acquisition-listings"
probe_get "governance-mine" "$TOKEN" "/api/v1/governance/proposals?mine=1"

if [[ -d "$ROOT/frontend" ]]; then
  cd "$ROOT/frontend"
  npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"
  npm run test -- publishHubServerSummaryModel publishHubPublishSummaryRoute publishHubIdentityDefaultFilter publishHubOperatingSpineModel publishHubWorkspaceContextSync workspaceContextWorkbenchNav activeWorkspaceContext accountOperatingModelUxWave1 --run >/dev/null || fail "vitest publish hub staging contract subset"
  ok "vitest staging contract subset"
fi

if [[ "${PLAYWRIGHT_PUBLISH_HUB_STAGING:-}" == "1" && -n "${STAGING_FE_BASE:-}" ]]; then
  PLAYWRIGHT_BASE_URL="$STAGING_FE_BASE" node ./scripts/run-e2e-default.mjs --project=chromium e2e/publish-hub-l5.spec.ts || fail "playwright publish-hub staging"
  ok "playwright publish-hub-l5 staging"
fi

echo "TT_PUBLISH_HUB_STAGING: OK phase=② wave1 publish-summary+rails-probe"
