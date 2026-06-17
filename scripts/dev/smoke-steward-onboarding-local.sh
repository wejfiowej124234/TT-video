#!/usr/bin/env bash
# ① 本地 · 区域主理人 Protocol Convergence 全链路 API 烟测（非 ②③ GO）
#
# 覆盖：state-machines · stake-quote · redemption/quote · register → application
#       → me/steward-application → admin approve → /me role → onboarding quote
#
# 用法：bash scripts/dev/smoke-steward-onboarding-local.sh
# 可选：SMOKE_SKIP_ONBOARDING=1 · SMOKE_SKIP_DOCKER_ADMIN=1
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
load_dotenv_var TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE
load_dotenv_var TRAVELTRUST_EMAIL_TRANSPORT

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
STEWARD_EMAIL="steward-smoke-${STAMP}@traveltrust.test"
ADMIN_EMAIL="admin-steward-smoke-${STAMP}@traveltrust.test"
PASSWORD="Test123!"
WALLET="0x4a62316623ad457F02cDC5D997deD67a383EC569"
ONBOARDING_IDEM="$(node -e "console.log(crypto.randomUUID())")"

fail() { echo "smoke-steward-onboarding: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-steward-onboarding: OK $*"; }

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

# shellcheck source=lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

# Health
hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || fail "API not reachable at $API_BASE/health (got $hc)"

# Public reads
SM="$(curl_json GET "$API_BASE/api/v1/governance/state-machines")"
[[ "${SM%%|*}" == "200" ]] || fail "state-machines HTTP ${SM%%|*}"
echo "${SM#*|}" | grep -q 'steward_application' || fail "state-machines missing steward_application"
ok "GET /governance/state-machines"

QUOTE="$(curl_json GET "$API_BASE/api/v1/steward/stake-quote?jurisdictions=CN,FR")"
[[ "${QUOTE%%|*}" == "200" ]] || fail "stake-quote HTTP ${QUOTE%%|*}"
echo "${QUOTE#*|}" | grep -q '850' || fail "CN+FR cumulative bps"
ok "GET /steward/stake-quote"

RED="$(curl_json GET "$API_BASE/api/v1/redemption/quote?jurisdiction=CN")"
[[ "${RED%%|*}" == "200" ]] || fail "redemption quote HTTP ${RED%%|*}"
echo "${RED#*|}" | grep -q 'redemption_max_nav_pct_bps' || fail "redemption quote missing lock tiers"
ok "GET /redemption/quote"

# Register steward candidate（须 tourist/traveler；直接 region_steward 会令 POST /steward/applications → 409 steward_role_already_active）
REG="$(smoke_auth_register_curl "$STEWARD_EMAIL" "tourist")"
[[ "${REG%%|*}" == "200" || "${REG%%|*}" == "201" ]] || fail "register HTTP ${REG%%|*}"
STEWARD_TOKEN="$(json_field "${REG#*|}" token)"
[[ -n "$STEWARD_TOKEN" ]] || fail "register missing token"
STEWARD_USER_ID="$(json_field "${REG#*|}" user_id)"
ok "POST /auth/register tourist (steward candidate)"

verify_wallet() {
  local token="$1" wallet="$2"
  local chal sig conf challenge_id message
  chal="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/challenge" "{\"wallet_address\":\"$wallet\"}" "$token")"
  [[ "${chal%%|*}" == "200" ]] || fail "wallet challenge HTTP ${chal%%|*}"
  challenge_id="$(json_field "${chal#*|}" challenge_id)"
  message="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.message||'');" "${chal#*|}")"
  [[ -n "$challenge_id" && -n "$message" ]] || fail "wallet challenge missing fields"
  sig="$(node "$ROOT/scripts/dev/sign-eip191-message.mjs" "$message")"
  conf="$(curl_json POST "$API_BASE/api/v1/me/wallet/verify/confirm" "{\"challenge_id\":\"$challenge_id\",\"signature\":\"$sig\"}" "$token")"
  [[ "${conf%%|*}" == "200" ]] || fail "wallet confirm HTTP ${conf%%|*}"
  ok "wallet verify $wallet"
}
verify_wallet "$STEWARD_TOKEN" "$WALLET"

APP_BODY="$(cat <<EOF
{"jurisdictions":["CN"],"legal_name":"Smoke Steward Co","contact_email":"$STEWARD_EMAIL","wallet_address":"$WALLET","motivation":"local smoke P2"}
EOF
)"
APP="$(curl_json POST "$API_BASE/api/v1/steward/applications" "$APP_BODY" "$STEWARD_TOKEN")"
[[ "${APP%%|*}" == "200" ]] || fail "steward application HTTP ${APP%%|*}"
echo "${APP#*|}" | grep -q 'stake_pending' || fail "application not stake_pending"
ok "POST /steward/applications"

ME_APP="$(curl_json GET "$API_BASE/api/v1/me/steward-application" "" "$STEWARD_TOKEN")"
[[ "${ME_APP%%|*}" == "200" ]] || fail "GET me/steward-application HTTP ${ME_APP%%|*}"
echo "${ME_APP#*|}" | grep -q 'stake_pending' || fail "me/steward-application not stake_pending"
ok "GET /me/steward-application"

if [[ "${SMOKE_SKIP_DOCKER_ADMIN:-0}" == "1" ]]; then
  ok "SMOKE_SKIP_DOCKER_ADMIN=1 — partial (no admin)"
  echo "TT_SMOKE_STEWARD_ONBOARDING: OK partial (①)"
  exit 0
fi

# Admin promote
reg_admin="$(smoke_auth_register_curl "$ADMIN_EMAIL" "tourist")"
[[ "${reg_admin%%|*}" == "200" || "${reg_admin%%|*}" == "201" ]] || fail "admin register HTTP ${reg_admin%%|*}"

promote="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$ADMIN_EMAIL\"}")"
[[ "${promote%%|*}" == "200" ]] || fail "seed promote admin (need SEED_TEST_ACCOUNTS=1) HTTP ${promote%%|*}"

admin_login="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")"
[[ "${admin_login%%|*}" == "200" ]] || fail "admin login HTTP ${admin_login%%|*}"
ADMIN_TOKEN="$(json_field "${admin_login#*|}" token)"
[[ -n "$ADMIN_TOKEN" ]] || fail "admin login missing token"
ok "admin login"

list="$(curl_json GET "$API_BASE/api/v1/admin/steward-applications?status=stake_pending" "" "$ADMIN_TOKEN")"
[[ "${list%%|*}" == "200" ]] || fail "admin list HTTP ${list%%|*}"
echo "${list#*|}" | grep -q "$STEWARD_EMAIL\|$STEWARD_USER_ID" || fail "admin list missing application"
ok "GET /admin/steward-applications"

review="$(curl_json PATCH "$API_BASE/api/v1/admin/users/${STEWARD_USER_ID}/steward-application-review" '{"status":"approved"}' "$ADMIN_TOKEN")"
[[ "${review%%|*}" == "200" ]] || fail "admin approve HTTP ${review%%|*}"
ok "PATCH steward-application-review approved"

me="$(curl_json GET "$API_BASE/api/v1/me" "" "$STEWARD_TOKEN")"
[[ "${me%%|*}" == "200" ]] || fail "GET /me HTTP ${me%%|*}"
echo "${me#*|}" | grep -qi '"role".*"region_steward"' || fail "expected region_steward role after approve"
ok "GET /me role=region_steward"

if [[ "${SMOKE_SKIP_ONBOARDING:-0}" != "1" ]]; then
  oq="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=region_steward&jurisdictions=CN" "" "$STEWARD_TOKEN")"
  [[ "${oq%%|*}" == "200" ]] || fail "onboarding quote HTTP ${oq%%|*}"
  ok "GET /onboarding/quote region_steward"
else
  ok "SMOKE_SKIP_ONBOARDING=1"
fi

echo ""
echo "TT_SMOKE_STEWARD_ONBOARDING: OK full local chain (① only)"
echo "  steward: $STEWARD_EMAIL"
echo "  admin:   $ADMIN_EMAIL"
