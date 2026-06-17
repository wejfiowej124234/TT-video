#!/usr/bin/env bash
# ADM-U02 · ① 本地：控制台角色审批链 + 2FA 策略 + 审计落库
#
# 须：API :8080 · DATABASE_URL · migrate（admin_console_roles / approvals / audit / totp）
#   bash scripts/dev/smoke-admin-adm-u02-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-${API_BASE_URL:-http://127.0.0.1:8080}}"
if [[ "${ADM_U02_STAGING:-}" == "1" ]]; then
  API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
fi
API_BASE="${API_BASE%/}"
DATABASE_URL="${DATABASE_URL:-${STAGING_DATABASE_URL:-postgres://traveltrust:traveltrust@localhost:5432/traveltrust}}"
STAMP="$(date +%s)"
REQ_EMAIL="adm-u02-req-${STAMP}@traveltrust.test"
APP_EMAIL="adm-u02-app-${STAMP}@traveltrust.test"
TARGET_EMAIL="adm-u02-tgt-${STAMP}@traveltrust.test"
PASSWORD="Test123!"

fail() { echo "smoke-admin-adm-u02-local: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-admin-adm-u02-local: OK $*"; }

PG_CONTAINER="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"
CURL_EXTRA=()
if [[ "${ADM_U02_STAGING:-}" == "1" ]] || [[ "$API_BASE" == https://* ]]; then
  CURL_EXTRA=(--noproxy "*")
fi

psql_via_docker() {
  local url="$1"
  shift
  local pass user host port db
  pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$url")"
  user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$url")"
  host="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.hostname||'127.0.0.1');" "$url")"
  port="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.port||'5432');" "$url")"
  db="$(node -e "const u=new URL(process.argv[1]); process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$url")"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" ]] && host="host.docker.internal"
  docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
    psql "postgres://${user}@${host}:${port}/${db}" -v ON_ERROR_STOP=1 "$@"
}

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@" 2>/dev/null; then
      return 0
    fi
  fi
  if command -v docker >/dev/null 2>&1; then
    psql_via_docker "$DATABASE_URL" -q "$@"
    return $?
  fi
  docker exec "$PG_CONTAINER" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@" \
    || fail "psql unavailable (install psql or start $PG_CONTAINER)"
}
run_psql_t() {
  if command -v psql >/dev/null 2>&1; then
    local out
    out="$(psql "$DATABASE_URL" -tAc "$1" 2>/dev/null | tr -d '\r')" || true
    if [[ -n "$out" ]]; then
      echo "$out"
      return 0
    fi
  fi
  if command -v docker >/dev/null 2>&1; then
    psql_via_docker "$DATABASE_URL" -t -A -c "$1" | tr -d '\r'
    return 0
  fi
  docker exec "$PG_CONTAINER" psql -U traveltrust -d traveltrust -tAc "$1" | tr -d '\r'
}

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); const p=process.argv[2].split('.'); let v=o; for (const k of p) v=v?.[k]; process.stdout.write(String(v??''));" "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}" extra_hdr="${5:-}"
  local tmp code idem=""
  if [[ "$method" == POST || "$method" == PATCH || "$method" == PUT || "$method" == DELETE ]]; then
    idem="Idempotency-Key: adm-u02-$(date +%s%N)-$RANDOM"
  fi
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    code="$(curl "${CURL_EXTRA[@]}" -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
      -H "Content-Type: application/json" \
      ${idem:+-H "$idem"} \
      ${auth:+-H "Authorization: Bearer $auth"} \
      ${extra_hdr:+-H "$extra_hdr"} \
      -d "$body")"
  else
    code="$(curl "${CURL_EXTRA[@]}" -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
      ${idem:+-H "$idem"} \
      ${auth:+-H "Authorization: Bearer $auth"} \
      ${extra_hdr:+-H "$extra_hdr"})"
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

totp_code() {
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

echo "== smoke-admin-adm-u02-local (①) API=$API_BASE =="
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL required"
if [[ "${ADM_U02_STAGING:-}" != "1" ]]; then
  [[ "${SEED_TEST_ACCOUNTS:-1}" == "1" ]] || fail "SEED_TEST_ACCOUNTS=1 required"
fi
[[ "$(curl "${CURL_EXTRA[@]}" -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)" == "200" ]] || fail "/health not 200"

run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(policy_value, '{enforced}', 'false'::jsonb, true)
  WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true

for spec in "$REQ_EMAIL|super_admin" "$APP_EMAIL|super_admin" "$TARGET_EMAIL|admin"; do
  IFS='|' read -r em ur <<<"$spec"
  reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$em\",\"password\":\"$PASSWORD\"}")"
  code="${reg%%|*}"
  body="${reg#*|}"
  [[ "$code" == "200" || "$code" == "201" ]] || fail "register $em HTTP $code"
  tok="$(json_field "$body" token)"
  uid="$(json_field "$body" user_id)"
  [[ -n "$tok" && -n "$uid" ]] || fail "token/id for $em"
  if [[ "${ADM_U02_STAGING:-}" != "1" ]]; then
    promote="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$em\"}")"
    [[ "${promote%%|*}" == "200" ]] || fail "seed promote $em HTTP ${promote%%|*} (need SEED_TEST_ACCOUNTS=1)"
  fi
  run_psql -c "UPDATE users SET role = '$ur' WHERE id = '$uid'::uuid;"
  if [[ "$em" == "$REQ_EMAIL" || "$em" == "$APP_EMAIL" ]]; then
    run_psql -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$uid'::uuid, 'SuperAdmin')
      ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();"
  fi
  if [[ "${ADM_U02_STAGING:-}" == "1" ]]; then
    ok "staging: use register token after PG promote ($em)"
  else
    login="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$em\",\"password\":\"$PASSWORD\"}")"
    code="${login%%|*}"
    body="${login#*|}"
    [[ "$code" == "200" ]] || fail "login $em HTTP $code"
    tok="$(json_field "$body" token)"
    uid="$(json_field "$body" user_id)"
  fi
  case "$em" in
    "$REQ_EMAIL") REQ_TOKEN="$tok"; REQ_ID="$uid" ;;
    "$APP_EMAIL") APP_TOKEN="$tok"; APP_ID="$uid" ;;
    *) TGT_ID="$uid" ;;
  esac
done

caps="$(curl_json GET "$API_BASE/api/v1/admin/capabilities" "" "$REQ_TOKEN")"
[[ "${caps%%|*}" == "200" ]] || fail "capabilities"
body="${caps#*|}"
u02_ready="$(json_field "$body" phase2_prep.adm_u02_local_ready)"
if [[ "$u02_ready" != "true" ]]; then
  db_prep="$(json_field "$body" phase2_prep.admin_console_role_db)"
  [[ "$db_prep" == "true" ]] || fail "adm_u02_local_ready not true (restart API after ADM-U02 code merge?)"
  echo "WARN: phase2_prep.adm_u02_local_ready missing — using admin_console_role_db only (rebuild traveltrust-api)"
fi

direct_allowed="$(json_field "$body" phase2_prep.console_role_direct_allowed)"
if [[ "$direct_allowed" == "true" ]]; then
  ok "skip direct PUT 409 probe (API TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1)"
  run_psql -c "DELETE FROM admin_console_roles WHERE user_id = '$TGT_ID'::uuid;" 2>/dev/null || true
else
  direct="$(curl_json PUT "$API_BASE/api/v1/admin/users/$TGT_ID/console-role" \
    "{\"console_role_70\":\"Risk\",\"reason\":\"direct-blocked\"}" "$REQ_TOKEN")"
  [[ "${direct%%|*}" == "409" ]] || fail "direct PUT expected 409 got ${direct%%|*}"
fi

req="$(curl_json POST "$API_BASE/api/v1/admin/users/$TGT_ID/console-role-change-request" \
  "{\"console_role_70\":\"Risk\",\"reason\":\"smoke-adm-u02\"}" "$REQ_TOKEN")"
[[ "${req%%|*}" == "200" ]] || fail "role change request HTTP ${req%%|*}"
body="${req#*|}"
APPROVAL_ID="$(json_field "$body" approval_request_id)"
[[ -n "$APPROVAL_ID" ]] || fail "approval_request_id missing"

self="$(curl_json POST "$API_BASE/api/v1/admin/approvals/$APPROVAL_ID/approve" \
  "{\"reason\":\"self\"}" "$REQ_TOKEN")"
[[ "${self%%|*}" == "403" ]] || fail "self-approve expected 403 got ${self%%|*} (${self#*|})"

ap="$(curl_json POST "$API_BASE/api/v1/admin/approvals/$APPROVAL_ID/approve" \
  "{\"reason\":\"smoke-adm-u02-approve\"}" "$APP_TOKEN")"
[[ "${ap%%|*}" == "200" ]] || fail "approve HTTP ${ap%%|*} (${ap#*|})"

caps_tgt="$(curl_json GET "$API_BASE/api/v1/admin/capabilities" "" "$REQ_TOKEN")"
body="${caps_tgt#*|}"
# capabilities for requester still SuperAdmin; check target via DB
cr="$(run_psql_t "SELECT console_role FROM admin_console_roles WHERE user_id='$TGT_ID'::uuid;" | tr -d ' \n')"
[[ "$cr" == "Risk" ]] || fail "expected Risk in DB got '$cr'"

audit="$(curl_json GET "$API_BASE/api/v1/admin/audit-logs?limit=50&action=admin.console_role.change.requested" "" "$REQ_TOKEN")"
[[ "${audit%%|*}" == "200" ]] || fail "audit-logs HTTP ${audit%%|*} (${audit#*|})"
body="${audit#*|}"
audit2="$(curl_json GET "$API_BASE/api/v1/admin/audit-logs?limit=50&action=admin.console_role.change.approved" "" "$REQ_TOKEN")"
[[ "${audit2%%|*}" == "200" ]] || fail "audit-logs approved HTTP ${audit2%%|*}"
body2="${audit2#*|}"
echo "$body" "$body2" | node -e "
const raw=require('fs').readFileSync(0,'utf8').trim().split(/\s+(?=\{)/);
const items=[];
for (const chunk of raw) {
  try { items.push(...(JSON.parse(chunk).items||[])); } catch { /* ignore */ }
}
const actions=new Set(items.map(i=>i.action));
for (const a of ['admin.console_role.change.requested','admin.console_role.change.approved']) {
  if (!actions.has(a)) { console.error('missing audit action', a, 'have', [...actions]); process.exit(1); }
}
"

enroll="$(curl_json POST "$API_BASE/api/v1/admin/security/totp/enroll" "{}" "$REQ_TOKEN")"
[[ "${enroll%%|*}" == "200" ]] || fail "totp enroll"
body="${enroll#*|}"
SECRET="$(json_field "$body" secret_base32)"
CODE="$(totp_code "$SECRET")"
ver="$(curl_json POST "$API_BASE/api/v1/admin/security/totp/verify" "{\"code\":\"$CODE\"}" "$REQ_TOKEN")"
[[ "${ver%%|*}" == "200" ]] || fail "totp verify"
body="${ver#*|}"
SESSION="$(json_field "$body" session_token)"
[[ -n "$SESSION" ]] || fail "session_token missing"

pol="$(curl_json PATCH "$API_BASE/api/v1/admin/security/2fa-policy" "{\"enforced\":true}" "$REQ_TOKEN")"
[[ "${pol%%|*}" == "200" ]] || fail "2fa policy patch"

blocked="$(curl_json POST "$API_BASE/api/v1/admin/users/$TGT_ID/console-role-change-request" \
  "{\"console_role_70\":\"Finance\",\"reason\":\"no-2fa\"}" "$REQ_TOKEN")"
[[ "${blocked%%|*}" == "403" ]] || fail "2fa block expected 403 got ${blocked%%|*}"

with2fa="$(curl_json POST "$API_BASE/api/v1/admin/users/$TGT_ID/console-role-change-request" \
  "{\"console_role_70\":\"Finance\",\"reason\":\"with-2fa\"}" "$REQ_TOKEN" \
  "x-traveltrust-admin-2fa-session: $SESSION")"
[[ "${with2fa%%|*}" == "200" ]] || fail "with 2fa header expected 200 got ${with2fa%%|*}"

pol_off="$(curl_json PATCH "$API_BASE/api/v1/admin/security/2fa-policy" "{\"enforced\":false}" "$REQ_TOKEN" \
  "x-traveltrust-admin-2fa-session: $SESSION")"
[[ "${pol_off%%|*}" == "200" ]] || fail "2fa policy off HTTP ${pol_off%%|*} (${pol_off#*|})"

ok "approval chain + audit + 2fa enforce"
if [[ "${ADM_U02_STAGING:-}" == "1" ]]; then
  echo "TT_ADM_U02_STAGING: PASS"
else
  echo "TT_ADM_U02_LOCAL: PASS"
fi
