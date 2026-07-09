#!/usr/bin/env bash
# 统一 psql：本机 psql → node pg（127.0.0.1）→ docker exec 回退
# shellcheck shell=bash
tt_run_psql() {
  local db="${DATABASE_URL:-${L5_P0_DB:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}}"
  local container="${SMOKE_PG_CONTAINER:-${L5_P0_PG:-traveltrust-postgres}}"
  local root="${TT_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"

  if command -v psql >/dev/null 2>&1; then
    psql "$db" -v ON_ERROR_STOP=1 -q "$@"
    return $?
  fi

  if [[ -f "$root/frontend/node_modules/pg/package.json" ]]; then
    node "$root/scripts/dev/lib/tt-psql-exec.mjs" "$db" "$@"
    return $?
  fi

  docker exec "$container" psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q "$@"
}
