#!/usr/bin/env bash
# ① 本地 · 商家入驻全链路 API 烟测（不含 ② 测试网 / ③ 公网生产）
#
# 覆盖：register → wallet verify → 资质提交 → 96-18 准入费（intent + 内网 webhook paid）
#       → Admin 审核 → role=provider → POST /market/provider/listings → GET 回读
#
# 用法（仓库根，API 已起且 DATABASE_URL + INTERNAL_API_SECRET 可用）：
#   bash scripts/dev/smoke-provider-onboarding-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SMOKE_SKIP_ONBOARDING=1        跳过准入费（仅测资质+审核）
#   SMOKE_SKIP_MARKET=1            跳过市场发布
#   SMOKE_SKIP_DOCKER_ADMIN=1      跳过 Admin 审核（仅测提交前 + 可选 onboarding）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

load_dotenv_var() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    return 0
  fi
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

load_dotenv_var INTERNAL_API_SECRET
load_dotenv_var ONBOARDING_WEBHOOK_HMAC_SECRET
load_dotenv_var ONBOARDING_WEBHOOK_X_FORWARDED_FOR
load_dotenv_var ONBOARDING_WEBHOOK_X_FORWARDED_PROTO
load_dotenv_var TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE
load_dotenv_var TRAVELTRUST_EMAIL_TRANSPORT
load_dotenv_var TRAVELTRUST_ONBOARDING_LOCAL_DEV

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
MERCHANT_EMAIL="${SMOKE_MERCHANT_EMAIL:-provider-smoke-${STAMP}@traveltrust.test}"
ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-admin-smoke-${STAMP}@traveltrust.test}"
PASSWORD="Test123!"
WALLET="0x4a62316623ad457F02cDC5D997deD67a383EC569"
DOC_URL="https://example.com/local-smoke-license.pdf"
PERMIT_URL="https://example.com/local-smoke-permit.pdf"
ID_URL="https://example.com/local-smoke-id.pdf"
ONBOARDING_IDEM="$(node -e "console.log(crypto.randomUUID())")"
LISTING_TITLE="Smoke Shop Listing ${STAMP}"

fail() { echo "smoke-provider-onboarding: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-provider-onboarding: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}"
  local auth="${4:-}"
  local idem="${5:-}"
  local tmp
  tmp="$(mktemp)"
  local code
  local idem_hdr=()
  if [[ -n "$idem" ]]; then
    idem_hdr=( -H "Idempotency-Key: $idem" )
  fi
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" \
        "${idem_hdr[@]}" \
        -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" \
        "${idem_hdr[@]}" \
        -d "$body")"
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

curl_internal_get() {
  local url="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(curl -sS -o "$tmp" -w '%{http_code}' -X GET "$url" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}")"
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

echo "== smoke-provider-onboarding-local (① only; ②③ out of scope) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health). Start start-api-with-seed first."

# shellcheck source=lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

# 1) Register merchant account (self-serve provider role → stored as traveler until审核/role-confirm)
reg_out="$(smoke_auth_register_curl "$MERCHANT_EMAIL" "tourist" '{"nickname":"Smoke Merchant"}')"
reg_code="${reg_out%%|*}"
reg_body="${reg_out#*|}"
if [[ "$reg_code" == "200" || "$reg_code" == "201" ]]; then
  MERCHANT_TOKEN="$(json_field "$reg_body" token)"
  MERCHANT_USER_ID="$(json_field "$reg_body" user_id)"
  ok "register merchant $MERCHANT_EMAIL"
elif [[ "$reg_code" == "409" ]]; then
  login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"$PASSWORD\"}")"
  [[ "${login_out%%|*}" == "200" ]] || fail "login existing merchant HTTP ${login_out%%|*}"
  MERCHANT_TOKEN="$(json_field "${login_out#*|}" token)"
  MERCHANT_USER_ID="$(json_field "${login_out#*|}" user_id)"
  ok "login existing merchant $MERCHANT_EMAIL"
else
  fail "register merchant HTTP $reg_code body=$reg_body"
fi
[[ -n "$MERCHANT_TOKEN" ]] || fail "merchant missing token"

# 2) Wallet verify (challenge → sign → confirm)
chal_out="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/challenge" "{\"wallet_address\":\"$WALLET\"}" "$MERCHANT_TOKEN")"
chal_code="${chal_out%%|*}"
chal_body="${chal_out#*|}"
[[ "$chal_code" == "200" ]] || fail "wallet challenge HTTP $chal_code body=$chal_body"
CHALLENGE_ID="$(json_field "$chal_body" challenge_id)"
MESSAGE="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.message||'');" "$chal_body")"
[[ -n "$CHALLENGE_ID" && -n "$MESSAGE" ]] || fail "wallet challenge missing fields"
SIG="$(node "$ROOT/scripts/dev/sign-eip191-message.mjs" "$MESSAGE")"
conf_out="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/confirm" "{\"challenge_id\":\"$CHALLENGE_ID\",\"signature\":\"$SIG\"}" "$MERCHANT_TOKEN")"
conf_code="${conf_out%%|*}"
conf_body="${conf_out#*|}"
[[ "$conf_code" == "200" ]] || fail "wallet confirm HTTP $conf_code body=$conf_body"
ok "wallet verify $WALLET"

# 3) Submit provider application (CN company + UBO + travel permit)
APP_BODY="$(cat <<EOF
{
  "legal_name": "Smoke Travel Co Ltd",
  "entity_type": "company",
  "registration_number": "91110000SMOKE${STAMP}",
  "tax_id": "91310000SMOKE",
  "country_code": "CN",
  "city": "Shanghai",
  "registered_address": {
    "line1": "88 Nanjing Road",
    "line2": "",
    "city": "Shanghai",
    "postal_code": "200000",
    "country_code": "CN"
  },
  "operating_same_as_registered": true,
  "beneficial_owners": [
    {
      "full_name": "Zhang San",
      "id_type": "passport",
      "id_number": "E12345678",
      "id_doc_url": "$ID_URL"
    }
  ],
  "travel_agency_permit_url": "$PERMIT_URL",
  "contact_name": "Li Si",
  "contact_phone": "+8613800138000",
  "contact_email": "contact-${STAMP}@traveltrust.test",
  "shop_name": "Smoke Shop ${STAMP}",
  "categories": "travel,local",
  "bio": "Local smoke test provider",
  "wallet_address": "$WALLET",
  "business_license_url": "$DOC_URL"
}
EOF
)"
sub_out="$(curl_json POST "$API_BASE/api/v1/provider-applications" "$APP_BODY" "$MERCHANT_TOKEN" "smoke-${STAMP}-provider-app")"
sub_code="${sub_out%%|*}"
sub_body="${sub_out#*|}"
if [[ "$sub_code" == "200" ]]; then
  ok "submit provider application"
elif [[ "$sub_code" == "409" ]] && echo "$sub_body" | grep -q 'provider_application_pending'; then
  ok "provider application already pending — reuse"
elif [[ "$sub_code" == "409" ]] && echo "$sub_body" | grep -q 'provider_application_already_provider'; then
  ok "merchant already provider — skip application submit"
  PROVIDER_ALREADY=1
else
  fail "submit application HTTP $sub_code body=$sub_body"
fi

me_app_out="$(curl_json GET "$API_BASE/api/v1/me/provider-application" "" "$MERCHANT_TOKEN")"
me_app_code="${me_app_out%%|*}"
me_app_body="${me_app_out#*|}"
[[ "$me_app_code" == "200" ]] || fail "GET me/provider-application HTTP $me_app_code"
echo "$me_app_body" | grep -q '"status"' || fail "me provider-application missing status"
ok "GET me/provider-application"

# 4) 96-18 准入费（① 内网 webhook · 无 Stripe 公网）
if [[ "${PROVIDER_ALREADY:-0}" == "1" ]]; then
  ok "already provider — skip onboarding block"
elif [[ "${SMOKE_SKIP_ONBOARDING:-0}" != "1" ]]; then
  [[ -n "${INTERNAL_API_SECRET:-}" ]] || fail "INTERNAL_API_SECRET unset (need .env or export for onboarding webhook)"

  quote_out="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=provider&jurisdictions=US" "" "$MERCHANT_TOKEN")"
  quote_code="${quote_out%%|*}"
  quote_body="${quote_out#*|}"
  [[ "$quote_code" == "200" ]] || fail "onboarding quote HTTP $quote_code body=$quote_body"

  pi_out="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"provider","jurisdictions":"US"}' "$MERCHANT_TOKEN" "$ONBOARDING_IDEM")"
  pi_code="${pi_out%%|*}"
  pi_body="${pi_out#*|}"
  if [[ "$pi_code" == "503" ]]; then
    fail "payment-intents HTTP 503 (need DATABASE_URL + chain_off db_pool; not ② Stripe testnet)"
  fi
  [[ "$pi_code" == "200" ]] || fail "payment-intents HTTP $pi_code body=$pi_body"

  ent_out="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$MERCHANT_TOKEN")"
  ent_code="${ent_out%%|*}"
  ent_body="${ent_out#*|}"
  [[ "$ent_code" == "200" ]] || fail "GET entitlements/me HTTP $ent_code body=$ent_body"
  ent_row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")" \
    || fail "entitlements/me empty before webhook"
  node -e "
    const bundle = {
      quote: JSON.parse(process.argv[1]),
      paymentIntent: JSON.parse(process.argv[2]),
      entitlement: JSON.parse(process.argv[3]),
    };
    process.stdout.write(JSON.stringify(bundle));
  " "$quote_body" "$pi_body" "$ent_row" | node "$ROOT/scripts/dev/assert-fee-schedule-v1-alignment.mjs" --stdin
  ok "fee_schedule_v1 alignment quote/payment-intent/entitlement (pending)"

  export API_BASE_URL="$API_BASE"
  wh_resp="$(bash "$ROOT/scripts/dev/onboarding-webhook-local.sh" "$ONBOARDING_IDEM" "evt_smoke_${STAMP}")"
  echo "$wh_resp" | grep -qi '"status".*"ok"' || echo "$wh_resp" | grep -qi 'paid' || fail "onboarding webhook failed: $wh_resp"
  ok "internal onboarding webhook → paid"

  ent_out="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$MERCHANT_TOKEN")"
  ent_code="${ent_out%%|*}"
  ent_body="${ent_out#*|}"
  [[ "$ent_code" == "200" ]] || fail "GET entitlements/me HTTP $ent_code body=$ent_body"
  echo "$ent_body" | grep -q '"status".*"paid"' || fail "entitlements/me missing paid: $ent_body"
  ok "GET entitlements/me status=paid"

  rc_out="$(curl_json POST "$API_BASE/api/v1/onboarding/role-confirm" '{"role":"provider"}' "$MERCHANT_TOKEN" "smoke-${STAMP}-role-confirm")"
  rc_code="${rc_out%%|*}"
  rc_body="${rc_out#*|}"
  [[ "$rc_code" == "200" ]] || fail "role-confirm HTTP $rc_code body=$rc_body"
  ok "POST onboarding/role-confirm role=provider"

  me_rc_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$MERCHANT_TOKEN")"
  me_rc_code="${me_rc_out%%|*}"
  me_rc_body="${me_rc_out#*|}"
  [[ "$me_rc_code" == "200" ]] || fail "GET /me after role-confirm HTTP $me_rc_code"
  echo "$me_rc_body" | grep -qi '"role".*"provider"' || fail "GET /me after role-confirm expected role=provider (memory/PG sync): $me_rc_body"
  ok "GET /me role=provider after role-confirm (memory synced)"
else
  ok "SMOKE_SKIP_ONBOARDING=1 — skipped 96-18 onboarding"
fi

if [[ "${SMOKE_SKIP_DOCKER_ADMIN:-0}" == "1" ]]; then
  echo ""
  echo "TT_SMOKE_PROVIDER_ONBOARDING: OK partial (no admin; ②③ not run)"
  exit 0
fi

# 5) Register admin tourist + seed promote (memory + PG; requires SEED_TEST_ACCOUNTS=1)
reg_admin_out="$(smoke_auth_register_curl "$ADMIN_EMAIL" "tourist" '{"nickname":"Smoke Admin"}')"
reg_admin_code="${reg_admin_out%%|*}"
reg_admin_body="${reg_admin_out#*|}"
if [[ "$reg_admin_code" != "200" && "$reg_admin_code" != "201" ]]; then
  [[ "$reg_admin_code" == "409" ]] || fail "register admin HTTP $reg_admin_code body=$reg_admin_body"
  ok "admin account exists $ADMIN_EMAIL"
fi

curl --noproxy "*" -sS -X POST "${API_BASE}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" -d "{\"promote_admin_email\":\"${ADMIN_EMAIL}\"}" >/dev/null 2>&1 || true
promote_out="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$ADMIN_EMAIL\"}")"
promote_code="${promote_out%%|*}"
promote_body="${promote_out#*|}"
[[ "$promote_code" == "200" ]] || fail "seed promote admin HTTP $promote_code body=$promote_body (need SEED_TEST_ACCOUNTS=1 and rebuilt API)"
ok "seed promote admin $ADMIN_EMAIL"

admin_login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")"
admin_login_code="${admin_login_out%%|*}"
admin_login_body="${admin_login_out#*|}"
[[ "$admin_login_code" == "200" ]] || fail "admin login HTTP $admin_login_code body=$admin_login_body"
ADMIN_TOKEN="$(json_field "$admin_login_body" token)"
[[ -n "$ADMIN_TOKEN" ]] || fail "admin login missing token"
ok "admin login $ADMIN_EMAIL"

# 6) Admin list + approve (skip when merchant already provider on staging reuse)
if [[ "${PROVIDER_ALREADY:-0}" == "1" ]]; then
  me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$MERCHANT_TOKEN")"
  [[ "${me_out%%|*}" == "200" ]] || fail "GET /me HTTP ${me_out%%|*}"
  echo "${me_out#*|}" | grep -qi '"role".*"provider"' || fail "expected role=provider for reuse path"
  ok "staging reuse — merchant already provider (skip admin approve)"
else
list_out="$(curl_json GET "$API_BASE/api/v1/admin/provider-applications?status=submitted" "" "$ADMIN_TOKEN")"
list_code="${list_out%%|*}"
list_body="${list_out#*|}"
[[ "$list_code" == "200" ]] || fail "admin list HTTP $list_code body=$list_body"
echo "$list_body" | grep -q "$MERCHANT_USER_ID" || echo "$list_body" | grep -q "Smoke Shop" || fail "admin list missing new application"
ok "admin list provider-applications"

review_out="$(curl_json PATCH "$API_BASE/api/v1/admin/users/${MERCHANT_USER_ID}/provider-application-review" '{"status":"approved"}' "$ADMIN_TOKEN")"
review_code="${review_out%%|*}"
review_body="${review_out#*|}"
[[ "$review_code" == "200" ]] || fail "admin approve HTTP $review_code body=$review_body"
ok "admin approve application"

# 7) Merchant role=provider
me_out="$(curl_json GET "$API_BASE/api/v1/me" "" "$MERCHANT_TOKEN")"
me_code="${me_out%%|*}"
me_body="${me_out#*|}"
[[ "$me_code" == "200" ]] || fail "GET /me HTTP $me_code"
echo "$me_body" | grep -qi '"role".*"provider"' || fail "expected role=provider after approve got: $me_body"
ok "merchant role=provider"
fi

# 8) 市场发布（F-021 写路径门闸：role + paid entitlement + approved application）
if [[ "${SMOKE_SKIP_MARKET:-0}" != "1" ]]; then
  pub_out="$(curl_json POST "$API_BASE/api/v1/market/provider/listings" "{\"payload\":{\"kind\":\"merchant_showcase_studio_v1\",\"title\":\"${LISTING_TITLE}\"}}" "$MERCHANT_TOKEN" "smoke-${STAMP}-market-listing")"
  pub_code="${pub_out%%|*}"
  pub_body="${pub_out#*|}"
  [[ "$pub_code" == "200" ]] || fail "POST market/provider/listings HTTP $pub_code body=$pub_body"
  LISTING_ID="$(json_field "$pub_body" listing_id)"
  [[ -n "$LISTING_ID" ]] || fail "listing publish missing listing_id body=$pub_body"
  ok "POST market/provider/listings listing_id=$LISTING_ID"

  [[ -n "${INTERNAL_API_SECRET:-}" ]] || fail "INTERNAL_API_SECRET unset (public-catalog-surface stats)"
  stats_out="$(curl_internal_get "$API_BASE/api/v1/internal/public-catalog-surface/stats")"
  stats_code="${stats_out%%|*}"
  stats_body="${stats_out#*|}"
  [[ "$stats_code" == "200" ]] || fail "GET internal/public-catalog-surface/stats HTTP $stats_code body=$stats_body"
  FILTER_ON="$(node -e "
    const o = JSON.parse(process.argv[1]);
    process.stdout.write(o.filter_enabled === true ? '1' : '0');
  " "$stats_body")"

  cat_out="$(curl_json GET "$API_BASE/api/v1/market/provider/listings" "" "$MERCHANT_TOKEN")"
  cat_code="${cat_out%%|*}"
  cat_body="${cat_out#*|}"
  [[ "$cat_code" == "200" ]] || fail "GET market/provider/listings HTTP $cat_code"

  detail_out="$(curl_json GET "$API_BASE/api/v1/market/provider/listings/${LISTING_ID}" "" "$MERCHANT_TOKEN")"
  detail_code="${detail_out%%|*}"
  detail_body="${detail_out#*|}"

  if [[ "$FILTER_ON" == "1" ]]; then
    node -e "
      const o = JSON.parse(process.argv[1]);
      const id = process.argv[2];
      const items = Array.isArray(o.items) ? o.items : [];
      if (items.some((row) => String(row.id) === id)) process.exit(1);
    " "$cat_body" "$LISTING_ID" || fail "public catalog must hide @traveltrust.test listing when filter_enabled"
    [[ "$detail_code" == "404" ]] || fail "GET listing detail expected 404 when filter_enabled, got HTTP $detail_code body=$detail_body"
    ok "public catalog filter hides smoke listing (POST publish OK; enterprise data separation)"
  else
    node -e "
      const o = JSON.parse(process.argv[1]);
      const id = process.argv[2];
      const items = Array.isArray(o.items) ? o.items : [];
      if (!items.some((row) => String(row.id) === id)) process.exit(1);
    " "$cat_body" "$LISTING_ID" || fail "catalog missing listing_id $LISTING_ID"
    ok "GET market/provider/listings contains new listing"
    [[ "$detail_code" == "200" ]] || fail "GET listing detail HTTP $detail_code body=$detail_body"
    echo "$detail_body" | grep -q "$LISTING_TITLE" || fail "listing detail missing title"
    ok "GET market/provider/listings/:id detail"
  fi
else
  ok "SMOKE_SKIP_MARKET=1 — skipped market publish"
fi

echo ""
echo "TT_SMOKE_PROVIDER_ONBOARDING: OK full local chain (① only)"
echo "  merchant:  $MERCHANT_EMAIL"
echo "  admin:     $ADMIN_EMAIL"
echo "  wallet:    $WALLET"
echo "  onboarding idem: $ONBOARDING_IDEM"
if [[ "${SMOKE_SKIP_MARKET:-0}" != "1" ]]; then
  echo "  listing:   $LISTING_TITLE"
fi
echo "  (② testnet / ③ production — not in this script)"
