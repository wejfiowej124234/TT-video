#!/usr/bin/env bash
# Phase 2.5 · CH-H04 · Session / Wallet verify / 2FA permission chain staging smoke
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     bash scripts/dev/smoke-phase25-h4-session-wallet-2fa-staging.sh
#
# Optional (② ADM-U02 slice):
#   STAGING_DATABASE_URL=postgresql://... bash ...  # runs full 2FA policy chain
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase25-staging-http-lib.sh
source "$ROOT/scripts/dev/lib/phase25-staging-http-lib.sh"

API="$(phase25_api_base)"
STAMP="$(date +%s)"
EMAIL="p25-sec-${STAMP}@traveltrust.test"
PASSWORD="Test123!"

echo "== smoke-phase25-h4-session-wallet-2fa-staging API=${API} =="
phase25_require_health "$API"

# Unauthenticated sessions → 401
unauth_out="$(phase25_curl_json GET "${API}/api/v1/me/sessions" "")"
[[ "${unauth_out%%|*}" == "401" ]] || phase25_fail "GET /me/sessions unauth expected 401 got ${unauth_out%%|*}"
phase25_ok "sessions require auth (401)"

phase25_register_user "$API" "$EMAIL" "$PASSWORD" "P25 Security"
TOKEN="$PHASE25_TOKEN"

sess_out="$(phase25_curl_json GET "${API}/api/v1/me/sessions" "" "$TOKEN")"
sess_code="${sess_out%%|*}"
sess_body="${sess_out#*|}"
if [[ "$sess_code" == "503" ]]; then
  phase25_ok "GET /me/sessions 503 (chain_off/db policy) — auth gate verified"
elif [[ "$sess_code" == "200" ]]; then
  echo "$sess_body" | grep -q '"items"' || phase25_fail "sessions body missing items"
  phase25_ok "GET /me/sessions 200"
else
  phase25_fail "GET /me/sessions unexpected HTTP ${sess_code} body=${sess_body}"
fi

notif_out="$(phase25_curl_json GET "${API}/api/v1/me/security-notifications" "" "$TOKEN")"
notif_code="${notif_out%%|*}"
[[ "$notif_code" == "200" || "$notif_code" == "503" ]] || \
  phase25_fail "GET security-notifications HTTP ${notif_code}"
phase25_ok "security-notifications reachable (${notif_code})"

# Wallet verify challenge (write path entry)
wch_out="$(phase25_curl_json POST "${API}/api/v1/me/wallet/verify/challenge" \
  "{\"wallet_address\":\"0x00000000000000000000000000000000000000aa\",\"chain_id\":11155111}" "$TOKEN")"
wch_code="${wch_out%%|*}"
[[ "$wch_code" == "200" || "$wch_code" == "400" || "$wch_code" == "501" || "$wch_code" == "503" ]] || \
  phase25_fail "wallet verify challenge HTTP ${wch_code} body=${wch_out#*|}"
phase25_ok "wallet verify challenge probed (${wch_code})"

# Refresh token path (if login returns refresh_token)
login_out="$(phase25_curl_json POST "${API}/auth/login" "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
login_body="${login_out#*|}"
refresh="$(phase25_json_field "$login_body" refresh_token)"
if [[ -n "$refresh" ]]; then
  ref_out="$(phase25_curl_json POST "${API}/auth/refresh" "{\"refresh_token\":\"${refresh}\"}")"
  [[ "${ref_out%%|*}" == "200" ]] || phase25_fail "auth/refresh HTTP ${ref_out%%|*}"
  phase25_ok "auth/refresh 200"
else
  phase25_ok "auth/refresh N/A (no refresh_token in login response)"
fi

# Admin 2FA read (permission surface)
curl --noproxy "*" -sS -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -d "{\"promote_admin_email\":\"${EMAIL}\"}" >/dev/null 2>&1 || true
admin_login="$(phase25_curl_json POST "${API}/auth/login" "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
ADMIN_TOKEN="$(phase25_json_field "${admin_login#*|}" token)"
totp_out="$(phase25_curl_json GET "${API}/api/v1/admin/security/totp/status" "" "$ADMIN_TOKEN")"
totp_code="${totp_out%%|*}"
[[ "$totp_code" == "200" || "$totp_code" == "403" || "$totp_code" == "404" ]] || \
  phase25_fail "admin totp/status HTTP ${totp_code}"
phase25_ok "admin 2FA status probed (${totp_code})"

if [[ -n "${STAGING_DATABASE_URL:-}" ]]; then
  echo "phase25: running ADM-U02 staging slice (2FA policy write chain) …"
  export STAGING_API_BASE="$API"
  export ADM_U02_STRICT=1
  bash "$ROOT/scripts/dev/smoke-admin-adm-u02-staging.sh"
  phase25_ok "ADM-U02 staging 2FA chain"
else
  echo "phase25: SKIP ADM-U02 full chain (STAGING_DATABASE_URL unset)"
fi

echo "TT_PHASE25_H4_SESSION_WALLET_2FA: OK"
