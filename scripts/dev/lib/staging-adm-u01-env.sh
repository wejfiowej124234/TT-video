#!/usr/bin/env bash
# ADM-U01 · 为 Deep Gate G04 准备 STAGING_DATABASE_URL（含 flycast → fly proxy）
# shellcheck disable=SC2034
set -euo pipefail

_staging_adm_u01_merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$f"
}

# 加载 onboarding 真源（与 S5 deploy 同文件）
_staging_adm_u01_merge_env "${STAGING_ENV_FILE:-${REPO_ROOT:-.}/scripts/dev/.env.staging-onboarding.local}"

export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
export STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
export TRAVELTRUST_STAGING_API_BASE="$STAGING_API_BASE"
export ADM_U01_STRICT="${ADM_U01_STRICT:-1}"

STAGING_PG_PROXY_PID=""
STAGING_PG_PROXY_PORT="${STAGING_PG_PROXY_PORT:-15432}"
FLY_STAGING_PG_APP="${FLY_STAGING_PG_APP:-tt-traveltrust-staging}"

staging_adm_u01_cleanup_proxy() {
  if [[ -n "${STAGING_PG_PROXY_PID:-}" ]] && kill -0 "$STAGING_PG_PROXY_PID" 2>/dev/null; then
    kill "$STAGING_PG_PROXY_PID" 2>/dev/null || true
    wait "$STAGING_PG_PROXY_PID" 2>/dev/null || true
  fi
  STAGING_PG_PROXY_PID=""
}

staging_adm_u01_prepare_dsn() {
  [[ -n "${STAGING_DATABASE_URL:-}" ]] || {
    echo "staging-adm-u01-env: WARN — STAGING_DATABASE_URL unset (G04 ADM-U01 will FAIL)" >&2
    return 0
  }

  if [[ "$STAGING_DATABASE_URL" != *flycast* ]]; then
    return 0
  fi

  command -v fly >/dev/null 2>&1 || {
    echo "staging-adm-u01-env: FAIL — flycast DATABASE_URL requires fly CLI" >&2
    return 1
  }

  if [[ -z "${FLY_ACCESS_TOKEN:-}" ]] && [[ -f "${HOME}/.fly/config.yml" ]]; then
    FLY_ACCESS_TOKEN="$(python -c "
import yaml, os
p=os.path.expanduser('~/.fly/config.yml')
d=yaml.safe_load(open(p, encoding='utf-8')) or {}
print(d.get('access_token',''))
" 2>/dev/null || true)"
    export FLY_ACCESS_TOKEN
  fi

  echo "staging-adm-u01-env: fly proxy ${STAGING_PG_PROXY_PORT}:5432 -a ${FLY_STAGING_PG_APP} …"
  fly proxy "${STAGING_PG_PROXY_PORT}:5432" -a "$FLY_STAGING_PG_APP" >/tmp/tt-staging-pg-proxy-deep-gate.log 2>&1 &
  STAGING_PG_PROXY_PID=$!
  sleep 5

  if ! python -c "
import socket, sys
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('127.0.0.1', int(sys.argv[1])))
except OSError:
    sys.exit(1)
finally:
    s.close()
" "$STAGING_PG_PROXY_PORT" 2>/dev/null; then
    echo "staging-adm-u01-env: FAIL — fly proxy not listening on 127.0.0.1:${STAGING_PG_PROXY_PORT} (see /tmp/tt-staging-pg-proxy-deep-gate.log)" >&2
    tail -3 /tmp/tt-staging-pg-proxy-deep-gate.log >&2 || true
    return 1
  fi

  STAGING_DATABASE_URL="$(node -e "
    const u = new URL(process.argv[1]);
    u.hostname = '127.0.0.1';
    u.port = String(process.argv[2]);
    u.searchParams.delete('sslmode');
    process.stdout.write(u.toString());
  " "$STAGING_DATABASE_URL" "$STAGING_PG_PROXY_PORT")"
  export STAGING_DATABASE_URL
}
