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

staging_adm_u01_kill_port_listener() {
  local port="$1"
  local pid=""
  if command -v netstat >/dev/null 2>&1; then
    pid="$(netstat -ano 2>/dev/null | grep "127.0.0.1:${port}" | grep LISTENING | awk '{print $NF}' | head -1 || true)"
  elif command -v ss >/dev/null 2>&1; then
    pid="$(ss -tlnp 2>/dev/null | grep ":${port} " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1 || true)"
  fi
  [[ -n "$pid" && "$pid" != "0" ]] || return 0
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //PID "$pid" //F >/dev/null 2>&1 || true
  else
    kill "$pid" 2>/dev/null || true
  fi
  sleep 1
}

staging_adm_u01_proxy_dsn() {
  node -e "
    const u = new URL(process.argv[1]);
    u.hostname = '127.0.0.1';
    u.port = String(process.argv[2]);
    u.searchParams.delete('sslmode');
    process.stdout.write(u.toString());
  " "$STAGING_DATABASE_URL" "$STAGING_PG_PROXY_PORT"
}

staging_adm_u01_pg_probe() {
  local dsn="$1"
  if command -v psql >/dev/null 2>&1; then
    if psql "$dsn" -v ON_ERROR_STOP=1 -tAc "SELECT 1" >/dev/null 2>&1; then
      return 0
    fi
  fi
  # Prefer node `pg` on host (fly proxy on 127.0.0.1) — docker+host.docker.internal often hangs on Windows.
  local pg_root="${REPO_ROOT:-.}/frontend"
  if [[ -d "$pg_root/node_modules/pg" ]] && command -v node >/dev/null 2>&1; then
    if (cd "$pg_root" && node -e "
      const { Client } = require('pg');
      const c = new Client({ connectionString: process.argv[1], connectionTimeoutMillis: 8000 });
      c.connect()
        .then(() => c.query('SELECT 1'))
        .then(() => c.end())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    " "$dsn" >/dev/null 2>&1); then
      return 0
    fi
  fi
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi
  local pass user host port db
  pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$dsn")"
  user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$dsn")"
  host="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.hostname||'127.0.0.1');" "$dsn")"
  port="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(u.port||'5432');" "$dsn")"
  db="$(node -e "const u=new URL(process.argv[1]); process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$dsn")"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" ]] && host="host.docker.internal"
  if command -v timeout >/dev/null 2>&1; then
    timeout 12 docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
      psql "postgres://${user}@${host}:${port}/${db}" -v ON_ERROR_STOP=1 -tAc "SELECT 1" >/dev/null 2>&1
  else
    docker run --rm -e "PGPASSWORD=${pass}" postgres:16-alpine \
      psql "postgres://${user}@${host}:${port}/${db}" -v ON_ERROR_STOP=1 -tAc "SELECT 1" >/dev/null 2>&1
  fi
}

staging_adm_u01_prepare_dsn() {
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}api.fly.io,fly.io,.fly.io,6pn.dev"
  unset HTTPS_PROXY HTTP_PROXY ALL_PROXY 2>/dev/null || true
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

  local proxied_dsn
  proxied_dsn="$(staging_adm_u01_proxy_dsn)"
  if staging_adm_u01_pg_probe "$proxied_dsn"; then
    echo "staging-adm-u01-env: reuse existing fly proxy on 127.0.0.1:${STAGING_PG_PROXY_PORT}"
    STAGING_DATABASE_URL="$proxied_dsn"
    export STAGING_DATABASE_URL
    return 0
  fi

  staging_adm_u01_kill_port_listener "$STAGING_PG_PROXY_PORT"
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //IM flyctl.exe //F >/dev/null 2>&1 || true
    sleep 2
  fi

  echo "staging-adm-u01-env: fly proxy ${STAGING_PG_PROXY_PORT}:5432 -a ${FLY_STAGING_PG_APP} …"
  fly proxy "${STAGING_PG_PROXY_PORT}:5432" -a "$FLY_STAGING_PG_APP" >/tmp/tt-staging-pg-proxy-deep-gate.log 2>&1 &
  STAGING_PG_PROXY_PID=$!
  sleep 3

  local ready=0
  local i
  for i in $(seq 1 40); do
    if staging_adm_u01_pg_probe "$proxied_dsn"; then
      ready=1
      break
    fi
    sleep 2
  done

  if [[ "$ready" != "1" ]]; then
    echo "staging-adm-u01-env: FAIL — fly proxy postgres probe failed on 127.0.0.1:${STAGING_PG_PROXY_PORT} (see /tmp/tt-staging-pg-proxy-deep-gate.log)" >&2
    tail -10 /tmp/tt-staging-pg-proxy-deep-gate.log >&2 || true
    unset STAGING_DATABASE_URL
    return 1
  fi

  STAGING_DATABASE_URL="$proxied_dsn"
  export STAGING_DATABASE_URL
}
