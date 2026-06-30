#!/usr/bin/env bash
# L3 · ① 本地 Multi-Identity Closure 烟测 — 唯一验收账号 multi-demo@test.com
#
# 覆盖：登录 → GET /me 五槽 → guide/merchant/steward/acquisition 资料读写
#       → POST market/provider/listings · POST market/acquisition/listings
#       （收购 listing：已存在 published 或 429 rate_limited 时幂等跳过 — PH-L5/重复跑栈）
#
# 前提：API 已起 · DATABASE_URL 可用 · SEED_TEST_ACCOUNTS=1（或已存在 multi-demo 账号）
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-multi-identity-closure-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
EMAIL="multi-demo@test.com"
PASSWORD="Test123!"
STAMP="$(date +%s)"

fail() { echo "smoke-multi-identity-closure: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-multi-identity-closure: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

slot_state() {
  local me_json="$1" slot_id="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const id=process.argv[2];
    const slots=o.identity_slots||[];
    const s=slots.find(x=>x.id===id);
    process.stdout.write(s?.state||'missing');
  " "$me_json" "$slot_id"
}

acquisition_published_count() {
  local token="$1"
  local out code body
  out="$(curl_json GET "$API_BASE/api/v1/me/acquisition-listings" "" "$token")"
  code="${out%%|*}"
  body="${out#*|}"
  if [[ "$code" != "200" ]]; then
    echo "0"
    return 0
  fi
  node -e "
    const o=JSON.parse(process.argv[1]);
    process.stdout.write(String((o.published||[]).length));
  " "$body"
}

assert_acquisition_listing_publish() {
  local token="$1"
  local existing
  existing="$(acquisition_published_count "$token")"
  if [[ "${existing:-0}" -gt 0 ]]; then
    ok "acquisition listing publish (idempotent skip: ${existing} published already)"
    return 0
  fi

  local acq_listing acq_code acq_body
  acq_listing="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"Multi-demo acq ${STAMP}\",\"bountyMinUsdc\":120,\"bountyMaxUsdc\":350,\"description\":\"L3 closure\"}}" "$token")"
  acq_code="${acq_listing%%|*}"
  acq_body="${acq_listing#*|}"

  if [[ "$acq_code" == "200" || "$acq_code" == "201" ]]; then
    ok "acquisition listing publish"
    return 0
  fi

  if [[ "$acq_code" == "429" ]] && echo "$acq_body" | grep -q 'acquisition_publish_rate_limited'; then
    existing="$(acquisition_published_count "$token")"
    if [[ "${existing:-0}" -gt 0 ]]; then
      ok "acquisition listing publish (idempotent: rate_limited with ${existing} published already)"
      return 0
    fi
    fail "POST acquisition listing HTTP 429 rate_limited and no published listings body=$acq_body"
  fi

  fail "POST acquisition listing HTTP $acq_code body=$acq_body"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

echo "== smoke-multi-identity-closure-local (① only) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
login_code="${login_out%%|*}"
login_body="${login_out#*|}"
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code body=$login_body (restart API with SEED_TEST_ACCOUNTS=1?)"
TOKEN="$(json_field "$login_body" token)"
[[ -n "$TOKEN" ]] || fail "token missing"
ok "login $EMAIL"

me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$TOKEN")"
me_code="${me_out%%|*}"
me_body="${me_out#*|}"
if [[ "$me_code" == "401" ]]; then
  ok "GET /me 401 — re-login retry"
  login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
  login_code="${login_out%%|*}"
  login_body="${login_out#*|}"
  [[ "$login_code" == "200" ]] || fail "re-login HTTP $login_code"
  TOKEN="$(json_field "$login_body" token)"
  [[ -n "$TOKEN" ]] || fail "re-login token missing"
  me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$TOKEN")"
  me_code="${me_out%%|*}"
  me_body="${me_out#*|}"
fi
[[ "$me_code" == "200" ]] || fail "GET /me HTTP $me_code"
[[ "$(slot_state "$me_body" traveler)" == "active" ]] || fail "traveler slot not active"
[[ "$(slot_state "$me_body" guide)" == "active" ]] || fail "guide slot not active"
[[ "$(slot_state "$me_body" merchant)" == "active" ]] || fail "merchant slot not active (check provider app + PG entitlement)"
[[ "$(slot_state "$me_body" region_steward)" == "active" ]] || fail "steward slot not active"
ok "identity_slots guide+merchant+steward active"

guide_patch="$(curl_json PATCH "$API_BASE/api/v1/me/guide-profile" "{\"bio\":\"L3 smoke guide ${STAMP}\"}" "$TOKEN")"
[[ "${guide_patch%%|*}" == "200" ]] || fail "PATCH guide-profile HTTP ${guide_patch%%|*}"
ok "guide settings write"

merchant_patch="$(curl_json PATCH "$API_BASE/api/v1/me/merchant-profile" "{\"bio\":\"L3 smoke merchant ${STAMP}\"}" "$TOKEN")"
[[ "${merchant_patch%%|*}" == "200" ]] || fail "PATCH merchant-profile HTTP ${merchant_patch%%|*}"
ok "merchant settings write"

steward_patch="$(curl_json PATCH "$API_BASE/api/v1/me/region-steward-profile" "{\"tagline\":\"L3 smoke steward ${STAMP}\"}" "$TOKEN")"
[[ "${steward_patch%%|*}" == "200" ]] || fail "PATCH region-steward-profile HTTP ${steward_patch%%|*}"
ok "steward settings write"

acq_patch="$(curl_json PATCH "$API_BASE/api/v1/me/acquisition-profile" "{\"tagline\":\"L3 smoke acq ${STAMP}\"}" "$TOKEN")"
[[ "${acq_patch%%|*}" == "200" ]] || fail "PATCH acquisition-profile HTTP ${acq_patch%%|*}"
ok "acquisition settings write"

provider_listing="$(curl_json POST "$API_BASE/api/v1/market/provider/listings" "{\"payload\":{\"kind\":\"merchant_showcase_studio_v1\",\"title\":\"Multi-demo shop ${STAMP}\",\"city\":\"Hangzhou\",\"category\":\"travel\",\"description\":\"L3 closure\"}}" "$TOKEN")"
prov_code="${provider_listing%%|*}"
prov_body="${provider_listing#*|}"
[[ "$prov_code" == "200" || "$prov_code" == "201" ]] || fail "POST provider listing HTTP $prov_code body=$prov_body"
ok "merchant listing publish"

assert_acquisition_listing_publish "$TOKEN"

acq_state="$(slot_state "$me_body" acquisition)"
if [[ "$acq_state" == "active" ]]; then
  ok "acquisition slot already active at login"
else
  me2_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$TOKEN")"
  me2_body="${me2_out#*|}"
  acq_state2="$(slot_state "$me2_body" acquisition)"
  [[ "$acq_state2" == "active" || "$acq_state2" == "inactive" ]] || fail "acquisition slot unexpected: $acq_state2"
  ok "acquisition slot post-listing state=$acq_state2"
fi

gov_out="$(curl_json GET "$API_BASE/api/v1/governance/protocol-reference" "" "$TOKEN")"
gov_code="${gov_out%%|*}"
[[ "$gov_code" == "200" ]] || fail "GET governance/protocol-reference HTTP $gov_code"
ok "governance read (steward workspace chain)"

echo "smoke-multi-identity-closure: ALL PASS (① local · multi-demo@test.com)"
