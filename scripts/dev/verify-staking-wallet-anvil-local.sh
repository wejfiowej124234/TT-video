#!/usr/bin/env bash
# ① 校验某钱包在 Anvil 上 Guide/Provider 质押余额 + USDC（MetaMask 手测前后对拍）
# 用法：bash scripts/dev/verify-staking-wallet-anvil-local.sh [0xWallet]
set -euo pipefail
WALLET="${1:-0x104FCb93B5e097F92c93Ee4621C487C6C953D212}"
RPC="${ANVIL_RPC:-http://127.0.0.1:8545}"
GUIDE="${GUIDE_STAKING_ADDRESS:-0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0}"
PROV="${PROVIDER_STAKING_POOL_ADDRESS:-0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9}"
TOKEN="${SETTLEMENT_TOKEN:-0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512}"
echo "wallet=$WALLET chain=$(cast chain-id --rpc-url "$RPC")"
echo "eth=$(cast balance "$WALLET" --rpc-url "$RPC")"
echo "usdc_raw=$(cast call "$TOKEN" 'balanceOf(address)(uint256)' "$WALLET" --rpc-url "$RPC")"
echo "guide_stake_raw=$(cast call "$GUIDE" 'stakeOf(address)(uint256)' "$WALLET" --rpc-url "$RPC")"
echo "provider_stake_raw=$(cast call "$PROV" 'stakeOf(address)(uint256)' "$WALLET" --rpc-url "$RPC")"
