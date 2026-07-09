#!/usr/bin/env bash
# Staging · Admin Public Operations API + FE smoke（F-OO-05～19 路由对齐探针）
set -euo pipefail

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
EMAIL="${STAGING_AUDIT_EMAIL:-tourist@test.com}"
PASS="${STAGING_AUDIT_PASSWORD:-Test123!}"

fail() { echo "smoke-staging-admin-public-operations: FAIL $*" >&2; exit 1; }

hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$API/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "$API/health -> $hc"

login_body="$(curl -sS --max-time 30 -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")"
tok="$(node -e "try{console.log(JSON.parse(process.argv[1]).token||'')}catch(e){}" "$login_body")"
[[ -n "$tok" ]] || fail "login failed for $EMAIL"

probe_api() {
  local path="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 \
    -H "Authorization: Bearer $tok" "$API$path" 2>/dev/null || echo 000)"
  if [[ "$code" != "200" ]]; then
    echo "FAIL API $path -> HTTP $code"
    return 1
  fi
  echo "OK   API $path -> HTTP $code"
}

echo "== staging admin public-operations API smoke =="
probe_api /api/v1/admin/capabilities
probe_api /api/v1/admin/official/public-operations/stats
probe_api /api/v1/admin/official/public-operations/publish-queue
probe_api /api/v1/admin/official/public-operations/policy
probe_api /api/v1/admin/official/public-operations/history
probe_api /api/v1/admin/official/public-operations/campaigns
probe_api /api/v1/admin/official/public-operations/campaigns/kinds

echo "== staging admin content + cold-start API smoke =="
probe_api /api/v1/admin/content/countries
probe_api /api/v1/admin/content/publish-queue
probe_api /api/v1/admin/official/cold-start/campaigns

fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$WEB/admin/official/public-operations" 2>/dev/null || echo 000)"
case "$fe_code" in
  200|307|308) echo "OK   FE /admin/official/public-operations -> HTTP $fe_code" ;;
  *) fail "FE /admin/official/public-operations -> HTTP $fe_code" ;;
esac

echo "smoke-staging-admin-public-operations: exit 0"
