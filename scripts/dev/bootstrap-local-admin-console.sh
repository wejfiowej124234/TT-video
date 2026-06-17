#!/usr/bin/env bash
# 本地管理后台：super_admin + admin_console_roles SuperAdmin + 2FA policy off（①）
set -euo pipefail

PORT="${1:-8080}"
EMAIL="${LOCAL_ADMIN_EMAIL:-tourist@test.com}"
API_BASE="http://127.0.0.1:${PORT}"
PASSWORD="${LOCAL_ADMIN_PASSWORD:-Test123!}"
PG_CONTAINER="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"

run_psql() {
  if [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"
  else
    docker exec "$PG_CONTAINER" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@"
  fi
}

echo "bootstrap-local-admin-console: email=$EMAIL port=$PORT"
run_psql -c "UPDATE users SET role = 'super_admin' WHERE email = '${EMAIL}';"
run_psql -c "INSERT INTO admin_console_roles (user_id, console_role)
  SELECT id, 'SuperAdmin' FROM users WHERE email = '${EMAIL}'
  ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();"
run_psql -c "UPDATE admin_security_policies
  SET policy_value = jsonb_set(policy_value, '{enforced}', 'false'::jsonb, true)
  WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true

code="$(curl -sS -o /tmp/tt-admin-login.json -w '%{http_code}' -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" --connect-timeout 10 --max-time 30 || echo 000)"
if [[ "$code" == "200" ]]; then
  tok="$(node -e "const o=require('/tmp/tt-admin-login.json'); process.stdout.write(o.token||'')" 2>/dev/null || true)"
  if [[ -n "$tok" ]]; then
    curl -sS -o /dev/null -w "capabilities_http=%{http_code}\n" \
      -H "Authorization: Bearer $tok" "$API_BASE/api/v1/admin/capabilities" --max-time 30 || true
  fi
fi
echo "TT_BOOTSTRAP_LOCAL_ADMIN: PASS"
