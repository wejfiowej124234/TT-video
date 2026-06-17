#!/usr/bin/env bash
# Export **only** DATABASE_URL from the repo root `.env` without `source`ing the whole file.
# Use when `.env` contains lines that bash cannot parse (e.g. unquoted `Name <email@domain>`).
#
# Usage (Git Bash / Linux / macOS):
#   source scripts/dev/export-database-url-from-root-env.sh
# Optional alternate file:
#   TT_LOAD_ENV_FILE=/path/to/other.env source scripts/dev/export-database-url-from-root-env.sh
#
# Then run gates that need PG, e.g.:
#   bash scripts/gates/local-delivery-expanded.sh
set -euo pipefail

_sourced=0
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  _sourced=1
fi

_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_root="$(cd "$_here/../.." && pwd)"
_env="${TT_LOAD_ENV_FILE:-$_root/.env}"

_fail() {
  echo "export-database-url-from-root-env: $*" >&2
  if [[ "${_sourced}" -eq 1 ]]; then
    return 1
  fi
  exit 1
}

if [[ ! -f "${_env}" ]]; then
  _fail "no file: ${_env}"
fi

while IFS= read -r line || [[ -n "${line}" ]]; do
  line="${line%$'\r'}"
  [[ "${line}" =~ ^[[:space:]]*# ]] && continue
  stripped="${line//[[:space:]]/}"
  [[ -z "${stripped}" ]] && continue
  if [[ "${line}" == DATABASE_URL=* ]]; then
    val="${line#DATABASE_URL=}"
    if [[ "${val}" =~ ^\".*\"$ ]]; then
      val="${val#\"}"
      val="${val%\"}"
    elif [[ "${val}" =~ ^\'.*\'$ ]]; then
      val="${val#\'}"
      val="${val%\'}"
    fi
    export DATABASE_URL="${val}"
    echo "export-database-url-from-root-env: DATABASE_URL set from ${_env} (${#DATABASE_URL} chars)" >&2
    if [[ "${_sourced}" -eq 1 ]]; then
      return 0
    fi
    echo "export-database-url-from-root-env: run with 'source' so DATABASE_URL reaches your shell (see script header)." >&2
    exit 2
  fi
done < "${_env}"

_fail "DATABASE_URL= not found in ${_env}"
