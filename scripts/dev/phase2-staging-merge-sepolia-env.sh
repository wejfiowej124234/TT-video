#!/usr/bin/env bash
# P0-03 · 将 Sepolia 序 1～5 地址合并进 staging onboarding env（不含 PRIVATE_KEY / Safe keys）
#
#   bash scripts/dev/phase2-staging-merge-sepolia-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHAIN_ENV="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
ONBOARDING="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
MARKER="# --- P0-03 Sepolia seq 1-5 (auto · phase2-staging-merge-sepolia-env.sh) ---"

fail() { echo "phase2-staging-merge-sepolia-env: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-staging-merge-sepolia-env: OK $*"; }

ALLOW_KEYS=(
  CHAIN_RPC_URL CHAIN_ID TIMELOCK_ADMIN_ADDRESS TIMELOCK_ADDRESS
  GOVERNANCE_TOKEN_ADDRESS GOVERNOR_ADDRESS FUND_STACK_TOKEN_ADDRESS
  ESCROW_FACTORY_ADDRESS FEE_ROUTER_ADDRESS REGION_VAULT_ADDRESS
  TREASURY_ADDRESS RESERVE_VAULT_ADDRESS GUIDE_STAKING_POOL_ADDRESS
  PROVIDER_STAKING_POOL_ADDRESS REGISTRY_ADDRESS STEWARD_TTG_ADDRESS
  REGION_STEWARD_STAKE_POOL_ADDRESS REDEMPTION_ASSET_ADDRESS
  COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS COUNTRY_POOL_LEDGER_PILOT_ADDRESS
  COUNTRY_POOL_LEDGER_ADDRESS COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS
)

[[ -f "$CHAIN_ENV" ]] || fail "missing $CHAIN_ENV"
[[ -f "$ONBOARDING" ]] || fail "missing $ONBOARDING — cp scripts/dev/staging-onboarding.env.example"

key_allowed() {
  local k="$1" a
  for a in "${ALLOW_KEYS[@]}"; do
    [[ "$k" == "$a" ]] && return 0
  done
  return 1
}

tmp="$(mktemp)"
awk -v mark="$MARKER" '
  $0 == mark { skip=1; next }
  skip && /^# --- / { skip=0 }
  skip { next }
  { print }
' "$ONBOARDING" >"$tmp"

{
  echo ""
  echo "$MARKER"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    key_allowed "$key" || continue
    echo "$line"
  done < "$CHAIN_ENV"
} >>"$tmp"

mv "$tmp" "$ONBOARDING"
ok "merged Sepolia addresses into $ONBOARDING"
