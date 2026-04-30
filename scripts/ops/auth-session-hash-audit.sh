#!/usr/bin/env bash
set -euo pipefail

# Audit active sessions missing token_hash.
# Usage:
#   DATABASE_URL=... scripts/ops/auth-session-hash-audit.sh
# Optional:
#   AUTH_SESSION_HASH_AUDIT_FAIL_ON_MISSING=1

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 2
fi

query=$(
  cat <<'SQL'
SELECT
  COUNT(*) FILTER (
    WHERE revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (idle_expires_at IS NULL OR idle_expires_at > now())
  )::bigint AS active_sessions,
  COUNT(*) FILTER (
    WHERE token_hash IS NULL
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (idle_expires_at IS NULL OR idle_expires_at > now())
  )::bigint AS missing_token_hash
FROM sessions;
SQL
)

result="$(psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -t -A -F',' -c "${query}")"
active="${result%%,*}"
missing="${result##*,}"
active="$(echo "${active}" | xargs)"
missing="$(echo "${missing}" | xargs)"

echo "auth_session_hash_audit active_sessions=${active} missing_token_hash=${missing}"

if [[ "${AUTH_SESSION_HASH_AUDIT_FAIL_ON_MISSING:-0}" == "1" ]] && [[ "${missing}" != "0" ]]; then
  echo "auth_session_hash_audit failed: missing_token_hash=${missing}" >&2
  exit 1
fi
