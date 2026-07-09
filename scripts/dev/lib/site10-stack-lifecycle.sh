#!/usr/bin/env bash
# ① Site10 execution layer · API :8080 + Next :3012 生命周期（FE/BE 双健康门禁 · 禁止 silent exit）
#
# 须先设 ROOT · 可选 PLAYWRIGHT_API_PORT · FE/API 日志路径。
# 导出：API_PID · FE_PID · site10_* 函数
set -euo pipefail

: "${ROOT:?site10-stack-lifecycle: ROOT required}"
: "${PLAYWRIGHT_API_PORT:=8080}"

SITE10_API_LOG="${SITE10_API_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-api-preflight.log}"
SITE10_FE_LOG="${SITE10_FE_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-fe-preflight.log}"
SITE10_FE_PORT="${SITE10_FE_PORT:-3012}"
SITE10_FE_BASE="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:${SITE10_FE_PORT}}"
SITE10_API_BASE="http://127.0.0.1:${PLAYWRIGHT_API_PORT}"
SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS="${SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS:-3}"
SITE10_FE_READY_MAX_POLLS="${SITE10_FE_READY_MAX_POLLS:-150}"
SITE10_API_READY_MAX_POLLS="${SITE10_API_READY_MAX_POLLS:-90}"
SITE10_POLL_INTERVAL_SEC="${SITE10_POLL_INTERVAL_SEC:-2}"

API_PID="${API_PID:-}"
FE_PID="${FE_PID:-}"

site10_log() {
  if [[ -n "${SITE10_LIFECYCLE_LOG:-}" ]]; then
    echo "$*" | tee -a "$SITE10_LIFECYCLE_LOG"
  else
    echo "$*"
  fi
}

site10_fail_loud() {
  local token="$1"
  shift
  site10_log "${token}: FAIL $*" >&2
  if [[ -f "$SITE10_FE_LOG" ]]; then
    site10_log "--- tail site10-fe-preflight.log ---" >&2
    tail -40 "$SITE10_FE_LOG" >&2 || true
  fi
  if [[ -f "$SITE10_API_LOG" ]]; then
    site10_log "--- tail site10-api-preflight.log ---" >&2
    tail -30 "$SITE10_API_LOG" >&2 || true
  fi
  return 1
}

site10_reclaim_port() {
  local port="$1"
  node <<NODE
const { execSync } = require("child_process");
const port = "${port}";
try {
  execSync(
    \`powershell -NoProfile -Command "\$p = @(Get-NetTCPConnection -LocalPort \${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach (\$x in \$p) { if (\$x -and \$x -ne 0) { Stop-Process -Id \$x -Force -ErrorAction SilentlyContinue } }"\`,
    { stdio: "ignore", windowsHide: true },
  );
} catch {
  /* ignore */
}
NODE
  sleep 1
}

site10_reclaim_ports() {
  site10_reclaim_port "${PLAYWRIGHT_API_PORT}"
  site10_reclaim_port "${SITE10_FE_PORT}"
  sleep 1
}

site10_curl_code() {
  local url="$1"
  local max_time="${2:-30}"
  curl -sS -o /dev/null -w "%{http_code}" --max-time "$max_time" "$url" 2>/dev/null || echo "000"
}

site10_api_health_ok() {
  [[ "$(site10_curl_code "${SITE10_API_BASE}/health" 15)" == "200" ]]
}

site10_fe_shell_health_ok() {
  local path max_time code
  for path in "/" "/traveltrust" "/meta"; do
    max_time=25
    [[ "$path" == "/traveltrust" ]] && max_time=90
    [[ "$path" == "/meta" ]] && max_time=120
    code="$(site10_curl_code "${SITE10_FE_BASE}${path}" "$max_time")"
    [[ "$code" == "200" ]] || return 1
  done
  return 0
}

# HMR / _not-found 编译窗口内 /traveltrust 可能短暂 404 — 重试而非立即 FAIL
site10_fe_shell_health_ok_retry() {
  local attempt max="${SITE10_FE_HEALTH_MAX_ATTEMPTS:-6}"
  for ((attempt = 1; attempt <= max; attempt++)); do
    if site10_fe_shell_health_ok; then
      return 0
    fi
    if [[ "$attempt" -lt "$max" ]]; then
      site10_log "TT_SITE10_FE_HEALTH: retry ${attempt}/${max} (HMR / compile tolerance)"
      sleep "${SITE10_POLL_INTERVAL_SEC}"
    fi
  done
  return 1
}

# FE/BE 双健康门禁（preflight · spec 前 · restart 后）
site10_dual_health_gate() {
  if ! site10_api_health_ok; then
    site10_fail_loud "TT_SITE10_DUAL_HEALTH" "API /health not 200 on :${PLAYWRIGHT_API_PORT}"
  fi
  if ! site10_fe_shell_health_ok_retry; then
    site10_fail_loud "TT_SITE10_DUAL_HEALTH" "Next shell not ready on :${SITE10_FE_PORT} (/, /traveltrust, /meta)"
  fi
  site10_log "TT_SITE10_DUAL_HEALTH: OK (API :${PLAYWRIGHT_API_PORT} · Next :${SITE10_FE_PORT})"
  return 0
}

site10_port_listen_pids() {
  local port="$1"
  powershell -NoProfile -Command \
    "\$p = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { \$_ -and \$_ -ne 0 }); if (\$p) { \$p -join ' ' }" \
    2>/dev/null | tr -d '\r' || true
}

site10_stop_fe() {
  if [[ -n "${FE_PID:-}" ]] && kill -0 "$FE_PID" 2>/dev/null; then
    kill "$FE_PID" 2>/dev/null || true
    wait "$FE_PID" 2>/dev/null || true
  fi
  FE_PID=""
  site10_reclaim_port "${SITE10_FE_PORT}"
}

site10_stop_api() {
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM traveltrust-api.exe >/dev/null 2>&1 || true
  fi
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  API_PID=""
  site10_reclaim_port "${PLAYWRIGHT_API_PORT}"
}

site10_start_api() {
  site10_log "== site10: starting API on :${PLAYWRIGHT_API_PORT} =="
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM traveltrust-api.exe >/dev/null 2>&1 || true
  fi
  site10_reclaim_port "${PLAYWRIGHT_API_PORT}"
  : >"$SITE10_API_LOG"
  (
    cd "$ROOT"
    export PORT="${PLAYWRIGHT_API_PORT}"
    export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT}"
    bash scripts/dev/start-api-for-playwright.sh
  ) >>"$SITE10_API_LOG" 2>&1 &
  API_PID=$!
  export API_PID

  local poll
  for poll in $(seq 1 "$SITE10_API_READY_MAX_POLLS"); do
    if site10_api_health_ok; then
      site10_log "TT_SITE10_API_START: OK pid=${API_PID} port=${PLAYWRIGHT_API_PORT} poll=${poll}"
      return 0
    fi
    if ! kill -0 "$API_PID" 2>/dev/null; then
      site10_fail_loud "TT_SITE10_API_START" "process pid=${API_PID} exited before /health (poll=${poll})"
    fi
    sleep "$SITE10_POLL_INTERVAL_SEC"
  done
  site10_fail_loud "TT_SITE10_API_START" "health timeout after ${SITE10_API_READY_MAX_POLLS} polls"
}

site10_start_fe() {
  local attempt="${1:-1}"
  site10_log "== site10: starting Next on :${SITE10_FE_PORT} (attempt ${attempt}) =="
  site10_stop_fe
  sleep 1

  if [[ "$attempt" == "1" ]]; then
    : >"$SITE10_FE_LOG"
  fi

  (
    cd "$ROOT/frontend"
    export FRONTEND_PORT="${SITE10_FE_PORT}"
    export TRAVELTRUST_FRONTEND_PORT="${SITE10_FE_PORT}"
    export NEXT_PUBLIC_API_BASE_URL="${SITE10_API_BASE}"
    export PORT=""
    # 直接 node 入口 · 避免 npm 包装进程早退导致 FE_PID 误判
    exec node ./scripts/run-dev.mjs
  ) >>"$SITE10_FE_LOG" 2>&1 &
  FE_PID=$!
  export FE_PID

  local poll listen_pids
  for poll in $(seq 1 "$SITE10_FE_READY_MAX_POLLS"); do
    if ! kill -0 "$FE_PID" 2>/dev/null; then
      local wait_rc=0
      wait "$FE_PID" 2>/dev/null || wait_rc=$?
      site10_fail_loud "TT_SITE10_FE_START" "node pid=${FE_PID} exited before ready (poll=${poll} wait_rc=${wait_rc})"
    fi
    listen_pids="$(site10_port_listen_pids "${SITE10_FE_PORT}")"
    if [[ -n "$listen_pids" ]] && site10_fe_shell_health_ok; then
      site10_log "TT_SITE10_FE_START: OK pid=${FE_PID} listen_pids=${listen_pids} port=${SITE10_FE_PORT} poll=${poll}"
      return 0
    fi
    sleep "$SITE10_POLL_INTERVAL_SEC"
  done
  site10_fail_loud "TT_SITE10_FE_START" "ready timeout after ${SITE10_FE_READY_MAX_POLLS} polls (listen=$(site10_port_listen_pids "${SITE10_FE_PORT}"))"
}

site10_verify_api_trigger_chain() {
  local code
  if ! site10_api_health_ok; then
    site10_log "site10: API trigger chain FAIL — /health" >&2
    return 1
  fi
  code="$(site10_curl_code "${SITE10_API_BASE}/meta" 120)"
  if [[ "$code" != "200" ]]; then
    site10_log "site10: API trigger chain FAIL — GET /meta HTTP $code" >&2
    return 1
  fi
  code="$(site10_curl_code "${SITE10_FE_BASE}/meta" 120)"
  if [[ "$code" != "200" ]]; then
    site10_log "site10: API trigger chain FAIL — Next /meta rewrite HTTP $code" >&2
    return 1
  fi
  code="$(site10_curl_code "${SITE10_API_BASE}/api/v1/traveltrust/page-brief" 45)"
  if [[ "$code" != "200" ]]; then
    site10_log "site10: API trigger chain FAIL — page-brief HTTP $code" >&2
    return 1
  fi
  site10_log "== site10: API trigger chain OK (health/meta/page-brief) =="
  return 0
}

site10_restart_fe_mandatory() {
  site10_log "== site10: mandatory Next :${SITE10_FE_PORT} restart (API pid=${API_PID:-?} unchanged) =="
  local attempt
  for attempt in $(seq 1 "$SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS"); do
    if site10_start_fe "$attempt" \
      && site10_dual_health_gate \
      && site10_verify_api_trigger_chain; then
      return 0
    fi
    site10_log "TT_SITE10_FE_RESTART: retry attempt ${attempt}/${SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS}" >&2
    sleep 3
  done
  site10_fail_loud "TT_SITE10_FE_RESTART" "failed after ${SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS} attempts"
}

site10_ensure_api_health() {
  if site10_api_health_ok; then
    return 0
  fi
  site10_log "== site10: API :${PLAYWRIGHT_API_PORT} down — restarting (Next pid=${FE_PID:-?}) =="
  site10_stop_api
  site10_start_api
}

site10_ensure_fe_health() {
  if site10_fe_shell_health_ok; then
    return 0
  fi
  site10_restart_fe_mandatory
}

site10_bootstrap_stack() {
  local attempt
  site10_log "== site10: reclaim ${PLAYWRIGHT_API_PORT}/${SITE10_FE_PORT} then bootstrap stack =="
  for attempt in $(seq 1 "$SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS"); do
    site10_log "== site10: bootstrap attempt ${attempt}/${SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS} =="
    site10_reclaim_ports
    if ! site10_start_api; then
      site10_stop_api
      sleep 3
      continue
    fi
    if ! site10_start_fe "$attempt"; then
      site10_stop_fe
      site10_stop_api
      sleep 3
      continue
    fi
    if ! site10_dual_health_gate; then
      site10_stop_fe
      site10_stop_api
      sleep 3
      continue
    fi
    if ! site10_verify_api_trigger_chain; then
      site10_stop_fe
      site10_stop_api
      sleep 3
      continue
    fi
    site10_log "== site10: API warm on :${PLAYWRIGHT_API_PORT} (pid=${API_PID}) =="
    site10_log "== site10: Next warm on :${SITE10_FE_PORT} (pid=${FE_PID}) =="
    site10_log "TT_SITE10_STACK_BOOTSTRAP: OK"
    return 0
  done
  site10_fail_loud "TT_SITE10_STACK_BOOTSTRAP" "failed after ${SITE10_STACK_BOOTSTRAP_MAX_ATTEMPTS} attempts"
}

site10_cleanup_stack() {
  site10_stop_fe
  site10_stop_api
  site10_reclaim_ports
}
