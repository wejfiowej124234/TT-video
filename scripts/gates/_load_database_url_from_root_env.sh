#!/usr/bin/env bash
# Load DATABASE_URL from repo root .env for gate scripts.
load_database_url_from_root_env() {
  local root="${1:-.}"
  local env_file="$root/.env"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi
  if [[ ! -f "$env_file" ]]; then
    echo "${_load_db_gate_name:-gate}: WARN .env missing — DATABASE_URL unset" >&2
    return 1
  fi
  local line
  line="$(grep -E '^DATABASE_URL=' "$env_file" | head -1 || true)"
  if [[ -z "$line" ]]; then
    echo "${_load_db_gate_name:-gate}: FAIL DATABASE_URL not in .env" >&2
    return 1
  fi
  export DATABASE_URL="${line#DATABASE_URL=}"
  DATABASE_URL="${DATABASE_URL//$'\r'/}"
  DATABASE_URL="${DATABASE_URL%\"}"
  DATABASE_URL="${DATABASE_URL#\"}"
  export DATABASE_URL
  return 0
}
