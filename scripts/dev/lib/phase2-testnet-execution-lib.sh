#!/usr/bin/env bash
# Phase ② · Testnet Execution Sprint — shared HTTP helpers (staging Fly).
set -euo pipefail

p2exec_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

p2exec_api_base() {
  local base="${STAGING_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}"
  echo "${base%/}"
}

p2exec_fail() { echo "p2exec: FAIL $*" >&2; exit 1; }
p2exec_ok() { echo "p2exec: OK $*"; }

p2exec_json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

p2exec_json_nested() {
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$1" "$2"
}

p2exec_curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  local curl_args=(--noproxy "*" -sS -o "$tmp" -w '%{http_code}')
  curl_args+=(-X "$method" "$url" -H "Content-Type: application/json")
  [[ -n "$auth" ]] && curl_args+=(-H "Authorization: Bearer $auth")
  [[ -n "$body" ]] && curl_args+=(-d "$body")
  code="$(curl "${curl_args[@]}" 2>/dev/null || echo "000")"
  P2EXEC_RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$P2EXEC_RESP"
}

p2exec_require_health() {
  local api="$1"
  local code
  code="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' -H "Bypass-Tunnel-Reminder: true" \
    --max-time 20 "${api}/health" 2>/dev/null || echo "000")"
  [[ "$code" == "200" ]] || p2exec_fail "${api}/health not 200 (got ${code})"
  p2exec_ok "health 200 @ ${api}"
}

p2exec_idem_key() {
  echo "p2exec-$(date +%s)-$RANDOM-$1"
}

p2exec_write_step_evidence() {
  local step_dir="$1" step_id="$2" status="$3" note="${4:-}"
  mkdir -p "$step_dir"
  {
    echo "step: ${step_id}"
    echo "status: ${status}"
    echo "api: $(p2exec_api_base)"
    echo "at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "note: ${note}"
  } >"$step_dir/STATUS.txt"
}

p2exec_save_json() {
  local path="$1" json="$2"
  node -e "const fs=require('fs'); fs.writeFileSync(process.argv[1], JSON.stringify(JSON.parse(process.argv[2]), null, 2));" \
    "$path" "$json" 2>/dev/null || echo "$json" >"$path"
}

p2exec_register_with_code() {
  local api="$1" email="$2" password="$3" nickname="$4"
  local send_out code reg_out
  send_out="$(p2exec_curl_json POST "${api}/auth/register/send-verification-code" "{\"email\":\"${email}\"}")"
  [[ "${send_out%%|*}" == "200" ]] || p2exec_fail "send-verification-code ${email} HTTP ${send_out%%|*}"
  code="$(p2exec_json_field "${send_out#*|}" registration_verification_dev_code)"
  [[ -n "$code" ]] || p2exec_fail "missing registration_verification_dev_code on staging"
  reg_out="$(p2exec_curl_json POST "${api}/auth/register" \
    "{\"email\":\"${email}\",\"password\":\"${password}\",\"verification_code\":\"${code}\",\"nickname\":\"${nickname}\"}")"
  [[ "${reg_out%%|*}" == "200" || "${reg_out%%|*}" == "201" ]] || \
    p2exec_fail "register ${email} HTTP ${reg_out%%|*} body=${reg_out#*|}"
  P2EXEC_TOKEN="$(p2exec_json_field "${reg_out#*|}" token)"
  P2EXEC_USER_ID="$(p2exec_json_field "${reg_out#*|}" user_id)"
  [[ -n "$P2EXEC_TOKEN" ]] || p2exec_fail "register ${email} missing token"
}

p2exec_write_rollback_md() {
  local path="$1" title="$2" body="$3"
  cat >"$path" <<EOF
# Rollback verification · ${title}

**Phase:** ② testnet · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

${body}
EOF
}

p2exec_post_json_file() {
  local method="$1" url="$2" file="$3" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  local curl_args=(--noproxy "*" -sS -o "$tmp" -w '%{http_code}')
  curl_args+=(-X "$method" "$url" -H "Content-Type: application/json; charset=utf-8")
  [[ -n "$auth" ]] && curl_args+=(-H "Authorization: Bearer $auth")
  curl_args+=(--data-binary "@${file}")
  code="$(curl "${curl_args[@]}" 2>/dev/null || echo "000")"
  P2EXEC_RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$P2EXEC_RESP"
}
