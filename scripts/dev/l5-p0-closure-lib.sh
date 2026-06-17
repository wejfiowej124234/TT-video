#!/usr/bin/env bash
# L5-P0 closure · shared helpers (156 → 157)
set -euo pipefail

l5_p0_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
L5_P0_API="${L5_P0_API:-${API_BASE:-http://127.0.0.1:8080}}"
L5_P0_API="${L5_P0_API%/}"
L5_P0_DB="${L5_P0_DB:-${DATABASE_URL:-postgres://traveltrust:traveltrust@localhost:5432/traveltrust}}"
L5_P0_PG="${L5_P0_PG:-traveltrust-postgres}"

l5_p0_fail() { echo "l5-p0: FAIL $*" >&2; exit 1; }
l5_p0_ok() { echo "l5-p0: OK $*"; }

l5_p0_api_up() {
  [[ "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 "$L5_P0_API/health" 2>/dev/null || echo 000)" == "200" ]]
}

l5_p0_run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$L5_P0_DB" -v ON_ERROR_STOP=1 -q "$@"
  else
    docker exec "$L5_P0_PG" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@" \
      || l5_p0_fail "psql unavailable"
  fi
}

l5_p0_run_psql_t() {
  if command -v psql >/dev/null 2>&1; then
    psql "$L5_P0_DB" -tAc "$1" | tr -d '\r'
  else
    docker exec "$L5_P0_PG" psql -U traveltrust -d traveltrust -tAc "$1" | tr -d '\r'
  fi
}

l5_p0_json_field() {
  node -e "const o=JSON.parse(process.argv[1]); const p=process.argv[2].split('.'); let v=o; for (const k of p) v=v?.[k]; process.stdout.write(String(v??''));" "$1" "$2"
}

l5_p0_curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}" extra="${5:-}"
  local tmp code idem=()
  if [[ "$method" == POST || "$method" == PUT || "$method" == PATCH || "$method" == DELETE ]]; then
    idem=(-H "Idempotency-Key: l5-p0-$(date +%s%N)-$RANDOM")
  fi
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" "${idem[@]}" ${extra:+-H "$extra"} -d "$body" 2>/dev/null || echo 000)"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" "${idem[@]}" ${extra:+-H "$extra"} -d "$body" 2>/dev/null || echo 000)"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth" "${idem[@]}" ${extra:+-H "$extra"} 2>/dev/null || echo 000)"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" "${idem[@]}" ${extra:+-H "$extra"} 2>/dev/null || echo 000)"
    fi
  fi
  L5_P0_RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$L5_P0_RESP"
}

l5_p0_totp_code() {
  python - "$1" <<'PY'
import base64, hmac, hashlib, struct, sys, time
secret = sys.argv[1].strip().upper()
key = base64.b32decode(secret, casefold=True)
counter = int(time.time()) // 30
msg = struct.pack(">Q", counter)
h = hmac.new(key, msg, hashlib.sha1).digest()
o = h[19] & 0x0F
code = struct.unpack(">I", h[o:o+4])[0] & 0x7FFFFFFF
print(f"{code % 1000000:06}")
PY
}

l5_p0_setup_super_tokens() {
  local stamp="$1"
  local req_email="l5p0-req-${stamp}@traveltrust.test"
  local app_email="l5p0-app-${stamp}@traveltrust.test"
  local password="Test123!"
  [[ "${SEED_TEST_ACCOUNTS:-1}" == "1" ]] || l5_p0_fail "SEED_TEST_ACCOUNTS=1 required"

  for spec in "$req_email|super_admin|REQ" "$app_email|super_admin|APP"; do
    IFS='|' read -r em ur var <<<"$spec"
    reg="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"$em\",\"password\":\"$password\"}")"
    code="${reg%%|*}"
    body="${reg#*|}"
    [[ "$code" == "200" || "$code" == "201" ]] || l5_p0_fail "register $em HTTP $code"
    uid="$(l5_p0_json_field "$body" user_id)"
    promote="$(l5_p0_curl_json POST "$L5_P0_API/auth/seed-test-accounts" "{\"promote_admin_email\":\"$em\"}")"
    [[ "${promote%%|*}" == "200" ]] || l5_p0_fail "promote $em"
    l5_p0_run_psql -c "UPDATE users SET role = '$ur' WHERE id = '$uid'::uuid;" >/dev/null
    l5_p0_run_psql -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$uid'::uuid, 'SuperAdmin')
      ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();" >/dev/null
    login="$(l5_p0_curl_json POST "$L5_P0_API/auth/login" "{\"email\":\"$em\",\"password\":\"$password\"}")"
    [[ "${login%%|*}" == "200" ]] || l5_p0_fail "login $em"
    body="${login#*|}"
    tok="$(l5_p0_json_field "$body" token)"
    printf -v "L5_P0_${var}_TOKEN" '%s' "$tok"
    printf -v "L5_P0_${var}_ID" '%s' "$uid"
  done
}

# Returns 2FA session header value for token (enroll+verify with policy relaxed briefly)
l5_p0_2fa_session_for_token() {
  local token="$1"
  l5_p0_run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(
    COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true)
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
  local enroll verify secret code session vcode
  enroll="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/security/totp/enroll" "{}" "$token")"
  [[ "${enroll%%|*}" == "200" ]] || l5_p0_fail "totp enroll ${enroll%%|*}"
  secret="$(l5_p0_json_field "${enroll#*|}" secret_base32)"
  [[ -z "$secret" ]] && secret="$(l5_p0_json_field "${enroll#*|}" secret)"
  code="$(l5_p0_totp_code "$secret")"
  verify="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/security/totp/verify" "{\"code\":\"$code\"}" "$token")"
  vcode="${verify%%|*}"
  if [[ "$vcode" != "200" ]]; then
    l5_p0_run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(
      COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true)
      WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
    verify="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/security/totp/verify" "{\"code\":\"$code\"}" "$token")"
    vcode="${verify%%|*}"
  fi
  [[ "$vcode" == "200" ]] || l5_p0_fail "totp verify $vcode"
  session="$(l5_p0_json_field "${verify#*|}" session_token)"
  [[ -n "$session" ]] || l5_p0_fail "session_token empty"
  l5_p0_run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_build_object(
    'enforced', true, 'required_console_roles', jsonb_build_array('SuperAdmin','Ops'))
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
  echo "x-traveltrust-admin-2fa-session: $session"
}

l5_p0_official_account_id() {
  local existing
  existing="$(l5_p0_run_psql_t "SELECT id::text FROM ops_official_accounts ORDER BY created_at ASC LIMIT 1;" | tr -d ' \n')"
  if [[ -n "$existing" ]]; then
    echo "$existing"
    return
  fi
  local uid="${1:-}"
  [[ -n "$uid" ]] || return 1
  l5_p0_run_psql_t "INSERT INTO ops_official_accounts (user_id, account_kind, display_label, data_origin, created_by)
    VALUES ('$uid'::uuid, 'guide', 'L5 P0 Probe Official', 'test', '$uid'::uuid)
    RETURNING id::text;" | tr -d ' \n'
}

l5_p0_write_probe_result() {
  local partial="$1" probe_id="$2" verdict="$3" mode="$4" log="$5" stamp="$6" gate="$7"
  python - "$partial" "$probe_id" "$verdict" "$mode" "$log" "$stamp" "$gate" <<'PY'
import json, sys
from pathlib import Path
path = Path(sys.argv[1])
data = {"probes": {}}
if path.is_file() and path.read_text(encoding="utf-8").strip():
    data = json.loads(path.read_text(encoding="utf-8"))
data.setdefault("probes", {})[sys.argv[2]] = {
    "verdict": sys.argv[3], "mode": sys.argv[4],
    "recorded_utc": sys.argv[6],
    "log_path": sys.argv[5].replace("\\", "/"),
    "gate_script": sys.argv[7],
}
path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
PY
}
