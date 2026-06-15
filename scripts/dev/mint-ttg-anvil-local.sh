#!/usr/bin/env bash
# ② Anvil · 向指定钱包 mint MockERC20（本地 TTG）
#
# 用法：
#   bash scripts/dev/mint-ttg-anvil-local.sh 0xYourWallet
#   bash scripts/dev/mint-ttg-anvil-local.sh 0xYourWallet 500000000000000000000000
#
# 须已 deploy（scripts/dev/.env.anvil.local 或根 .env 含 TTG 地址）且 Anvil 在跑。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export TTG_ANVIL_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/ttg-anvil-common.sh
source "$ROOT/scripts/dev/lib/ttg-anvil-common.sh"

WALLET="${1:-}"
AMOUNT="${2:-}"

[[ -n "$WALLET" && "$WALLET" == 0x* ]] || ttg_anvil_fail "usage: mint-ttg-anvil-local.sh 0xWallet [amount_wei]"

ttg_anvil_load_dotenv TTG_ANVIL_MOCK_ERC20
ttg_anvil_load_dotenv GOVERNANCE_TOKEN_ADDRESS
ttg_anvil_load_dotenv CHAIN_RPC_URL
ttg_anvil_load_dotenv TTG_ANVIL_DEPLOYER_PK

TTG="${TTG_ANVIL_MOCK_ERC20:-${GOVERNANCE_TOKEN_ADDRESS:-}}"
RPC="${CHAIN_RPC_URL:-http://127.0.0.1:${ANVIL_PORT:-8545}}"
PK="${TTG_ANVIL_DEPLOYER_PK:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

[[ -n "$TTG" && "$TTG" == 0x* ]] || ttg_anvil_fail "TTG address missing — run deploy-ttg-anvil-local.sh --apply"

if [[ -z "$AMOUNT" ]]; then
  # Default: enough for CN+US+FR cumulative min stake (protocol-ssot 1250 bps of 10M ether units)
  AMOUNT="1250000000000000000000000"
fi

ttg_anvil_ensure_tools
cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || ttg_anvil_fail "Anvil not reachable at $RPC"

cast send "$TTG" "mint(address,uint256)" "$WALLET" "$AMOUNT" \
  --rpc-url "$RPC" --private-key "$PK" >/dev/null \
  || ttg_anvil_fail "mint failed"

BAL="$(cast call "$TTG" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" | awk '{print $1}')"
ttg_anvil_ok "minted amount=$AMOUNT to $WALLET balance=$BAL"
echo "TT_TTG_ANVIL_MINT: OK"
