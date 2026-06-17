#!/usr/bin/env bash
# ① 本地 · B 轨 fee_schedule_v1 证据闸烟测（quote ↔ payment-intent ↔ entitlement 对拍）
#
# 覆盖：provider US · region_steward US+FR · 可选 TRAVELTRUST_ONBOARDING_LOCAL_DEV=1 零金额覆盖
# 非 ② Stripe/测试网 PSP · 非 ③ 生产 GO
#
# 用法（API 已起 · DATABASE_URL + chain_off.db_pool）：
#   bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SMOKE_SKIP_STEWARD=1
#   SMOKE_SKIP_LOCAL_DEV=1
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

load_dotenv_var TRAVELTRUST_ONBOARDING_LOCAL_DEV
load_dotenv_var TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE
load_dotenv_var TRAVELTRUST_EMAIL_TRANSPORT

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
PASSWORD="Test123!"

fail() { echo "smoke-onboarding-fee-schedule-v1: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-onboarding-fee-schedule-v1: OK $*"; }

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
  local code="${out##*|}"
  local resp="${out%|*}"
  printf '%s|%s' "$code" "$resp"
}

assert_triple() {
  local label="$1" quote="$2" pay="$3" ent="$4"
  node -e "
    const bundle = {
      quote: JSON.parse(process.argv[1]),
      paymentIntent: JSON.parse(process.argv[2]),
      entitlement: JSON.parse(process.argv[3]),
    };
    process.stdout.write(JSON.stringify(bundle));
  " "$quote" "$pay" "$ent" | node "$ROOT/scripts/dev/assert-fee-schedule-v1-alignment.mjs" --stdin
  ok "alignment $label"
}

# shellcheck source=lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

run_provider_us_alignment() {
  local email="onb-fs1-prov-${STAMP}@traveltrust.test"
  local token idem quote pay ent ent_body row
  token="$(register_user "$email")"
  idem="$(node -e "console.log(crypto.randomUUID())")"

  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=provider&jurisdictions=US" "" "$token")"
  [[ "${quote%%|*}" == "200" ]] || fail "provider quote HTTP ${quote%%|*}"
  echo "${quote#*|}" | grep -q '"fee_schedule_version".*"fee_schedule_v1"' || fail "provider quote not fee_schedule_v1"

  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"provider","jurisdictions":"US"}' "$token" "$idem")"
  [[ "${pay%%|*}" == "200" ]] || fail "provider payment-intent HTTP ${pay%%|*} body=${pay#*|}"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  [[ "${ent%%|*}" == "200" ]] || fail "provider entitlements HTTP ${ent%%|*}"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")" \
    || fail "provider entitlements empty"

  assert_triple "provider/US" "${quote#*|}" "${pay#*|}" "$row"
}

run_steward_us_fr_alignment() {
  local email="onb-fs1-st-${STAMP}@traveltrust.test"
  local token idem quote pay ent ent_body row
  token="$(register_user "$email" "region_steward")"
  idem="$(node -e "console.log(crypto.randomUUID())")"

  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=region_steward&jurisdictions=US,FR" "" "$token")"
  [[ "${quote%%|*}" == "200" ]] || fail "steward quote HTTP ${quote%%|*}"
  echo "${quote#*|}" | grep -q '"computed_amount_minor".*67365' || fail "steward US+FR computed_amount_minor expected 67365"

  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"region_steward","jurisdictions":"US,FR"}' "$token" "$idem")"
  [[ "${pay%%|*}" == "200" ]] || fail "steward payment-intent HTTP ${pay%%|*}"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"

  assert_triple "region_steward/US+FR" "${quote#*|}" "${pay#*|}" "$row"
}

run_local_dev_zero_overlay() {
  [[ "${TRAVELTRUST_ONBOARDING_LOCAL_DEV:-}" == "1" ]] || {
    ok "SKIP local-dev overlay (TRAVELTRUST_ONBOARDING_LOCAL_DEV!=1; restart API with =1 to verify)"
    return 0
  }
  local email="onb-fs1-ld-${STAMP}@traveltrust.test"
  local token idem quote pay ent ent_body row
  token="$(register_user "$email")"
  idem="$(node -e "console.log(crypto.randomUUID())")"

  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=provider&jurisdictions=US" "" "$token")"
  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"provider","jurisdictions":"US"}' "$token" "$idem")"
  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"

  echo "${quote#*|}" | grep -q '"amount_minor".*0' || fail "local-dev quote amount_minor not 0"
  echo "${quote#*|}" | grep -q '"computed_amount_minor".*29900' || fail "local-dev quote computed_amount_minor not 29900"
  assert_triple "local-dev/provider/US" "${quote#*|}" "${pay#*|}" "$row"
}

echo "== smoke-onboarding-fee-schedule-v1-local (① B轨对拍; ②③ out of scope) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || fail "API /health not 200 (got $hc)"

run_provider_us_alignment

if [[ "${SMOKE_SKIP_STEWARD:-0}" != "1" ]]; then
  run_steward_us_fr_alignment
else
  ok "SMOKE_SKIP_STEWARD=1"
fi

if [[ "${SMOKE_SKIP_LOCAL_DEV:-0}" != "1" ]]; then
  run_local_dev_zero_overlay
else
  ok "SMOKE_SKIP_LOCAL_DEV=1"
fi

echo ""
echo "TT_SMOKE_ONBOARDING_FEE_SCHEDULE_V1: OK alignment (① only)"
echo "  next gate: ② Stripe / testnet PSP (out of scope for this script)"
