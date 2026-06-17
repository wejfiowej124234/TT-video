#!/usr/bin/env bash
# ② Staging · 将已注册邮箱提升为 super_admin + SuperAdmin 控制台角色
#
#   bash scripts/dev/bootstrap-staging-super-admin.sh plantartist778@gmail.com
#
# 前置：fly CLI 已 login · scripts/dev/.env.staging-onboarding.local 含 Fly PG DATABASE_URL
# 或 export STAGING_DATABASE_URL=postgresql://...@127.0.0.1:<proxy-port>/...
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EMAIL="${1:-}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
PG_APP="${FLY_STAGING_PG_APP:-tt-traveltrust-staging}"
PROXY_PORT="${STAGING_PG_PROXY_PORT:-15432}"
ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"

fail() { echo "bootstrap-staging-super-admin: FAIL $*" >&2; exit 2; }

[[ -n "$EMAIL" ]] || fail "usage: bash scripts/dev/bootstrap-staging-super-admin.sh <email>"

load_env() {
  [[ -f "$ENV_FILE" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

psql_via_docker() {
  local url="$1"
  shift
  local pass user host port db
  pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$url")"
  user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$url")"
  host="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.hostname||'127.0.0.1');" "$url")"
  port="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.port||'5432');" "$url")"
  db="$(node -e "const u=new URL(process.argv[1]); process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$url")"
  [[ "$host" == "localhost" ]] && host="host.docker.internal"
  docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
    psql "postgres://${user}@${host}:${port}/${db}" -v ON_ERROR_STOP=1 "$@"
}

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"
  elif command -v docker >/dev/null 2>&1; then
    psql_via_docker "$DATABASE_URL" "$@"
  else
    fail "need psql or docker for staging PG"
  fi
}

load_env
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "$DATABASE_URL" ]] || fail "STAGING_DATABASE_URL or DATABASE_URL required ($ENV_FILE)"

PROXY_PID=""
cleanup() {
  if [[ -n "$PROXY_PID" ]] && kill -0 "$PROXY_PID" 2>/dev/null; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ "$DATABASE_URL" == *flycast* ]]; then
  command -v fly >/dev/null 2>&1 || fail "fly CLI required for flycast DATABASE_URL"
  echo "bootstrap-staging-super-admin: fly proxy ${PROXY_PORT}:5432 -a ${PG_APP} …"
  fly proxy "${PROXY_PORT}:5432" -a "$PG_APP" >/tmp/tt-staging-pg-proxy.log 2>&1 &
  PROXY_PID=$!
  sleep 4
  # Rewrite: postgres://user:pass@host:5432/db → localhost:PROXY_PORT
  DATABASE_URL="$(node -e "
    const u = new URL(process.argv[1]);
    u.hostname = '127.0.0.1';
    u.port = String(process.argv[2]);
    u.searchParams.delete('sslmode');
    process.stdout.write(u.toString());
  " "$DATABASE_URL" "$PROXY_PORT")"
  export DATABASE_URL
fi

echo "bootstrap-staging-super-admin: email=$EMAIL api=$API"

run_psql -c "UPDATE users SET role = 'super_admin', updated_at = now() WHERE email = '${EMAIL}';"
ROWS="$(run_psql -t -c "SELECT count(*) FROM users WHERE email = '${EMAIL}';" | tr -d ' \n')"
[[ "$ROWS" == "1" ]] || fail "user not found: $EMAIL"

run_psql -c "INSERT INTO admin_console_roles (user_id, console_role)
  SELECT id, 'SuperAdmin' FROM users WHERE email = '${EMAIL}'
  ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();"

run_psql -c "INSERT INTO admin_security_policies (policy_key, policy_value)
  VALUES ('admin_2fa_policy', '{\"enforced\": false}'::jsonb)
  ON CONFLICT (policy_key) DO UPDATE
  SET policy_value = jsonb_set(admin_security_policies.policy_value, '{enforced}', 'false'::jsonb, true),
      updated_at = now();"

run_psql -c "SELECT u.email, u.role, acr.console_role
  FROM users u LEFT JOIN admin_console_roles acr ON acr.user_id = u.id
  WHERE u.email = '${EMAIL}';"

echo "bootstrap-staging-super-admin: sync memory via seed-test-accounts promote …"
HTTP="$(curl -sS -o /tmp/tt-staging-promote.json -w '%{http_code}' -X POST "${API}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -d "{\"promote_admin_email\":\"${EMAIL}\"}" --connect-timeout 15 --max-time 30)"
echo "  POST /auth/seed-test-accounts HTTP ${HTTP}"
cat /tmp/tt-staging-promote.json
echo
[[ "$HTTP" == "200" ]] || fail "promote HTTP ${HTTP}"

echo "bootstrap-staging-super-admin: OK — re-login at https://tt-web-staging.fly.dev/auth/login?returnUrl=/admin"
echo "TT_BOOTSTRAP_STAGING_SUPER_ADMIN: PASS"
