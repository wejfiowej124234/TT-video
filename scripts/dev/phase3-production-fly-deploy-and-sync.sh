#!/usr/bin/env bash
# Phase ③ · Production API deploy + secrets 同步（基础设施 · 无业务代码变更）
#
# 前置：fly auth login · tt-traveltrust-prod PG 已创建 · .env.production.local 已填
#
#   bash scripts/dev/phase3-production-fly-deploy-and-sync.sh
#   bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="${FLY_PROD_API_APP:-tt-api-prod}"
FLY_CONFIG="${FLY_PROD_API_CONFIG:-$ROOT/deploy/fly/tt-api-prod/fly.toml}"
PROD_ENV="${PROD_ENV_FILE:-$ROOT/scripts/dev/.env.production.local}"
WEB_BASE="${PROD_WEB_BASE:-}"

fail() { echo "phase3-production-fly-deploy-and-sync: FAIL $*" >&2; exit 2; }
ok() { echo "phase3-production-fly-deploy-and-sync: OK $*"; }

SECRETS_ONLY=0
[[ "${1:-}" == "--secrets-only" ]] && SECRETS_ONLY=1

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG"
[[ -f "$PROD_ENV" ]] || fail "missing $PROD_ENV — cp scripts/dev/.env.production.example"

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
  done <"$f"
}

merge_env "$PROD_ENV"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

# Production hard gates
[[ "${SEED_TEST_ACCOUNTS:-0}" == "0" ]] || fail "SEED_TEST_ACCOUNTS must be 0 for prod"
[[ -z "${P3_CHAIN_OFF:-}" || "${P3_CHAIN_OFF:-}" == "0" ]] || fail "P3_CHAIN_OFF must be unset for prod"
[[ -n "${CORS_ORIGINS:-}" ]] || fail "CORS_ORIGINS required for prod"
[[ -n "${INTERNAL_API_SECRET:-}" ]] || fail "INTERNAL_API_SECRET required for prod"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL required for prod"

declare -a FLY_SET=()
add_secret() {
  local k="$1" v="${2:-}"
  [[ -n "$v" && "$v" != *"..."* ]] || return 0
  FLY_SET+=("${k}=${v}")
}

add_secret DATABASE_URL "${DATABASE_URL:-}"
add_secret INTERNAL_API_SECRET "${INTERNAL_API_SECRET:-}"
add_secret CORS_ORIGINS "${CORS_ORIGINS:-}"
add_secret SEED_TEST_ACCOUNTS "0"
add_secret PUBLIC_API_BASE_URL "${PUBLIC_API_BASE_URL:-${PROD_API_BASE:-}}"

for k in CHAIN_RPC_URL CHAIN_ID ESCROW_FACTORY_ADDRESS FEE_ROUTER_ADDRESS REGION_VAULT_ADDRESS \
  REGISTRY_ADDRESS GOVERNOR_ADDRESS GOVERNANCE_TOKEN_ADDRESS GUIDE_STAKING_POOL_ADDRESS \
  PROVIDER_STAKING_POOL_ADDRESS STRICT_SSOT SSOT_VERSION SSOT_SHA256 CHARGEBACK_POLICY \
  STRICT_SESSION_GATE REQUIRE_IDEMPOTENCY_KEY FINALITY_N \
  TRAVELTRUST_STRIPE_SECRET_KEY TRAVELTRUST_STRIPE_WEBHOOK_SECRET TRAVELTRUST_ONBOARDING_STRIPE_ENABLED; do
  add_secret "$k" "${!k:-}"
done

[[ ${#FLY_SET[@]} -gt 0 ]] || fail "no secrets to set"

echo "phase3-production-fly-deploy-and-sync: fly secrets set (${#FLY_SET[@]} keys) on $APP ..."
fly secrets set "${FLY_SET[@]}" -a "$APP"

if [[ "$SECRETS_ONLY" != "1" ]]; then
  fly deploy -c "$FLY_CONFIG" \
    --build-arg "TRAVELTRUST_BUILD_GIT_SHA=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo local)" \
    -a "$APP"
fi

BASE="${PROD_API_BASE:-https://${APP}.fly.dev}"
hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${BASE%/}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "${BASE}/health not 200 (got $hc)"

ok "$APP · ${BASE}/health=200"
