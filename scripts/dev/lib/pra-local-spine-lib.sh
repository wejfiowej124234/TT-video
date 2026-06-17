#!/usr/bin/env bash
# PRA · 本地 testnet spine（:8080）就绪探针 · 仅 ops harness
set -euo pipefail

PRA_SPINE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRA_SPINE_ROOT="$(cd "${PRA_SPINE_LIB_DIR}/../../.." && pwd)"

pra_spine_api_base() {
  printf '%s' "${PRA_LOCAL_SPINE_API:-http://127.0.0.1:8080}"
}

pra_spine_health_code() {
  local base
  base="$(pra_spine_api_base)"
  curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "${base%/}/health" 2>/dev/null || echo "000"
}

pra_spine_country_market_code() {
  local base code
  base="$(pra_spine_api_base)"
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
      "${base%/}/api/v1/admin/country-market/launches?limit=1" 2>/dev/null || echo "000"
  )"
  printf '%s' "$code"
}

pra_spine_meta_responsive() {
  local base probe="${PRA_LOCAL_SPINE_META_PROBE_SEC:-15}"
  base="$(pra_spine_api_base)"
  local code
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' --max-time "$probe" \
      "${base%/}/meta/build" 2>/dev/null || echo "000"
  )"
  [[ "$code" == "200" ]]
}

pra_spine_wait_meta_responsive() {
  local max="${PRA_LOCAL_SPINE_META_POLL_SEC:-45}" i
  export PRA_LOCAL_SPINE_META_PROBE_SEC="${PRA_LOCAL_SPINE_META_PROBE_SEC:-15}"
  for ((i = 1; i <= max; i++)); do
    if pra_spine_meta_responsive; then
      echo "pra-local-spine: /meta 200 (${i}s)"
      return 0
    fi
    sleep 2
  done
  echo "pra-local-spine: timeout waiting for /meta" >&2
  return 1
}

pra_spine_kill_port_listeners() {
  local port="${PRA_LOCAL_SPINE_PORT:-8080}" pids pid
  if command -v netstat >/dev/null 2>&1 && command -v taskkill >/dev/null 2>&1; then
    pids="$(netstat -ano 2>/dev/null | grep ":${port}" | grep LISTENING | awk '{print $NF}' | sort -u || true)"
    for pid in $pids; do
      [[ -n "$pid" && "$pid" != "0" ]] || continue
      echo "pra-local-spine: taskkill port=${port} pid=${pid}" >&2
      taskkill //F //PID "$pid" 2>/dev/null || true
    done
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

pra_spine_wait_down() {
  local max="${PRA_LOCAL_SPINE_DOWN_WAIT_SEC:-30}" i
  for ((i = 1; i <= max; i++)); do
    [[ "$(pra_spine_health_code)" != "200" ]] && return 0
    sleep 1
  done
  pra_spine_kill_port_listeners
  sleep 2
}

pra_spine_stop_api() {
  local pid_file="${PRA_LOCAL_SPINE_PID_FILE:-$PRA_SPINE_ROOT/.pra-local-spine-api.pid}"
  local old_pid=""
  if [[ -f "$pid_file" ]]; then
    old_pid="$(cat "$pid_file" 2>/dev/null || true)"
  fi
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "pra-local-spine: stopping pid=${old_pid} (meta unresponsive or restart)" >&2
    kill "$old_pid" 2>/dev/null || true
    sleep 2
    kill -9 "$old_pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
  pra_spine_wait_down
}

pra_spine_start_api() {
  local pid_file log_file base
  base="$(pra_spine_api_base)"
  pid_file="${PRA_LOCAL_SPINE_PID_FILE:-$PRA_SPINE_ROOT/.pra-local-spine-api.pid}"
  log_file="${PRA_LOCAL_SPINE_LOG:-$PRA_SPINE_ROOT/evidence/PRODUCTION_READINESS_AUDIT/pra-local-spine-api.log}"
  mkdir -p "$(dirname "$log_file")"
  echo "pra-local-spine: starting traveltrust-api on ${base} (log=${log_file})" >&2
  (
    cd "$PRA_SPINE_ROOT"
    set -a
    # shellcheck disable=SC1091
    [[ -f .env ]] && source .env
    set +a
    # PRA spine：不触链 · /meta 须在 30s 内返回（TimeoutLayer 常量，无法 env 覆盖）
    if [[ "${PRA_LOCAL_SPINE_FAST_META:-1}" == "1" ]]; then
      unset CHAIN_RPC_URL CHAIN_ID \
        ESCROW_FACTORY_ADDRESS FEE_ROUTER_ADDRESS REGION_VAULT_ADDRESS \
        STAKING_ADDRESS REGISTRY_ADDRESS GOVERNOR_ADDRESS \
        GOVERNANCE_VOTES_TOKEN_ADDRESS FUND_STACK_TOKEN_ADDRESS 2>/dev/null || true
    fi
    export PORT="${PORT:-8080}"
    export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
    export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
    export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
    export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
    export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
    exec cargo run -p traveltrust-api
  ) >>"$log_file" 2>&1 &
  echo $! >"$pid_file"
}

pra_spine_ready() {
  [[ "$(pra_spine_health_code)" == "200" ]]
}

pra_spine_country_market_routable() {
  local code
  code="$(pra_spine_country_market_code)"
  [[ "$code" != "404" && "$code" != "000" ]]
}

pra_spine_wait_ready() {
  local max="${PRA_LOCAL_SPINE_WAIT_SEC:-180}" i
  for ((i = 1; i <= max; i++)); do
    if pra_spine_ready; then
      echo "pra-local-spine: health 200 (${i}s)"
      return 0
    fi
    sleep 1
  done
  echo "pra-local-spine: timeout waiting for /health" >&2
  return 1
}

ensure_pra_local_spine_api() {
  local pid_file log_file base
  base="$(pra_spine_api_base)"
  pid_file="${PRA_LOCAL_SPINE_PID_FILE:-$PRA_SPINE_ROOT/.pra-local-spine-api.pid}"
  log_file="${PRA_LOCAL_SPINE_LOG:-$PRA_SPINE_ROOT/evidence/PRODUCTION_READINESS_AUDIT/pra-local-spine-api.log}"

  if pra_spine_ready && pra_spine_country_market_routable && pra_spine_meta_responsive; then
    echo "TT_PRA_LOCAL_SPINE: OK already_up api=${base} country_market=$(pra_spine_country_market_code) meta=200"
    return 0
  fi

  if pra_spine_ready && ! pra_spine_meta_responsive; then
    echo "pra-local-spine: /health OK but /meta unresponsive — restarting API" >&2
    pra_spine_stop_api
  fi

  mkdir -p "$(dirname "$log_file")"
  if [[ -f "$pid_file" ]]; then
    local old_pid
    old_pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
      if ! pra_spine_country_market_routable || ! pra_spine_meta_responsive; then
        pra_spine_stop_api
      else
        echo "pra-local-spine: waiting for existing pid=${old_pid}" >&2
        export PRA_LOCAL_SPINE_WAIT_SEC="${PRA_LOCAL_SPINE_WAIT_SEC:-240}"
        pra_spine_wait_ready
        if pra_spine_country_market_routable && pra_spine_meta_responsive; then
          echo "TT_PRA_LOCAL_SPINE: OK existing_pid=${old_pid} country_market=$(pra_spine_country_market_code) meta=200"
          return 0
        fi
        pra_spine_stop_api
      fi
    fi
  fi

  pra_spine_start_api

  export PRA_LOCAL_SPINE_WAIT_SEC="${PRA_LOCAL_SPINE_WAIT_SEC:-300}"
  pra_spine_wait_ready
  if ! pra_spine_country_market_routable; then
    echo "TT_PRA_LOCAL_SPINE: FAIL country_market HTTP $(pra_spine_country_market_code) (need current API binary)" >&2
    return 2
  fi
  export PRA_LOCAL_SPINE_META_POLL_SEC="${PRA_LOCAL_SPINE_META_POLL_SEC:-45}"
  if ! pra_spine_wait_meta_responsive; then
    echo "TT_PRA_LOCAL_SPINE: FAIL /meta unresponsive after restart" >&2
    return 2
  fi
  echo "TT_PRA_LOCAL_SPINE: OK started pid=$(cat "$pid_file") country_market=$(pra_spine_country_market_code) meta=200"
}
