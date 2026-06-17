#!/usr/bin/env bash
# TT-WEB-STAGING-SINGLE-BUILD — 仅本地 Docker 构建 · 禁 Depot/远程 · settings 200 后继续 P2HA staging sprint
#
#   export HTTPS_PROXY=http://127.0.0.1:15715
#   bash scripts/dev/tt-web-staging-single-build-deploy.sh
#
# 可选：
#   SKIP_DOCKER_MEM_CHECK=1        跳过 ≥12GB 内存闸（不推荐）
#   CONTINUE_IDENTITY_P2_SPRINT=1  默认 1 · settings 200 后跑 staging sprint
#   MIN_DOCKER_MEMORY_GB=12
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
SETTINGS_PATH="/me/identities/guide/settings"
MIN_GB="${MIN_DOCKER_MEMORY_GB:-12}"
LOG="$ROOT/evidence/tmp-tt-web-staging-single-build.log"
CONTINUE_SPRINT="${CONTINUE_IDENTITY_P2_SPRINT:-1}"

fail() { echo "tt-web-staging-single-build: FAIL $*" >&2; exit 1; }
ok() { echo "tt-web-staging-single-build: OK $*"; }
info() { echo "tt-web-staging-single-build: $*"; }

if [[ -z "${HTTPS_PROXY:-}" && -z "${https_proxy:-}" ]]; then
  if curl -sS -o /dev/null --connect-timeout 2 --max-time 4 -x "http://127.0.0.1:15715" https://api.fly.io 2>/dev/null; then
    export HTTPS_PROXY="http://127.0.0.1:15715"
    export HTTP_PROXY="$HTTPS_PROXY"
    export ALL_PROXY="${ALL_PROXY:-socks5://127.0.0.1:15715}"
    info "using HTTPS_PROXY=$HTTPS_PROXY"
  fi
fi

stop_parallel_builds() {
  info "stopping parallel fly deploy / Depot / local docker build (best-effort) …"
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM fly.exe 2>/dev/null || true
    taskkill //F //IM flyctl.exe 2>/dev/null || true
  fi
  pkill -f "fly deploy.*tt-web-staging" 2>/dev/null || true
  pkill -f "deploy-tt-web-staging" 2>/dev/null || true
  pkill -f "tt-web-staging-oom-fix" 2>/dev/null || true
  pkill -f "tt-web-staging-push-recovery" 2>/dev/null || true
  sleep 2
}

check_docker_memory_gb() {
  [[ "${SKIP_DOCKER_MEM_CHECK:-}" == "1" ]] && { info "SKIP_DOCKER_MEM_CHECK=1"; return 0; }
  command -v docker >/dev/null 2>&1 || fail "Docker not found — start Docker Desktop"
  docker info >/dev/null 2>&1 || fail "Docker daemon not running — start Docker Desktop"

  local mem_bytes mem_gb
  mem_bytes="$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo 0)"
  if [[ -z "$mem_bytes" || "$mem_bytes" == "0" || "$mem_bytes" == "<no value>" ]]; then
    mem_bytes="$(docker info 2>/dev/null | awk -F': ' '/Total Memory/ {gsub(/[^0-9.]/,"",$2); print $2; exit}')"
    if [[ "$mem_bytes" =~ GiB$|GB$ ]]; then
      mem_gb="${mem_bytes%% *}"
    else
      info "WARN: could not parse Docker MemTotal — set Docker Desktop → Resources → Memory ≥ ${MIN_GB}GB manually"
      return 0
    fi
  else
    mem_gb="$(awk -v b="$mem_bytes" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"
  fi

  info "Docker total memory ≈ ${mem_gb} GB (require ≥ ${MIN_GB} GB)"
  awk -v g="$mem_gb" -v m="$MIN_GB" 'BEGIN { if (g+0 < m+0) exit 1 }' \
    || fail "Docker memory ${mem_gb}GB < ${MIN_GB}GB — Docker Desktop → Settings → Resources → Memory ≥ ${MIN_GB}GB"
  ok "Docker memory gate ≥ ${MIN_GB}GB"
}

wait_settings_200() {
  local i code
  for i in $(seq 1 30); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 12 --max-time 30 "${WEB_BASE}${SETTINGS_PATH}" 2>/dev/null || echo 000)"
    if [[ "$code" == "200" ]]; then
      ok "${WEB_BASE}${SETTINGS_PATH} → HTTP 200"
      return 0
    fi
    info "settings HTTP ${code} — wait ${i}/30 (cold start / propagate) …"
    sleep 10
  done
  fail "${SETTINGS_PATH} still not HTTP 200 after deploy"
}

{
  echo "TT_WEB_STAGING_SINGLE_BUILD: START $(date -u +%Y%m%dT%H%M%SZ)"
  stop_parallel_builds
  check_docker_memory_gb

  phase2_require_staging_deploy_allowed "$ROOT" || exit 3
  export TESTNET_FREEZE_OVERRIDE=1
  export FLY_WEB_REMOTE_BUILD=0
  unset FLY_WEB_OOM_FIX
  export BUILD_NODE_MAX_OLD_SPACE_SIZE="${BUILD_NODE_MAX_OLD_SPACE_SIZE:-6144}"
  export FLY_WEB_NO_CACHE="${FLY_WEB_NO_CACHE:-1}"

  info "local-only deploy (BUILD_NODE_MAX_OLD_SPACE_SIZE=${BUILD_NODE_MAX_OLD_SPACE_SIZE}MB) …"
  bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"

  wait_settings_200

  echo "TT_WEB_STAGING_SINGLE_BUILD: OK"

  if [[ "$CONTINUE_SPRINT" == "1" ]]; then
    echo ""
    echo "== Phase2 Human Acceptance Staging Sprint (IDENTITY_P2_SKIP_DEPLOY=1) =="
    export IDENTITY_P2_SKIP_DEPLOY=1
    bash "$ROOT/scripts/dev/record-phase2-human-acceptance-staging-sprint-evidence.sh"
  fi
} 2>&1 | tee "$LOG"

grep -q "TT_WEB_STAGING_SINGLE_BUILD: OK" "$LOG" || exit 1
exit 0
