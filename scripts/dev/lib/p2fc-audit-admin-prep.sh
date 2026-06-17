#!/usr/bin/env bash
# P2FC / CDA / CDIA · fresh audit admin (Ops console + 2FA off for local spine)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
API_BASE="${P2FC_AUDIT_API_BASE:-${API_BASE:-${CDA_API_BASE:-http://127.0.0.1:8080}}}"
API_BASE="${API_BASE%/}"
DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@localhost:5432/traveltrust}"
PG_CONTAINER="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"
STAMP="${P2FC_AUDIT_ADMIN_STAMP:-$(date +%s)}-${RANDOM}"
ADMIN_EMAIL="${P2FC_AUDIT_ADMIN_EMAIL:-p2fc-audit-admin-${STAMP}@traveltrust.test}"
PASSWORD="${P2FC_AUDIT_ADMIN_PASSWORD:-Test123!}"

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"
  else
    docker exec "$PG_CONTAINER" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@"
  fi
}

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

[[ "${SEED_TEST_ACCOUNTS:-1}" == "1" ]] || {
  echo "p2fc-audit-admin-prep: SEED_TEST_ACCOUNTS=1 required" >&2
  exit 1
}

if [[ -n "${P2FC_AUDIT_ADMIN_TOKEN:-}" && -n "${P2FC_AUDIT_ADMIN_EMAIL:-}" ]]; then
  probe="$(curl_json GET "$API_BASE/api/v1/admin/community/reports?limit=1" "" "$P2FC_AUDIT_ADMIN_TOKEN")"
  if [[ "${probe%%|*}" == "200" ]]; then
    export CDA_ADMIN_EMAIL="$P2FC_AUDIT_ADMIN_EMAIL"
    export CDIA_ADMIN_EMAIL="$P2FC_AUDIT_ADMIN_EMAIL"
    export CDA_ADMIN_PASSWORD="${P2FC_AUDIT_ADMIN_PASSWORD:-$PASSWORD}"
    export CDIA_ADMIN_PASSWORD="${CDIA_ADMIN_PASSWORD:-$PASSWORD}"
    echo "p2fc-audit-admin-prep: reuse email=$P2FC_AUDIT_ADMIN_EMAIL"
    return 0 2>/dev/null || exit 0
  fi
fi

reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"P2FC Audit Admin\"}")"
[[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || {
  echo "p2fc-audit-admin-prep: register failed HTTP ${reg%%|*}" >&2
  exit 1
}
ADMIN_ID="$(json_field "${reg#*|}" user_id)"

promote="$(curl_json POST "$API_BASE/auth/seed-test-accounts" "{\"promote_admin_email\":\"$ADMIN_EMAIL\"}")"
[[ "${promote%%|*}" == "200" ]] || {
  echo "p2fc-audit-admin-prep: promote failed HTTP ${promote%%|*}" >&2
  exit 1
}

run_psql -c "UPDATE users SET role = 'admin' WHERE id = '$ADMIN_ID'::uuid;" >/dev/null
run_psql -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$ADMIN_ID'::uuid, 'Ops')
  ON CONFLICT (user_id) DO UPDATE SET console_role = 'Ops', updated_at = now();" >/dev/null
run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(
  COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true)
  WHERE policy_key = 'admin_2fa_policy';" >/dev/null || true
run_psql -c "UPDATE community_abuse_policy SET post_min_interval_sec = 1 WHERE post_min_interval_sec > 1;" >/dev/null 2>&1 || true

login="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}")"
[[ "${login%%|*}" == "200" ]] || {
  echo "p2fc-audit-admin-prep: login failed HTTP ${login%%|*}" >&2
  exit 1
}
ADMIN_TOKEN="$(json_field "${login#*|}" token)"

probe="$(curl_json GET "$API_BASE/api/v1/admin/community/reports?limit=1" "" "$ADMIN_TOKEN")"
[[ "${probe%%|*}" == "200" ]] || {
  echo "p2fc-audit-admin-prep: admin community probe HTTP ${probe%%|*} (check RBAC/2FA)" >&2
  exit 1
}

export CDA_ADMIN_EMAIL="$ADMIN_EMAIL"
export CDIA_ADMIN_EMAIL="$ADMIN_EMAIL"
export CDA_ADMIN_PASSWORD="$PASSWORD"
export CDIA_ADMIN_PASSWORD="$PASSWORD"
export P2FC_AUDIT_ADMIN_EMAIL="$ADMIN_EMAIL"
export P2FC_AUDIT_ADMIN_TOKEN="$ADMIN_TOKEN"
export P2FC_AUDIT_ADMIN_PASSWORD="$PASSWORD"

echo "p2fc-audit-admin-prep: OK email=$ADMIN_EMAIL id=$ADMIN_ID"
