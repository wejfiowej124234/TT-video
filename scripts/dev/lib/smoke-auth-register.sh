#!/usr/bin/env bash
# ① 本地烟测 · POST /auth/register（含可选邮箱验证码流）
#
# 须在调用方定义后 source：ROOT、API_BASE、PASSWORD、curl_json、json_field、fail
#
# 当 API 要求验证码（默认 release 构建）时：
#   1. POST /auth/register/send-verification-code
#   2. 从 JSON 读取 registration_verification_dev_code（须 TRAVELTRUST_EMAIL_TRANSPORT=log|off|空）
#
# 用法：
#   source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"
#   token="$(register_user "$email" "tourist")"
#   reg_out="$(smoke_auth_register_curl "$email" "tourist" '{"nickname":"Smoke"}')"
set -euo pipefail

smoke_auth_register_verification_required() {
  local v="${TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE:-}"
  v="$(echo "$v" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
  case "$v" in
    0 | false) return 1 ;;
    1 | true) return 0 ;;
    *) return 0 ;;
  esac
}

smoke_auth_register_curl() {
  local email="$1" role="${2:-tourist}"
  local extra_json="${3-}"
  [[ -n "$extra_json" ]] || extra_json="{}"
  local code=""

  if smoke_auth_register_verification_required; then
    local send
    send="$(curl_json POST "$API_BASE/auth/register/send-verification-code" "{\"email\":\"$email\"}")"
    [[ "${send%%|*}" == "200" ]] || {
      echo "send-verification-code $email HTTP ${send%%|*}|${send#*|}" >&2
      printf '%s|%s' "${send%%|*}" "${send#*|}"
      return 0
    }
    code="$(json_field "${send#*|}" registration_verification_dev_code)"
    if [[ -z "$code" ]]; then
      echo "smoke-auth-register: missing registration_verification_dev_code — set TRAVELTRUST_EMAIL_TRANSPORT=log on API (see .env.example)" >&2
      printf '%s|%s' "500" '{"error":"registration_verification_dev_code_missing"}'
      return 0
    fi
  fi

  local body
  body="$(node -e "
    const email = process.argv[1];
    const password = process.argv[2];
    const role = process.argv[3];
    const code = process.argv[4];
    const extra = JSON.parse(process.argv[5] || '{}');
    const o = { email, password, role, ...extra };
    if (code) o.verification_code = code;
    process.stdout.write(JSON.stringify(o));
  " "$email" "$PASSWORD" "$role" "$code" "$extra_json")"

  curl_json POST "$API_BASE/auth/register" "$body"
}

register_user() {
  local email="$1" role="${2:-tourist}"
  local extra_json="${3-}"
  [[ -n "$extra_json" ]] || extra_json="{}"
  local reg
  reg="$(smoke_auth_register_curl "$email" "$role" "$extra_json")"
  [[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || fail "register $email HTTP ${reg%%|*} body=${reg#*|}"
  json_field "${reg#*|}" token
}
