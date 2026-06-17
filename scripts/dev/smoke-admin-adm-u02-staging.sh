#!/usr/bin/env bash
# ADM-U02 · Phase ②：同一持久 Staging API + DB（非 ① localhost）
#
#   export STAGING_API_BASE=https://<fly-api>
#   export STAGING_DATABASE_URL=postgresql://...
#   export ADM_U02_STRICT=1
#   export ADM_U02_REQUIRE_PERSISTENT_HOST=1   # Fly 收口时
#   bash scripts/dev/smoke-admin-adm-u02-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/adm-staging-host-guard.sh
source "$ROOT/scripts/dev/lib/adm-staging-host-guard.sh"

export ADM_U02_STRICT=1
export ADM_U02_STAGING=1

STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
[[ -n "$STAGING_API_BASE" ]] || { echo "FAIL: STAGING_API_BASE required" >&2; exit 1; }

adm_staging_require_strict_api || exit 1

if [[ "${ADM_U02_REQUIRE_PERSISTENT_HOST:-0}" == "1" ]]; then
  adm_staging_require_persistent_api_fe || exit 1
fi

export API_BASE="$STAGING_API_BASE"
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "$DATABASE_URL" ]] || {
  echo "FAIL: STAGING_DATABASE_URL (or DATABASE_URL) required — smoke uses psql against staging DB" >&2
  exit 1
}

echo "smoke-admin-adm-u02-staging: API_BASE=$API_BASE"
bash "$ROOT/scripts/dev/smoke-admin-adm-u02-local.sh"
