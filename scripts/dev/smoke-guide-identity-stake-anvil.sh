#!/usr/bin/env bash
# ① Anvil · GuideIdentityStakingPool 链上读（token/stakeOf）+ 写（approve/stake/withdraw）烟测
#
# 用法：bash scripts/dev/smoke-guide-identity-stake-anvil.sh
# 前置：Foundry · Anvil :8545
# 可选：ANVIL_ALREADY_RUNNING=1 · FUNDSTACK_SKIP_DEPLOY=1 · GUIDE_STAKE_WALLET=0x...（mint 目标）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

fail() { echo "smoke-guide-identity-stake-anvil: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-guide-identity-stake-anvil: OK $*"; }

RPC="$FUNDSTACK_ANVIL_RPC"
DEPLOYER_PK="$FUNDSTACK_ANVIL_DEPLOYER_PK"
STAKER_PK="$FUNDSTACK_ANVIL_STAKER_PK"

fundstack_anvil_ensure_anvil

if [[ "${FUNDSTACK_SKIP_DEPLOY:-0}" == "1" ]]; then
  fundstack_anvil_load_dotenv GUIDE_STAKING_ADDRESS
  fundstack_anvil_load_dotenv SETTLEMENT_TOKEN
  POOL="${GUIDE_STAKING_ADDRESS:-}"
  TOKEN="${SETTLEMENT_TOKEN:-}"
  [[ -n "$POOL" && -n "$TOKEN" ]] || fail "FUNDSTACK_SKIP_DEPLOY=1 but GUIDE_STAKING_ADDRESS/SETTLEMENT_TOKEN missing"
elif fundstack_anvil_try_reuse_deploy; then
  POOL="$FUNDSTACK_ANVIL_GUIDE_POOL"
  TOKEN="$FUNDSTACK_ANVIL_TOKEN"
else
  fundstack_anvil_deploy
  fundstack_anvil_write_env_file
  fundstack_anvil_apply_root_env
  bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"
  POOL="$FUNDSTACK_ANVIL_GUIDE_POOL"
  TOKEN="$FUNDSTACK_ANVIL_TOKEN"
fi

STAKER_ADDR="$(cast wallet address --private-key "$STAKER_PK")"
MINT_TARGET="${GUIDE_STAKE_WALLET:-$STAKER_ADDR}"

# --- 读：token() ---
TOKEN_ON_CHAIN="$(cast call "$POOL" "token()(address)" --rpc-url "$RPC")"
TOKEN_ON_CHAIN="$(echo "$TOKEN_ON_CHAIN" | awk '{print $1}')"
[[ "$TOKEN_ON_CHAIN" == "$TOKEN" ]] || fail "token() mismatch pool=$TOKEN_ON_CHAIN env=$TOKEN"
ok "read token()=$TOKEN_ON_CHAIN"

MIN_STAKE="$(cast call "$POOL" "MIN_STAKE()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
[[ -n "$MIN_STAKE" && "$MIN_STAKE" =~ ^[0-9]+$ ]] || fail "MIN_STAKE read failed"
ok "read MIN_STAKE=$MIN_STAKE"

# --- 清理：若已有质押则先全额解押（烟测可重复跑）---
EXISTING="$(cast call "$POOL" "stakeOf(address)(uint256)" "$STAKER_ADDR" --rpc-url "$RPC" | awk '{print $1}')"
if [[ -n "$EXISTING" && "$EXISTING" =~ ^[0-9]+$ && "$EXISTING" != "0" ]]; then
  cast send "$POOL" "withdraw(uint256)" "$EXISTING" \
    --rpc-url "$RPC" --private-key "$STAKER_PK" >/dev/null || fail "cleanup withdraw failed"
  ok "cleanup withdraw($EXISTING)"
fi

# --- 写：mint → approve → stake ---
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

# --- 写：full withdraw（部分解押若剩余 < MIN_STAKE 会 revert BelowMinIdentityAfterWithdraw）---
WITHDRAW_TX="$(cast send "$POOL" "withdraw(uint256)" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$STAKER_PK" --json | jq -r '.transactionHash // .hash // empty')"
[[ -n "$WITHDRAW_TX" ]] || fail "withdraw failed (no tx hash)"
ok "write withdraw(full $MIN_STAKE) tx=$WITHDRAW_TX"

STAKE_AFTER="$(cast call "$POOL" "stakeOf(address)(uint256)" "$STAKER_ADDR" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$STAKE_AFTER" == "0" ]] || fail "stakeOf after full withdraw: got $STAKE_AFTER want 0"
ok "read stakeOf after withdraw=0"

# --- Registry bytecode ---
REGISTRY="${REGISTRY_ADDRESS:-${FUNDSTACK_ANVIL_REGISTRY:-}}"
if [[ -z "$REGISTRY" ]]; then
  fundstack_anvil_load_dotenv REGISTRY_ADDRESS
  REGISTRY="${REGISTRY_ADDRESS:-}"
fi
[[ -n "$REGISTRY" ]] || fail "REGISTRY_ADDRESS missing"
fundstack_anvil_contract_has_code "$REGISTRY" "$RPC" || fail "Registry has no bytecode"
ok "registry bytecode present at $REGISTRY"

echo "TT_GUIDE_IDENTITY_STAKE_ANVIL_SMOKE: OK"
echo "  POOL=$POOL"
echo "  TOKEN=$TOKEN"
echo "  REGISTRY=$REGISTRY"
echo "  CHAIN_ID=$(cast chain-id --rpc-url "$RPC")"
echo "  WITHDRAW_TX=$WITHDRAW_TX"
echo "  Next: restart API + Next.js; wallet import anvil account #1 or mint to your MetaMask ($MINT_TARGET)"
