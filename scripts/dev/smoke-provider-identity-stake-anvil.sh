#!/usr/bin/env bash
# ① Anvil · ProviderIdentityStakingPool 链上读（token/stakeOf）+ 写（approve/stake/withdraw）烟测
#
# 用法：bash scripts/dev/smoke-provider-identity-stake-anvil.sh
# 前置：Foundry · Anvil :8545
# 可选：ANVIL_ALREADY_RUNNING=1 · FUNDSTACK_SKIP_DEPLOY=1 · PROVIDER_STAKE_WALLET=0x...（mint 目标）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

fail() { echo "smoke-provider-identity-stake-anvil: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-provider-identity-stake-anvil: OK $*"; }

RPC="$FUNDSTACK_ANVIL_RPC"
DEPLOYER_PK="$FUNDSTACK_ANVIL_DEPLOYER_PK"
STAKER_PK="$FUNDSTACK_ANVIL_STAKER_PK"

fundstack_anvil_ensure_anvil

if [[ "${FUNDSTACK_SKIP_DEPLOY:-0}" == "1" ]]; then
  fundstack_anvil_load_dotenv STAKING_PROVIDER_ADDRESS
  fundstack_anvil_load_dotenv SETTLEMENT_TOKEN
  POOL="${STAKING_PROVIDER_ADDRESS:-}"
  TOKEN="${SETTLEMENT_TOKEN:-}"
  [[ -n "$POOL" && -n "$TOKEN" ]] || fail "FUNDSTACK_SKIP_DEPLOY=1 but STAKING_PROVIDER_ADDRESS/SETTLEMENT_TOKEN missing"
elif fundstack_anvil_try_reuse_deploy; then
  POOL="$FUNDSTACK_ANVIL_PROVIDER_POOL"
  TOKEN="$FUNDSTACK_ANVIL_TOKEN"
else
  fundstack_anvil_deploy
  fundstack_anvil_write_env_file
  fundstack_anvil_apply_root_env
  bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"
  POOL="$FUNDSTACK_ANVIL_PROVIDER_POOL"
  TOKEN="$FUNDSTACK_ANVIL_TOKEN"
fi

STAKER_ADDR="$(cast wallet address --private-key "$STAKER_PK")"
MINT_TARGET="${PROVIDER_STAKE_WALLET:-$STAKER_ADDR}"

TOKEN_ON_CHAIN="$(cast call "$POOL" "token()(address)" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$TOKEN_ON_CHAIN" == "$TOKEN" ]] || fail "token() mismatch pool=$TOKEN_ON_CHAIN env=$TOKEN"
ok "read token()=$TOKEN_ON_CHAIN"

MIN_STAKE="$(cast call "$POOL" "MIN_STAKE()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
[[ -n "$MIN_STAKE" && "$MIN_STAKE" =~ ^[0-9]+$ ]] || fail "MIN_STAKE read failed"
ok "read MIN_STAKE=$MIN_STAKE"

EXISTING="$(cast call "$POOL" "stakeOf(address)(uint256)" "$STAKER_ADDR" --rpc-url "$RPC" | awk '{print $1}')"
if [[ -n "$EXISTING" && "$EXISTING" =~ ^[0-9]+$ && "$EXISTING" != "0" ]]; then
  cast send "$POOL" "withdraw(uint256)" "$EXISTING" \
    --rpc-url "$RPC" --private-key "$STAKER_PK" >/dev/null || fail "cleanup withdraw failed"
  ok "cleanup withdraw($EXISTING)"
fi

MINT_AMOUNT="$MIN_STAKE"
cast send "$TOKEN" "mint(address,uint256)" "$MINT_TARGET" "$MINT_AMOUNT" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" >/dev/null || fail "MockERC20 mint failed"

if [[ "$MINT_TARGET" != "$STAKER_ADDR" ]]; then
  cast send "$TOKEN" "transfer(address,uint256)" "$STAKER_ADDR" "$MINT_AMOUNT" \
    --rpc-url "$RPC" --private-key "$MINT_TARGET" >/dev/null 2>&1 \
    || cast send "$TOKEN" "mint(address,uint256)" "$STAKER_ADDR" "$MINT_AMOUNT" \
      --rpc-url "$RPC" --private-key "$DEPLOYER_PK" >/dev/null \
      || fail "fund staker wallet failed"
fi

cast send "$TOKEN" "approve(address,uint256)" "$POOL" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$STAKER_PK" >/dev/null || fail "approve failed"

cast send "$POOL" "stake(uint256)" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$STAKER_PK" >/dev/null || fail "stake failed"
ok "write stake($MIN_STAKE)"

STAKE_OF="$(cast call "$POOL" "stakeOf(address)(uint256)" "$STAKER_ADDR" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$STAKE_OF" == "$MIN_STAKE" ]] || fail "stakeOf after stake: got $STAKE_OF want $MIN_STAKE"
ok "read stakeOf=$STAKE_OF"

WITHDRAW_TX="$(cast send "$POOL" "withdraw(uint256)" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$STAKER_PK" --json | jq -r '.transactionHash // .hash // empty')"
[[ -n "$WITHDRAW_TX" ]] || fail "withdraw failed (no tx hash)"
ok "write withdraw(full $MIN_STAKE) tx=$WITHDRAW_TX"

STAKE_AFTER="$(cast call "$POOL" "stakeOf(address)(uint256)" "$STAKER_ADDR" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$STAKE_AFTER" == "0" ]] || fail "stakeOf after full withdraw: got $STAKE_AFTER want 0"
ok "read stakeOf after withdraw=0"

echo "TT_PROVIDER_IDENTITY_STAKE_ANVIL_SMOKE: OK"
echo "  POOL=$POOL"
echo "  TOKEN=$TOKEN"
echo "  CHAIN_ID=$(cast chain-id --rpc-url "$RPC")"
echo "  WITHDRAW_TX=$WITHDRAW_TX"
