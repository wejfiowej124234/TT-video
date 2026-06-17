#!/usr/bin/env bash
# ① 本地 · 向导资料 settings + Admin 审核队列 API 烟测（非 ②③ GO）
#
# 用法（仓库根，start-api-with-seed 已起）：
#   bash scripts/dev/smoke-guide-profile-settings-local.sh
#
# 可选：API_BASE=http://127.0.0.1:8080
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
GUIDE_EMAIL="${SMOKE_GUIDE_EMAIL:-guide@test.com}"
ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-tourist@test.com}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"

fail() { echo "smoke-guide-profile-settings: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-guide-profile-settings: OK $*" ; }

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

GUIDE_TOKEN="$(login "$GUIDE_EMAIL")"
ADMIN_TOKEN="$(login "$ADMIN_EMAIL")"

get_profile="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/guide-profile" \
  -H "Authorization: Bearer $GUIDE_TOKEN")"
get_code="${get_profile##*$'\n'}"
get_body="${get_profile%$'\n'*}"
[[ "$get_code" == "200" ]] || fail "GET me/guide-profile HTTP $get_code body=$get_body"
node -e "
const o=JSON.parse(process.argv[1]);
const p=o.profile;
if(!p) process.exit(1);
const gateOk=typeof p.profile_patch_allowed==='boolean';
const curOk=p.hourly_currency==='USDC';
if(!gateOk||!curOk){
  console.warn('smoke-guide-profile-settings: WARN API missing P0 fields (profile_patch_allowed/hourly_currency) — rebuild & restart traveltrust-api');
  if(process.env.TRAVELTRUST_SMOKE_STRICT_GUIDE_PROFILE==='1') process.exit(4);
}
" "$get_body" || fail "GET profile invalid JSON or missing profile"
ok "GET me/guide-profile"

patch_body='{"city":"Hangzhou","country_code":"CN","languages":["zh","en"],"service_types":["walking"],"bio":"Smoke guide profile bio","hourly_rate":"48","public_title":"Hangzhou culture guide","avatar_url":"https://example.com/guide-avatar.png"}'
patch_resp="$(curl -sS -w '\n%{http_code}' -X PATCH "$API_BASE/api/v1/me/guide-profile" \
  -H "Authorization: Bearer $GUIDE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$patch_body")"
patch_code="${patch_resp##*$'\n'}"
patch_body_out="${patch_resp%$'\n'*}"
[[ "$patch_code" == "200" ]] || fail "PATCH me/guide-profile HTTP $patch_code body=$patch_body_out"
node -e "const o=JSON.parse(process.argv[1]); if(o.profile?.city!=='Hangzhou'||o.profile?.hourly_rate!=='48'||o.profile?.public_title!=='Hangzhou culture guide') process.exit(1);" "$patch_body_out" \
  || fail "PATCH profile fields mismatch"
ok "PATCH me/guide-profile"

list_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/admin/guide-applications?status=active" \
  -H "Authorization: Bearer $ADMIN_TOKEN")"
list_code="${list_resp##*$'\n'}"
list_body="${list_resp%$'\n'*}"
[[ "$list_code" == "200" ]] || fail "GET admin/guide-applications HTTP $list_code"
node -e "const o=JSON.parse(process.argv[1]); if(!Array.isArray(o.items)) process.exit(1);" "$list_body" \
  || fail "admin list missing items[]"
ok "GET admin/guide-applications"

echo "smoke-guide-profile-settings: ALL PASS (① local)"
