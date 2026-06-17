#!/usr/bin/env bash
# ?? ???? ?? Admin 70 RBAC??????? DB ??? + ???? deny ????? ?? staging GO??
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@localhost:5432/traveltrust}"
PG_CONTAINER="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"
STAMP="$(date +%s)"
SUPER_EMAIL="adm-rbac-super-${STAMP}@traveltrust.test"
CS_EMAIL="adm-rbac-cs-${STAMP}@traveltrust.test"
PASSWORD="Test123!"
SUPER_2FA=""

fail() { echo "smoke-admin-rbac-matrix-local: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-admin-rbac-matrix-local: OK $*"; }

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"
  else
    docker exec "$PG_CONTAINER" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@" \
      || fail "psql unavailable (install psql or start $PG_CONTAINER)"
  fi
}

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}" idem="${5:-}" extra="${6:-}"
  local tmp code hdr=(-H "Content-Type: application/json")
  local idem_args=()
  [[ -n "$idem" ]] && idem_args=(-H "Idempotency-Key: $idem")
  [[ -n "$extra" ]] && hdr+=(-H "$extra")
  [[ -n "$auth" ]] && hdr+=(-H "Authorization: Bearer $auth")
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" "${hdr[@]}" "${idem_args[@]}" -d "$body")"
  else
    code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" "${hdr[@]}" "${idem_args[@]}")"
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

curl_json_super() {
  curl_json "$1" "$2" "${3:-}" "${4:-}" "${5:-}" "$SUPER_2FA"
}

admin_2fa_header() {
  local token="$1"
  run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(
    COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true)
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
  local enroll verify secret code session
  enroll="$(curl_json POST "$API_BASE/api/v1/admin/security/totp/enroll" "{}" "$token")"
  [[ "${enroll%%|*}" == "200" ]] || return 1
  secret="$(json_field "${enroll#*|}" secret_base32)"
  [[ -z "$secret" ]] && secret="$(json_field "${enroll#*|}" secret)"
  code="$(python - "$secret" <<'PY'
import base64, hmac, hashlib, struct, sys, time
secret = sys.argv[1].strip().upper()
key = base64.b32decode(secret, casefold=True)
counter = int(time.time()) // 30
msg = struct.pack(">Q", counter)
h = hmac.new(key, msg, hashlib.sha1).digest()
o = h[19] & 0x0F
print(f"{struct.unpack('>I', h[o:o+4])[0] & 0x7FFFFFFF % 1000000:06}")
PY
)"
  verify="$(curl_json POST "$API_BASE/api/v1/admin/security/totp/verify" "{\"code\":\"$code\"}" "$token")"
  [[ "${verify%%|*}" == "200" ]] || return 1
  session="$(json_field "${verify#*|}" session_token)"
  [[ -n "$session" ]] || return 1
  run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_build_object(
    'enforced', true, 'required_console_roles', jsonb_build_array('SuperAdmin','Ops'))
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
  echo "x-traveltrust-admin-2fa-session: $session"
}

echo "== smoke-admin-rbac-matrix-local (??) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "/health not 200 (got $health)"
[[ "${SEED_TEST_ACCOUNTS:-1}" == "1" ]] || fail "SEED_TEST_ACCOUNTS=1 required"

reg_super="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$SUPER_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"RBAC Super\"}")"
[[ "${reg_super%%|*}" == "200" || "${reg_super%%|*}" == "201" ]] || fail "register super HTTP ${reg_super%%|*}"
SUPER_ID="$(json_field "${reg_super#*|}" user_id)"

promote_super="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$SUPER_EMAIL\"}")"
[[ "${promote_super%%|*}" == "200" ]] || fail "seed promote super HTTP ${promote_super%%|*}"

reg_cs="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$CS_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"RBAC CS\"}")"
[[ "${reg_cs%%|*}" == "200" || "${reg_cs%%|*}" == "201" ]] || fail "register cs HTTP ${reg_cs%%|*}"
CS_ID="$(json_field "${reg_cs#*|}" user_id)"

promote_cs="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$CS_EMAIL\"}")"
[[ "${promote_cs%%|*}" == "200" ]] || fail "seed promote cs HTTP ${promote_cs%%|*}"

run_psql -c "UPDATE users SET role = 'super_admin' WHERE id = '$SUPER_ID'::uuid;" >/dev/null
run_psql -c "UPDATE users SET role = 'admin' WHERE id = '$CS_ID'::uuid;" >/dev/null

login_super="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$SUPER_EMAIL\",\"password\":\"$PASSWORD\"}")"
[[ "${login_super%%|*}" == "200" ]] || fail "login super HTTP ${login_super%%|*}"
SUPER_TOKEN="$(json_field "${login_super#*|}" token)"
SUPER_2FA="$(admin_2fa_header "$SUPER_TOKEN" 2>/dev/null || true)"

login_cs="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$CS_EMAIL\",\"password\":\"$PASSWORD\"}")"
[[ "${login_cs%%|*}" == "200" ]] || fail "login cs HTTP ${login_cs%%|*}"
CS_TOKEN="$(json_field "${login_cs#*|}" token)"

caps="$(curl_json_super GET "$API_BASE/api/v1/admin/capabilities" "" "$SUPER_TOKEN")"
[[ "${caps%%|*}" == "200" ]] || fail "capabilities super HTTP ${caps%%|*}"
prep_db="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.phase2_prep?.admin_console_role_db?'1':'');" "${caps#*|}")"
[[ "$prep_db" == "1" ]] || fail "phase2_prep.admin_console_role_db not true"

route_mx="$(curl_json_super GET "$API_BASE/api/v1/admin/rbac/route-matrix" "" "$SUPER_TOKEN")"
[[ "${route_mx%%|*}" == "200" ]] || fail "route-matrix HTTP ${route_mx%%|*}"

export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1
run_psql -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$CS_ID'::uuid, 'CS')
  ON CONFLICT (user_id) DO UPDATE SET console_role = 'CS', updated_at = now();" >/dev/null
ok "assign CS console role via db"

caps_cs="$(curl_json GET "$API_BASE/api/v1/admin/capabilities" "" "$CS_TOKEN")"
[[ "${caps_cs%%|*}" == "200" ]] || fail "capabilities cs HTTP ${caps_cs%%|*}"
[[ "$(json_field "${caps_cs#*|}" console_role_70)" == "CS" ]] || fail "expected console_role_70=CS"
[[ "$(json_field "${caps_cs#*|}" console_role_source)" == "db:admin_console_roles" ]] || fail "expected db source"

run_psql -c "INSERT INTO feature_flags (id, flag_code, enabled, version)
  VALUES ('00000000-0000-0000-0000-000000000099'::uuid, 'smoke_rbac_matrix', false, 1)
  ON CONFLICT (flag_code) DO UPDATE SET version = 1, updated_at = now();" >/dev/null

flags_pub="$(curl_json POST "$API_BASE/api/v1/admin/flags/00000000-0000-0000-0000-000000000099/publish" \
  "{\"enabled\":true,\"expected_version\":1}" "$CS_TOKEN" "smoke-rbac-cs-flag-publish")"
[[ "${flags_pub%%|*}" == "403" ]] || fail "CS flag publish expected 403 got ${flags_pub%%|*}"

flags_read="$(curl_json GET "$API_BASE/api/v1/admin/flags?limit=1" "" "$CS_TOKEN")"
[[ "${flags_read%%|*}" == "200" ]] || fail "CS flags list expected 200"

fin_cs="$(curl_json GET "$API_BASE/api/v1/admin/finance/summary" "" "$CS_TOKEN")"
[[ "${fin_cs%%|*}" == "403" ]] || fail "CS finance summary expected 403"

run_psql -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$CS_ID'::uuid, 'Finance')
  ON CONFLICT (user_id) DO UPDATE SET console_role = 'Finance', updated_at = now();" >/dev/null

caps_fin="$(curl_json GET "$API_BASE/api/v1/admin/capabilities" "" "$CS_TOKEN")"
[[ "$(json_field "${caps_fin#*|}" console_role_70)" == "Finance" ]] || fail "Finance role mapping failed"

fin_ok="$(curl_json GET "$API_BASE/api/v1/admin/finance/summary" "" "$CS_TOKEN")"
[[ "${fin_ok%%|*}" == "200" ]] || fail "Finance role finance/summary expected 200"

ok "db_console_role + route_matrix + CS deny publish + Finance allow finance read"
