#!/usr/bin/env bash
# Phase ②/③ · 部署 tt-web-staging（Fly · Next.js standalone）
#
# 前置：fly auth login · 可访问 api.fly.io（必要时 export HTTPS_PROXY=…）
#
#   bash scripts/dev/deploy-tt-web-staging.sh
#   bash scripts/dev/deploy-tt-web-staging.sh --check-only   # 仅对拍，不 deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="${FLY_STAGING_WEB_APP:-tt-web-staging}"
FLY_CONFIG="${FLY_STAGING_WEB_CONFIG:-$ROOT/frontend/fly.staging.toml}"
BUILD_ENV="${STAGING_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-staging/build.env.local}"
BUILD_EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"
API_APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="${STAGING_API_BASE:-https://${API_APP}.fly.dev}"
WEB_BASE="${STAGING_WEB_BASE:-https://${APP}.fly.dev}"

fail() { echo "deploy-tt-web-staging: FAIL $*" >&2; exit 2; }
ok() { echo "deploy-tt-web-staging: OK $*"; }
info() { echo "deploy-tt-web-staging: $*"; }

CHECK_ONLY=0
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=1

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG"

if [[ ! -f "$BUILD_ENV" ]]; then
  info "missing $BUILD_ENV — seeding from build.env.example"
  cp "$BUILD_EXAMPLE" "$BUILD_ENV"
fi

merge_env() {
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

merge_env "$BUILD_ENV"

# registry JSON 须在 Docker build context（frontend/）内
node "$ROOT/frontend/scripts/sync-registry-for-build.mjs"

# 从 staging onboarding 补全 Sepolia 地址（若 build.env 未填）
ONBOARDING="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
merge_env "$ONBOARDING"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$API_BASE}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-$WEB_BASE}"
export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$API_BASE}"
export NEXT_PUBLIC_CHAIN_ID="${NEXT_PUBLIC_CHAIN_ID:-11155111}"
export NEXT_PUBLIC_RPC_URL="${NEXT_PUBLIC_RPC_URL:-https://sepolia.drpc.org}"
export NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS="${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS:-${ESCROW_FACTORY_ADDRESS:-}}"
export NEXT_PUBLIC_FEE_ROUTER_ADDRESS="${NEXT_PUBLIC_FEE_ROUTER_ADDRESS:-${FEE_ROUTER_ADDRESS:-}}"
export NEXT_PUBLIC_GOVERNOR_ADDRESS="${NEXT_PUBLIC_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
export NEXT_PUBLIC_REGISTRY_ADDRESS="${NEXT_PUBLIC_REGISTRY_ADDRESS:-${REGISTRY_ADDRESS:-}}"
export NEXT_PUBLIC_GUIDE_STAKING_ADDRESS="${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS:-${GUIDE_STAKING_POOL_ADDRESS:-}}"
export NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS="${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS:-${PROVIDER_STAKING_POOL_ADDRESS:-}}"

[[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]] || fail "NEXT_PUBLIC_API_BASE_URL empty"
[[ -n "${NEXT_PUBLIC_SITE_URL:-}" ]] || fail "NEXT_PUBLIC_SITE_URL empty"

info "preflight alignment (non-blocking) …"
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  --web-base "$WEB_BASE" \
  --api-base "$NEXT_PUBLIC_API_BASE_URL" \
  --chain-id "$NEXT_PUBLIC_CHAIN_ID" || true

if [[ "$CHECK_ONLY" == "1" ]]; then
  ok "check-only · no deploy"
  exit 0
fi

fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated — run: fly auth login"

if ! fly status -a "$APP" >/dev/null 2>&1; then
  info "creating Fly app $APP …"
  fly apps create "$APP" --org personal 2>/dev/null || fly apps create "$APP" 2>/dev/null || true
  fly status -a "$APP" >/dev/null 2>&1 || fail "Fly app $APP missing — run: fly apps create $APP"
fi

declare -a BUILD_ARGS=(
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
  --build-arg "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
  --build-arg "API_REWRITE_TARGET=${API_REWRITE_TARGET}"
  --build-arg "NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}"
  --build-arg "NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}"
  --build-arg "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS}"
  --build-arg "NEXT_PUBLIC_FEE_ROUTER_ADDRESS=${NEXT_PUBLIC_FEE_ROUTER_ADDRESS}"
  --build-arg "NEXT_PUBLIC_GOVERNOR_ADDRESS=${NEXT_PUBLIC_GOVERNOR_ADDRESS}"
  --build-arg "NEXT_PUBLIC_REGISTRY_ADDRESS=${NEXT_PUBLIC_REGISTRY_ADDRESS}"
  --build-arg "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS}"
  --build-arg "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS=${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS}"
)

info "fly deploy $APP (config=$FLY_CONFIG) …"
DEPLOY_EXTRA=()
if [[ "${FLY_WEB_REMOTE_BUILD:-}" != "1" ]]; then
  info "using --local-only (Depot 易 OOM；远程构建设 FLY_WEB_REMOTE_BUILD=1)"
  DEPLOY_EXTRA+=(--local-only)
fi
if [[ "${FLY_WEB_NO_CACHE:-}" == "1" ]]; then
  info "FLY_WEB_NO_CACHE=1 — bust Docker builder cache (local uncommitted admin/smoke fixes)"
  DEPLOY_EXTRA+=(--no-cache)
fi
(cd "$ROOT/frontend" && fly deploy -c fly.staging.toml -a "$APP" "${DEPLOY_EXTRA[@]}" "${BUILD_ARGS[@]}")

hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 60 "${WEB_BASE}/" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "${WEB_BASE}/ not 200 (got $hc) — DNS 传播或首次冷启动可能需重试"

ok "$APP deployed · ${WEB_BASE} · staging UI only · ≠ Production GO"
