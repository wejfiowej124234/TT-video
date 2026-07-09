#!/usr/bin/env bash
# Phase ③ · 部署 tt-web-prod（Fly · Next.js standalone · 基础设施）
#
#   bash scripts/dev/deploy-tt-web-production.sh
#   bash scripts/dev/deploy-tt-web-production.sh --check-only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="${FLY_PROD_WEB_APP:-tt-web-prod}"
FLY_CONFIG="${FLY_PROD_WEB_CONFIG:-fly.production.toml}"
BUILD_ENV="${PROD_WEB_BUILD_ENV:-$ROOT/deploy/fly/tt-web-prod/build.env.local}"
BUILD_EXAMPLE="$ROOT/deploy/fly/tt-web-prod/build.env.example"
API_BASE="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
WEB_BASE="${PROD_WEB_BASE:-https://${APP}.fly.dev}"

fail() { echo "deploy-tt-web-production: FAIL $*" >&2; exit 2; }
ok() { echo "deploy-tt-web-production: OK $*"; }

CHECK_ONLY=0
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=1

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$ROOT/frontend/$FLY_CONFIG" ]] || fail "missing $ROOT/frontend/$FLY_CONFIG"

if [[ ! -f "$BUILD_ENV" ]]; then
  echo "deploy-tt-web-production: seeding $BUILD_ENV from example"
  mkdir -p "$(dirname "$BUILD_ENV")"
  cp "$BUILD_EXAMPLE" "$BUILD_ENV"
  fail "edit $BUILD_ENV with prod domains then re-run"
fi

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    export "${line%%=*}=${line#*=}"
  done <"$f"
}
merge_env "$BUILD_ENV"

[[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]] || fail "NEXT_PUBLIC_API_BASE_URL required in build.env.local"
[[ "$NEXT_PUBLIC_API_BASE_URL" != *example.com* ]] || fail "replace example.com in build.env.local"

export TRAVELTRUST_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL}"

if [[ "$CHECK_ONLY" == "1" ]]; then
  ok "check-only · API=${NEXT_PUBLIC_API_BASE_URL} WEB=${NEXT_PUBLIC_SITE_URL:-$WEB_BASE}"
  exit 0
fi

fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

declare -a BUILD_ARGS=(
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
  --build-arg "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-$WEB_BASE}"
  --build-arg "API_REWRITE_TARGET=${API_REWRITE_TARGET:-$NEXT_PUBLIC_API_BASE_URL}"
  --build-arg "NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID:-11155111}"
  --build-arg "NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL:-https://sepolia.drpc.org}"
  --build-arg "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS:-}"
  --build-arg "NEXT_PUBLIC_FEE_ROUTER_ADDRESS=${NEXT_PUBLIC_FEE_ROUTER_ADDRESS:-}"
  --build-arg "NEXT_PUBLIC_GOVERNOR_ADDRESS=${NEXT_PUBLIC_GOVERNOR_ADDRESS:-}"
  --build-arg "NEXT_PUBLIC_REGISTRY_ADDRESS=${NEXT_PUBLIC_REGISTRY_ADDRESS:-}"
  --build-arg "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=${NEXT_PUBLIC_GUIDE_STAKING_ADDRESS:-}"
  --build-arg "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS=${NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS:-}"
  --build-arg "BUILD_NODE_MAX_OLD_SPACE_SIZE=${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}"
)

DEPLOY_EXTRA=()
if [[ "${FLY_WEB_REMOTE_BUILD:-}" == "1" ]]; then
  ok "using Fly remote builder (FLY_WEB_REMOTE_BUILD=1)"
  if [[ "${FLY_WEB_DEPOT:-1}" == "0" ]]; then
    DEPLOY_EXTRA+=(--depot=false)
  fi
else
  ok "using --local-only (set FLY_WEB_REMOTE_BUILD=1 if local Docker fails)"
  DEPLOY_EXTRA+=(--local-only)
fi

(cd "$ROOT/frontend" && fly deploy -c "$FLY_CONFIG" -a "$APP" \
  "${DEPLOY_EXTRA[@]}" \
  "${BUILD_ARGS[@]}")

hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${WEB_BASE%/}/" 2>/dev/null || echo 000)"
[[ "$hc" == "200" || "$hc" == "307" || "$hc" == "308" ]] || fail "${WEB_BASE} not reachable (got $hc)"

ok "$APP deployed · ${WEB_BASE}"
