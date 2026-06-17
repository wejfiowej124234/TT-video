#!/usr/bin/env bash
# Identity Center P2 · ② staging · 四轨 profile API 烟测（非 ③ GO）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/smoke-identity-p2-settings-staging.sh
set -euo pipefail

API_BASE="${STAGING_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"

fail() { echo "smoke-identity-p2-settings-staging: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-identity-p2-settings-staging: OK $*"; }

login() {
  local email="$1"
  local resp code
  curl -sS -X POST "$API_BASE/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
  curl -sS -X POST "$API_BASE/auth/seed-test-accounts" \
    -H "Content-Type: application/json" \
    -d '{"promote_admin_email":"tourist@test.com"}' >/dev/null 2>&1 || true
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login $email HTTP $code"
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.token);" "$resp"
}

probe_get() {
  local label="$1" token="$2" path="$3" allow404="${4:-0}"
  local resp code
  resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE$path" -H "Authorization: Bearer $token")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  if [[ "$code" == "200" ]]; then
    ok "GET $path ($label)"
  elif [[ "$allow404" == "1" && "$code" == "404" ]]; then
    ok "GET $path ($label) — no row (404 ok)"
  else
    fail "GET $path ($label) HTTP $code body=${resp:0:200}"
  fi
}

GUIDE_TOKEN="$(login "guide@test.com")"
TOURIST_TOKEN="$(login "tourist@test.com")"

probe_get "guide" "$GUIDE_TOKEN" "/api/v1/me/guide-profile" 0
patch_body='{"bio":"Staging P2 smoke"}'
pg_code="$(curl -sS -o /dev/null -w '%{http_code}' -X PATCH "$API_BASE/api/v1/me/guide-profile" \
  -H "Authorization: Bearer $GUIDE_TOKEN" -H "Content-Type: application/json" -d "$patch_body")"
[[ "$pg_code" == "200" ]] || fail "PATCH guide-profile HTTP $pg_code"
ok "PATCH /api/v1/me/guide-profile"

probe_get "merchant" "$TOURIST_TOKEN" "/api/v1/me/merchant-profile" 1
probe_get "steward" "$TOURIST_TOKEN" "/api/v1/me/region-steward-profile" 1
probe_get "acquisition" "$TOURIST_TOKEN" "/api/v1/me/acquisition-profile" 0

echo "smoke-identity-p2-settings-staging: ALL PASS (② staging · Identity Center P2)"
