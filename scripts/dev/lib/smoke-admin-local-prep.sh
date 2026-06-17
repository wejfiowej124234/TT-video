#!/usr/bin/env bash
# ① local/staging-dev · Admin smoke prep (2FA policy relax · no staging deploy)
set -euo pipefail

smoke_admin_run_psql() {
  local db="${DATABASE_URL:-postgres://traveltrust:traveltrust@localhost:5432/traveltrust}"
  if [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
    psql "$db" -v ON_ERROR_STOP=1 -q "$@"
    return
  fi
  local c="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$c"; then
    docker exec "$c" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@"
    return
  fi
  return 1
}

# Relax enforced 2FA for local moderation/admin smokes (PG admin_security_policies).
smoke_admin_relax_2fa_for_local() {
  smoke_admin_run_psql -c "UPDATE admin_security_policies
    SET policy_value = jsonb_set(COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true)
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
}

# Ensure promoted admin has console role for community moderation reads.
smoke_admin_ensure_console_role() {
  local email="$1"
  local role="${2:-Ops}"
  [[ -n "$email" ]] || return 0
  smoke_admin_run_psql -c "INSERT INTO admin_console_roles (user_id, console_role)
    SELECT id, '${role}' FROM users WHERE lower(email) = lower('${email}')
    ON CONFLICT (user_id) DO UPDATE SET console_role = EXCLUDED.console_role, updated_at = now();" \
    2>/dev/null || true
}
