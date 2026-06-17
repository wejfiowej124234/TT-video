#!/usr/bin/env bash
# ① 本地 · 96-18 准入费全链路烟测（无 Stripe / 无链上 PSP）
#
# quote → payment-intent → entitlements → webhook 或 local-dev mark-paid → role-confirm → GET /me
# 含 B 轨 fee_schedule_v1 对拍；Hub 阶段（payment_pending → confirm_pending → active）可机读断言
#
# 用法（仓库根，API + DATABASE_URL + INTERNAL_API_SECRET）：
#   bash scripts/dev/smoke-onboarding-full-chain-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   MARK_PAID_MODE=webhook|local_dev     默认 webhook；local_dev 须 API TRAVELTRUST_ONBOARDING_LOCAL_DEV=1
#   SMOKE_SKIP_STEWARD=1
#   SMOKE_SKIP_PROVIDER=1
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
load_dotenv_var TRAVELTRUST_ONBOARDING_LOCAL_DEV

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
MARK_PAID_MODE="${MARK_PAID_MODE:-webhook}"
STAMP="$(date +%s)"
PASSWORD="Test123!"

fail() { echo "smoke-onboarding-full-chain: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-onboarding-full-chain: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}" idem="${5:-}"
  local args=(-sS -w "|%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$idem" ]] && args+=(-H "Idempotency-Key: $idem")
  [[ -n "$body" ]] && args+=(-d "$body")
  local out
  out="$(curl "${args[@]}")"
  printf '%s|%s' "${out##*|}" "${out%|*}"
}

assert_fee_schedule_triple() {
  node -e "
    const bundle = {
      quote: JSON.parse(process.argv[1]),
      paymentIntent: JSON.parse(process.argv[2]),
      entitlement: JSON.parse(process.argv[3]),
    };
    process.stdout.write(JSON.stringify(bundle));
  " "$1" "$2" "$3" | node "$ROOT/scripts/dev/assert-fee-schedule-v1-alignment.mjs" --stdin
}

mark_entitlement_paid() {
  local token="$1" idem="$2"
  if [[ "$MARK_PAID_MODE" == "local_dev" ]]; then
    [[ "${TRAVELTRUST_ONBOARDING_LOCAL_DEV:-}" == "1" ]] || fail "MARK_PAID_MODE=local_dev requires TRAVELTRUST_ONBOARDING_LOCAL_DEV=1 on API"
    local mp
    mp="$(curl_json POST "$API_BASE/api/v1/onboarding/local-dev/mark-paid" "{\"idempotency_key\":\"$idem\"}" "$token")"
    [[ "${mp%%|*}" == "200" ]] || fail "local-dev mark-paid HTTP ${mp%%|*} body=${mp#*|}"
    ok "local-dev mark-paid idem=$idem"
    return 0
  fi
  [[ -n "${INTERNAL_API_SECRET:-}" ]] || fail "INTERNAL_API_SECRET unset (webhook mark-paid)"
  export API_BASE_URL="$API_BASE"
  local wh
  wh="$(bash "$ROOT/scripts/dev/onboarding-webhook-local.sh" "$idem" "evt_full_chain_${STAMP}")"
  echo "$wh" | grep -qi '"accepted".*true\|"status".*"ok"' || echo "$wh" | grep -qi 'paid' || fail "webhook failed: $wh"
  ok "internal webhook → paid idem=$idem"
}

assert_hub_phase() {
  local surface="$1" me_body="$2" ent_body="$3" expected="$4"
  local me_file ent_file
  me_file="$(mktemp)"
  ent_file="$(mktemp)"
  printf '%s' "$me_body" >"$me_file"
  printf '%s' "$ent_body" >"$ent_file"
  node "$ROOT/scripts/dev/assert-onboarding-hub-phase.mjs" "$surface" "$expected" "@$me_file" "@$ent_file"
  rm -f "$me_file" "$ent_file"
  ok "hub phase $surface=$expected"
}

verify_wallet() {
  local token="$1" wallet="$2"
  local chal sig conf
  chal="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/challenge" "{\"wallet_address\":\"$wallet\"}" "$token")"
  [[ "${chal%%|*}" == "200" ]] || fail "wallet challenge HTTP ${chal%%|*} body=${chal#*|}"
  local challenge_id message
  challenge_id="$(json_field "${chal#*|}" challenge_id)"
  message="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.message||'');" "${chal#*|}")"
  [[ -n "$challenge_id" && -n "$message" ]] || fail "wallet challenge missing fields"
  sig="$(node "$ROOT/scripts/dev/sign-eip191-message.mjs" "$message")"
  conf="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/confirm" "{\"challenge_id\":\"$challenge_id\",\"signature\":\"$sig\"}" "$token")"
  [[ "${conf%%|*}" == "200" ]] || fail "wallet confirm HTTP ${conf%%|*} body=${conf#*|}"
  ok "wallet verify $wallet"
}

load_dotenv_var TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE
load_dotenv_var TRAVELTRUST_EMAIL_TRANSPORT

# shellcheck source=lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

run_provider_full_chain() {
  local email="onb-full-prov-${STAMP}@traveltrust.test"
  local token idem quote pay ent ent_body row me_body rc
  token="$(register_user "$email" "tourist")"
  idem="$(node -e "console.log(crypto.randomUUID())")"

  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=provider&jurisdictions=US" "" "$token")"
  [[ "${quote%%|*}" == "200" ]] || fail "provider quote HTTP ${quote%%|*}"

  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"provider","jurisdictions":"US"}' "$token" "$idem")"
  [[ "${pay%%|*}" == "200" ]] || fail "provider payment-intent HTTP ${pay%%|*}"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"
  assert_fee_schedule_triple "${quote#*|}" "${pay#*|}" "$row"
  echo "$row" | grep -q '"status".*"pending"' || fail "expected pending entitlement before mark-paid"
  ok "provider pending entitlement + fee_schedule_v1 alignment"

  me_body="$(curl_json GET "$API_BASE/api/v1/me" "" "$token")"
  me_body="${me_body#*|}"
  assert_hub_phase "provider" "$me_body" "$ent_body" "payment_pending"

  mark_entitlement_paid "$token" "$idem"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  echo "$ent_body" | grep -q '"status".*"paid"' || fail "provider entitlements not paid"
  me_body="$(curl_json GET "$API_BASE/api/v1/me" "" "$token")"
  me_body="${me_body#*|}"
  assert_hub_phase "provider" "$me_body" "$ent_body" "confirm_pending"

  rc="$(curl_json POST "$API_BASE/api/v1/onboarding/role-confirm" '{"role":"provider"}' "$token" "rc-full-${STAMP}-provider")"
  [[ "${rc%%|*}" == "200" ]] || fail "provider role-confirm HTTP ${rc%%|*} body=${rc#*|}"

  me_body="$(curl_json GET "$API_BASE/api/v1/me" "" "$token")"
  me_body="${me_body#*|}"
  echo "$me_body" | grep -qi '"role".*"provider"' || fail "GET /me expected role=provider"
  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  assert_hub_phase "provider" "$me_body" "$ent_body" "active"
  ok "provider full chain → onboarding done (①)"
}

run_steward_full_chain() {
  local email="onb-full-st-${STAMP}@traveltrust.test"
  local admin_email="onb-full-adm-${STAMP}@traveltrust.test"
  local token admin_token user_id idem quote pay ent ent_body row
  local WALLET="0x4a62316623ad457F02cDC5D997deD67a383EC569"

  token="$(register_user "$email" "tourist")"
  user_id="$(curl_json GET "$API_BASE/api/v1/me" "" "$token")"
  user_id="$(node -e "const m=JSON.parse(process.argv[1]); process.stdout.write(String(m.user?.id??m.id??''));" "${user_id#*|}")"
  [[ -n "$user_id" ]] || fail "steward GET /me missing id"

  verify_wallet "$token" "$WALLET"

  local app_body
  app_body="$(cat <<EOF
{"jurisdictions":["CN"],"legal_name":"Full Chain Steward","contact_email":"$email","wallet_address":"$WALLET","motivation":"full chain smoke"}
EOF
)"
  local app
  app="$(curl_json POST "$API_BASE/api/v1/steward/applications" "$app_body" "$token")"
  [[ "${app%%|*}" == "200" ]] || fail "steward application HTTP ${app%%|*}"

  register_user "$admin_email" "tourist" >/dev/null
  local promote
  promote="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$admin_email\"}")"
  [[ "${promote%%|*}" == "200" ]] || fail "seed admin HTTP ${promote%%|*}"
  admin_token="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$admin_email\",\"password\":\"$PASSWORD\"}")"
  admin_token="$(json_field "${admin_token#*|}" token)"

  local review
  review="$(curl_json PATCH "$API_BASE/api/v1/admin/users/${user_id}/steward-application-review" '{"status":"approved"}' "$admin_token")"
  [[ "${review%%|*}" == "200" ]] || fail "steward admin approve HTTP ${review%%|*}"

  idem="$(node -e "console.log(crypto.randomUUID())")"
  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=region_steward&jurisdictions=CN" "" "$token")"
  [[ "${quote%%|*}" == "200" ]] || fail "steward quote HTTP ${quote%%|*}"

  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"region_steward","jurisdictions":"CN"}' "$token" "$idem")"
  [[ "${pay%%|*}" == "200" ]] || fail "steward payment-intent HTTP ${pay%%|*}"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"
  assert_fee_schedule_triple "${quote#*|}" "${pay#*|}" "$row"

  mark_entitlement_paid "$token" "$idem"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  echo "$ent_body" | grep -q '"status".*"paid"' || fail "steward entitlements not paid"

  rc="$(curl_json POST "$API_BASE/api/v1/onboarding/role-confirm" '{"role":"region_steward"}' "$token" "rc-full-${STAMP}-steward")"
  [[ "${rc%%|*}" == "200" ]] || fail "steward role-confirm HTTP ${rc%%|*}"

  me_body="$(curl_json GET "$API_BASE/api/v1/me" "" "$token")"
  me_body="${me_body#*|}"
  echo "$me_body" | grep -qi '"role".*"region_steward"' || fail "GET /me expected region_steward"
  ok "steward full chain → paid + role-confirm (①; stake 另链)"
}

echo "== smoke-onboarding-full-chain-local (① only; ② Stripe/PSP paused — see onboarding-fee-schedule.v1 §8.2) =="
echo "   MARK_PAID_MODE=$MARK_PAID_MODE API=$API_BASE"

hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || fail "API /health not 200 (got $hc)"

if [[ "${SMOKE_SKIP_PROVIDER:-0}" != "1" ]]; then
  run_provider_full_chain
else
  ok "SMOKE_SKIP_PROVIDER=1"
fi

if [[ "${SMOKE_SKIP_STEWARD:-0}" != "1" ]]; then
  run_steward_full_chain
else
  ok "SMOKE_SKIP_STEWARD=1"
fi

echo ""
echo "TT_SMOKE_ONBOARDING_FULL_CHAIN: OK (① local · no PSP · no on-chain)"
echo "  Phase ② Stripe/testnet PSP: backlog only — onboarding-fee-schedule.v1 §8.2"
