#!/usr/bin/env bash
# P0-02 · Fly tt-api-staging 部署 + secrets 同步（Stripe + Sepolia · 无 PRIVATE_KEY）
#
# 前置：fly auth login · 本机可访问 https://api.fly.io
#
#   bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
#   bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh --secrets-only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
# shellcheck source=../ops/lib/deployment-three-state-lib.sh
source "$ROOT/scripts/ops/lib/deployment-three-state-lib.sh"
deployment_three_state_assert_fly_allowed

FREEZE="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
if [[ -f "$FREEZE" && "${TESTNET_FREEZE_OVERRIDE:-}" != "1" ]]; then
  echo "phase2-staging-fly-deploy-and-sync: BLOCKED — testnet staging freeze active ($FREEZE)" >&2
  exit 2
fi
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
FLY_CONFIG="${FLY_STAGING_API_CONFIG:-$ROOT/deploy/fly/tt-api-staging/fly.toml}"
ONBOARDING="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
SECRETS="${STAGING_SECRETS_FILE:-$ROOT/scripts/dev/.env.staging-secrets.local}"
CHAIN_ENV="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
CANONICAL_BASE="https://${APP}.fly.dev"

fail() { echo "phase2-staging-fly-deploy-and-sync: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-staging-fly-deploy-and-sync: OK $*"; }

SECRETS_ONLY=0
[[ "${1:-}" == "--secrets-only" ]] && SECRETS_ONLY=1

# shellcheck source=../ops/lib/deploy-governance-phase3-guard.sh
source "$ROOT/scripts/ops/lib/deploy-governance-phase3-guard.sh"
if [[ "$SECRETS_ONLY" -eq 1 ]]; then
  deploy_governance_phase3_assert_s5_allowed "$ROOT" --secrets-only
else
  deploy_governance_phase3_assert_s5_allowed "$ROOT"
fi

# shellcheck source=lib/staging-rc-baseline-gate.sh
source "$ROOT/scripts/dev/lib/staging-rc-baseline-gate.sh"
if [[ "$SECRETS_ONLY" -ne 1 ]]; then
  staging_rc_baseline_gate_pre_deploy pre-deploy || fail "TT_STAGING_RC_BASELINE gate"
fi

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG"

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

bash "$ROOT/scripts/dev/phase2-staging-merge-sepolia-env.sh"
merge_env "$ONBOARDING"
merge_env "$SECRETS"

fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated — run: fly auth login"

# Build secrets list (never deploy PRIVATE_KEY / Safe owner keys)
declare -a FLY_SET=()
add_secret() {
  local k="$1" v="${2:-}"
  [[ -n "$v" && "$v" != *"..."* ]] || return 0
  FLY_SET+=("${k}=${v}")
}

add_secret DATABASE_URL "${DATABASE_URL:-}"
add_secret INTERNAL_API_SECRET "${INTERNAL_API_SECRET:-}"
add_secret TRAVELTRUST_ONBOARDING_STRIPE_ENABLED "${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED:-1}"
add_secret TRAVELTRUST_STRIPE_SECRET_KEY "${TRAVELTRUST_STRIPE_SECRET_KEY:-}"
add_secret TRAVELTRUST_STRIPE_WEBHOOK_SECRET "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}"
add_secret SEED_TEST_ACCOUNTS "${SEED_TEST_ACCOUNTS:-1}"
add_secret TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET "${TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET:-0}"
WEB_ORIGIN="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
add_secret CORS_ORIGINS "${CORS_ORIGINS:-${WEB_ORIGIN},http://localhost:3012,http://127.0.0.1:3012}"

for k in CHAIN_RPC_URL CHAIN_ID TIMELOCK_ADDRESS GOVERNANCE_TOKEN_ADDRESS GOVERNANCE_VOTES_TOKEN_ADDRESS GOVERNOR_ADDRESS \
  ESCROW_FACTORY_ADDRESS FEE_ROUTER_ADDRESS REGISTRY_ADDRESS GUIDE_STAKING_ADDRESS STAKING_PROVIDER_ADDRESS \
  REGION_VAULT_ADDRESS TREASURY_ADDRESS \
  RESERVE_VAULT_ADDRESS GUIDE_STAKING_POOL_ADDRESS PROVIDER_STAKING_POOL_ADDRESS \
  REGION_STEWARD_STAKE_POOL_ADDRESS STAKING_ADDRESS REDEMPTION_ASSET_ADDRESS \
  COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS COUNTRY_POOL_LEDGER_PILOT_ADDRESS \
  COUNTRY_POOL_LEDGER_ADDRESS COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS FUND_STACK_TOKEN_ADDRESS; do
  add_secret "$k" "${!k:-}"
done
# PER-AUDIT3-S01: /meta guide_staking reads STAKING_ADDRESS then GUIDE_STAKING_ADDRESS (never steward pool)
if [[ -z "${GUIDE_STAKING_ADDRESS:-}" && -n "${GUIDE_STAKING_POOL_ADDRESS:-}" ]]; then
  add_secret GUIDE_STAKING_ADDRESS "${GUIDE_STAKING_POOL_ADDRESS}"
fi
if [[ -z "${STAKING_PROVIDER_ADDRESS:-}" && -n "${PROVIDER_STAKING_POOL_ADDRESS:-}" ]]; then
  add_secret STAKING_PROVIDER_ADDRESS "${PROVIDER_STAKING_POOL_ADDRESS}"
fi
if [[ -z "${REGISTRY_ADDRESS:-}" ]]; then
  reg_example="$(grep -E '^NEXT_PUBLIC_REGISTRY_ADDRESS=' "$ROOT/deploy/fly/tt-web-staging/build.env.example" 2>/dev/null | head -1 | cut -d= -f2- || true)"
  [[ -n "$reg_example" ]] && add_secret REGISTRY_ADDRESS "$reg_example"
fi
add_secret TRAVELTRUST_DEPLOYMENT_PROFILE "${TRAVELTRUST_DEPLOYMENT_PROFILE:-staging}"
# Runtime Attestation (Version Gate STRICT) — stamp before image start
_GIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo local)"
add_secret TRAVELTRUST_GIT_SHA "${TRAVELTRUST_GIT_SHA:-$_GIT_SHA}"
add_secret TRAVELTRUST_PSG_RELEASE_VERSION "${TRAVELTRUST_PSG_RELEASE_VERSION:-PSG-REL-20260720-WEB3-CAND-V2}"
add_secret TRAVELTRUST_CONTRACT_PROFILE "${TRAVELTRUST_CONTRACT_PROFILE:-v311_fund_safety_candidate_v2}"
add_secret TRAVELTRUST_ARTIFACT_SHA "${TRAVELTRUST_ARTIFACT_SHA:-${TT_ARTIFACT_SHA:-$_GIT_SHA}}"
add_secret TRAVELTRUST_IMAGE_DIGEST "${TRAVELTRUST_IMAGE_DIGEST:-${TT_RUNTIME_IMAGE_SHA:-gitsha:$_GIT_SHA}}"
add_secret TRAVELTRUST_BUILD_TIME "${TRAVELTRUST_BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
add_secret TRAVELTRUST_DEPLOYED_AT "${TRAVELTRUST_DEPLOYED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
add_secret TRAVELTRUST_DATABASE_BASELINE "${TRAVELTRUST_DATABASE_BASELINE:-staging_rc_ssot_alignment.v1#expected_staging_surface}"
add_secret TRAVELTRUST_CMS_BASELINE "${TRAVELTRUST_CMS_BASELINE:-public_display_10x4 + catalog_bake=1}"
if [[ -z "${STAKING_ADDRESS:-}" ]]; then
  if [[ -n "${GUIDE_STAKING_ADDRESS:-}" ]]; then
    add_secret STAKING_ADDRESS "${GUIDE_STAKING_ADDRESS}"
  elif [[ -n "${GUIDE_STAKING_POOL_ADDRESS:-}" ]]; then
    add_secret STAKING_ADDRESS "${GUIDE_STAKING_POOL_ADDRESS}"
  else
    guide_example="$(grep -E '^NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=' "$ROOT/deploy/fly/tt-web-staging/build.env.example" 2>/dev/null | head -1 | cut -d= -f2- || true)"
    [[ -n "$guide_example" ]] && add_secret STAKING_ADDRESS "$guide_example" && add_secret GUIDE_STAKING_ADDRESS "$guide_example"
  fi
fi
if [[ -z "${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}" && -n "${GOVERNANCE_TOKEN_ADDRESS:-}" ]]; then
  add_secret GOVERNANCE_VOTES_TOKEN_ADDRESS "${GOVERNANCE_TOKEN_ADDRESS}"
fi

[[ ${#FLY_SET[@]} -gt 0 ]] || fail "no secrets to set — fill onboarding/secrets env files"

echo "phase2-staging-fly-deploy-and-sync: fly secrets set (${#FLY_SET[@]} keys) on $APP ..."
fly secrets set "${FLY_SET[@]}" -a "$APP"

if [[ "$SECRETS_ONLY" != "1" ]]; then
  echo "phase2-staging-fly-deploy-and-sync: fly deploy ..."
  fly deploy -c "$FLY_CONFIG" \
    --build-arg "TRAVELTRUST_BUILD_GIT_SHA=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo local)" \
    -a "$APP"
fi

hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${CANONICAL_BASE}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "${CANONICAL_BASE}/health not 200 (got $hc)"

# Patch API_BASE in onboarding env
if grep -qE '^[[:space:]]*API_BASE=' "$ONBOARDING" 2>/dev/null; then
  sed -i.bak "s|^[[:space:]]*API_BASE=.*|API_BASE=${CANONICAL_BASE}|" "$ONBOARDING" && rm -f "${ONBOARDING}.bak"
else
  echo "API_BASE=${CANONICAL_BASE}" >>"$ONBOARDING"
fi

ok "$APP deployed · ${CANONICAL_BASE}/health=200 · API_BASE patched in onboarding.local"

if [[ "$SECRETS_ONLY" != "1" ]]; then
  staging_rc_baseline_gate_post_deploy || fail "post-deploy TT_STAGING_RC_BASELINE — run run-staging-rc-baseline-final-alignment.sh"
fi
