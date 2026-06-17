#!/usr/bin/env bash
# IDENTITY-P2-SPRINT · ① 本地 · 四轨 identity settings API 烟测（非 ②③ GO）
#
# 用法（start-api-with-seed 已起）：
#   bash scripts/dev/smoke-identity-p2-settings-local.sh
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"

fail() { echo "smoke-identity-p2-settings: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-identity-p2-settings: OK $*"; }

login() {
  local email="$1"
  local resp code
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login $email HTTP $code"
  node -e "const o=JSON.parse(process.argv[1]); if(!o.token) process.exit(1);" "$resp" || fail "login $email missing token"
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.token);" "$resp"
}

probe_get() {
  local label="$1" token="$2" path="$3"
  local resp code
  resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE$path" -H "Authorization: Bearer $token")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "GET $path ($label) HTTP $code body=${resp:0:200}"
  node -e "const o=JSON.parse(process.argv[1]); if(o.status!=='ok') process.exit(1);" "$resp" || fail "GET $path status not ok"
  ok "GET $path ($label)"
}

GUIDE_TOKEN="$(login "guide@test.com")"
TOURIST_TOKEN="$(login "tourist@test.com")"

probe_get "guide" "$GUIDE_TOKEN" "/api/v1/me/guide-profile"

patch_guide='{"bio":"P2 smoke guide bio"}'
pg_resp="$(curl -sS -w '\n%{http_code}' -X PATCH "$API_BASE/api/v1/me/guide-profile" \
  -H "Authorization: Bearer $GUIDE_TOKEN" -H "Content-Type: application/json" -d "$patch_guide")"
pg_code="${pg_resp##*$'\n'}"
[[ "$pg_code" == "200" ]] || fail "PATCH guide-profile HTTP $pg_code"
ok "PATCH /api/v1/me/guide-profile"

# Merchant/steward may 404 without application row — accept 200 or documented 404
for pair in "merchant:/api/v1/me/merchant-profile" "steward:/api/v1/me/region-steward-profile" "acquisition:/api/v1/me/acquisition-profile"; do
  label="${pair%%:*}"
  path="${pair#*:}"
  resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE$path" -H "Authorization: Bearer $TOURIST_TOKEN")"
  code="${resp##*$'\n'}"
  if [[ "$code" == "200" ]]; then
    ok "GET $path ($label)"
  elif [[ "$code" == "404" && "$label" != "acquisition" ]]; then
    ok "GET $path ($label) — no row yet (404 expected)"
  elif [[ "$code" == "200" || "$code" == "404" ]]; then
    ok "GET $path ($label) HTTP $code"
  else
    fail "GET $path ($label) unexpected HTTP $code"
  fi
done

echo "smoke-identity-p2-settings: ALL PASS (① local · IDENTITY-P2-SPRINT)"
