#!/usr/bin/env bash
# TT-WEB-STAGING · Fly/Registry 代理与 push 恢复（被 tt-web-staging-*-deploy.sh source）
set -euo pipefail

STAGING_FLY_PROXY_DEFAULT="${STAGING_FLY_PROXY_DEFAULT:-http://127.0.0.1:15715}"
STAGING_FLY_APP="${FLY_STAGING_WEB_APP:-tt-web-staging}"
STAGING_FLY_REGISTRY="registry.fly.io/${STAGING_FLY_APP}"
STAGING_FLY_REPO_ROOT="${STAGING_FLY_REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"

staging_fly_info() { echo "staging-fly: $*"; }
staging_fly_fail() { echo "staging-fly: FAIL $*" >&2; exit 1; }

staging_fly_apply_proxy() {
  if curl -sS -o /dev/null --connect-timeout 5 --max-time 12 https://api.fly.io 2>/dev/null; then
    unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy 2>/dev/null || true
    staging_fly_info "direct route to api.fly.io OK — not forcing shell proxy"
    return 0
  fi
  if [[ -n "${HTTPS_PROXY:-}" || -n "${https_proxy:-}" ]]; then
    export HTTP_PROXY="${HTTP_PROXY:-${HTTPS_PROXY:-${https_proxy}}}"
    export HTTPS_PROXY="${HTTPS_PROXY:-${HTTP_PROXY}}"
    staging_fly_info "proxy already set HTTPS_PROXY=$HTTPS_PROXY"
    return 0
  fi
  if curl -sS -o /dev/null --connect-timeout 3 --max-time 8 \
    -x "$STAGING_FLY_PROXY_DEFAULT" https://api.fly.io 2>/dev/null; then
    export HTTP_PROXY="$STAGING_FLY_PROXY_DEFAULT"
    export HTTPS_PROXY="$STAGING_FLY_PROXY_DEFAULT"
    export ALL_PROXY="${ALL_PROXY:-socks5://127.0.0.1:15715}"
    export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,::1}"
    staging_fly_info "using HTTPS_PROXY=$HTTPS_PROXY NO_PROXY=$NO_PROXY"
    return 0
  fi
  staging_fly_fail "neither direct nor ${STAGING_FLY_PROXY_DEFAULT} proxy reaches api.fly.io"
}

staging_fly_curl() {
  local url="$1"
  if curl -sS -o /dev/null -w '' --connect-timeout 8 --max-time 20 "$url" 2>/dev/null; then
    return 0
  fi
  if [[ -n "${HTTPS_PROXY:-}" ]]; then
    curl -sS -o /dev/null -w '' --connect-timeout 8 --max-time 20 -x "$HTTPS_PROXY" "$url"
    return $?
  fi
  return 1
}

staging_fly_verify_proxy_stable() {
  local tries="${STAGING_FLY_PROXY_TRIES:-3}"
  local i label url
  for i in $(seq 1 "$tries"); do
    local ok=1
    for pair in \
      "Fly API|https://api.fly.io" \
      "Fly registry|https://registry.fly.io/v2/" \
      "Staging web|https://tt-web-staging.fly.dev/" \
    ; do
      label="${pair%%|*}"
      url="${pair#*|}"
      if ! staging_fly_curl "$url" 2>/dev/null; then
        staging_fly_info "proxy check $i/$tries: $label FAIL ($url)"
        ok=0
        break
      fi
      staging_fly_info "proxy check $i/$tries: $label OK"
    done
    [[ "$ok" == "1" ]] && return 0
    sleep 3
  done
  staging_fly_fail "proxy unstable after ${tries} rounds — fix 小地球仪 then retry"
}

staging_fly_stop_parallel_deploys() {
  staging_fly_info "stopping parallel fly/deploy (best-effort) …"
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //IM fly.exe 2>/dev/null || true
    taskkill //F //IM flyctl.exe 2>/dev/null || true
  fi
  pkill -f "fly deploy.*tt-web-staging" 2>/dev/null || true
  pkill -f "deploy-tt-web-staging" 2>/dev/null || true
  pkill -f "tt-web-staging-" 2>/dev/null || true
  sleep 2
}

staging_fly_latest_local_image() {
  docker images "registry.fly.io/${STAGING_FLY_APP}" \
    --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | head -1
}

staging_fly_fly_auth_docker() {
  staging_fly_info "fly auth docker (best-effort) …"
  if fly auth docker 2>&1; then
    return 0
  fi
  staging_fly_info "fly auth docker failed — will use fly deploy --local-only --image for push+auth"
  return 1
}

staging_fly_push_via_fly_deploy() {
  local image="$1"
  local max="${FLY_WEB_PUSH_RETRIES:-5}"
  local n=1
  local fly_config="${FLY_CONFIG:-$ROOT/frontend/fly.staging.toml}"
  while [[ "$n" -le "$max" ]]; do
    staging_fly_info "fly deploy --local-only --image attempt ${n}/${max}: ${image}"
    if (cd "$STAGING_FLY_REPO_ROOT/frontend" && fly deploy -c fly.staging.toml -a "$STAGING_FLY_APP" --local-only --image "$image" --ha=false); then
      staging_fly_info "fly deploy --local-only --image OK"
      return 0
    fi
    staging_fly_info "fly deploy push failed — sleep 25s, re-probe network …"
    staging_fly_verify_proxy_stable
    n=$((n + 1))
    sleep 25
  done
  staging_fly_fail "fly deploy --local-only --image failed after ${max} attempts"
}

staging_fly_push_image_with_retry() {
  local image="$1"
  staging_fly_fly_auth_docker || true
  if docker push "$image" 2>/dev/null; then
    staging_fly_info "docker push OK"
    return 0
  fi
  staging_fly_info "docker push failed — fallback fly deploy --local-only --image"
  staging_fly_push_via_fly_deploy "$image"
}
