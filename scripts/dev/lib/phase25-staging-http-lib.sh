#!/usr/bin/env bash
# Phase 2.5 · Coverage Hardening — shared HTTP helpers (staging Fly).
# Source from smoke-phase25-*-staging.sh — do not execute directly.
set -euo pipefail

phase25_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

phase25_api_base() {
  local base="${STAGING_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}"
  echo "${base%/}"
}

phase25_fail() { echo "phase25: FAIL $*" >&2; exit 1; }
phase25_ok() { echo "phase25: OK $*"; }

phase25_json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

phase25_json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

phase25_curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  local curl_args=(--noproxy "*" -sS -o "$tmp" -w '%{http_code}')
  if [[ -n "$body" ]]; then
    curl_args+=(-X "$method" "$url" -H "Content-Type: application/json")
    [[ -n "$auth" ]] && curl_args+=(-H "Authorization: Bearer $auth")
    curl_args+=(-d "$body")
  else
    curl_args+=(-X "$method" "$url")
    [[ -n "$auth" ]] && curl_args+=(-H "Authorization: Bearer $auth")
  fi
  code="$(curl "${curl_args[@]}" 2>/dev/null || echo "000")"
  PHASE25_RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$PHASE25_RESP"
}

phase25_require_health() {
  local api="$1"
  local code
  code="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${api}/health" 2>/dev/null || echo "000")"
  [[ "$code" == "200" ]] || phase25_fail "${api}/health not 200 (got ${code})"
  phase25_ok "health 200 @ ${api}"
}

phase25_seed_and_login() {
  local api="$1" email="$2" password="${3:-Test123!}"
  curl --noproxy "*" -sS -X POST "${api}/auth/seed-test-accounts" \
    -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
  local login_out code body
  login_out="$(phase25_curl_json POST "${api}/auth/login" "{\"email\":\"${email}\",\"password\":\"${password}\"}")"
  code="${login_out%%|*}"
  body="${login_out#*|}"
  [[ "$code" == "200" ]] || phase25_fail "login ${email} HTTP ${code}"
  PHASE25_TOKEN="$(phase25_json_field "$body" token)"
  PHASE25_USER_ID="$(phase25_json_field "$body" user_id)"
  [[ -n "$PHASE25_TOKEN" ]] || phase25_fail "login ${email} missing token"
}

phase25_register_user() {
  local api="$1" email="$2" password="${3:-Test123!}" nickname="${4:-Phase25 User}"
  local reg_out code body
  reg_out="$(phase25_curl_json POST "${api}/auth/register" \
    "{\"email\":\"${email}\",\"password\":\"${password}\",\"nickname\":\"${nickname}\"}")"
  code="${reg_out%%|*}"
  body="${reg_out#*|}"
  [[ "$code" == "200" || "$code" == "201" ]] || phase25_fail "register ${email} HTTP ${code} body=${body}"
  PHASE25_TOKEN="$(phase25_json_field "$body" token)"
  PHASE25_USER_ID="$(phase25_json_field "$body" user_id)"
  [[ -n "$PHASE25_TOKEN" ]] || phase25_fail "register ${email} missing token"
}
