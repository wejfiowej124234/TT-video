#!/usr/bin/env bash
# ① Anvil · 向测试钱包 mint MockERC20 USDC（FundStack SETTLEMENT_TOKEN）
#
# 用法：
#   bash scripts/dev/mint-fundstack-anvil-usdc.sh
#   bash scripts/dev/mint-fundstack-anvil-usdc.sh 0xYourWallet
#   bash scripts/dev/mint-fundstack-anvil-usdc.sh 0xWallet 20000000000   # raw units (6 decimals)
#
# 默认：Anvil #0 + #1 各 mint 20000 USDC（足够选尊享档 10000）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

fail() { echo "mint-fundstack-anvil-usdc: FAIL $*" >&2; exit 1; }
ok() { echo "mint-fundstack-anvil-usdc: OK $*"; }

fundstack_anvil_ensure_anvil
fundstack_anvil_load_dotenv SETTLEMENT_TOKEN
TOKEN="${SETTLEMENT_TOKEN:-}"
[[ -n "$TOKEN" && "$TOKEN" == 0x* ]] || fail "SETTLEMENT_TOKEN missing — run deploy-fundstack-anvil-local.sh --apply"

RPC="$FUNDSTACK_ANVIL_RPC"
PK="$FUNDSTACK_ANVIL_DEPLOYER_PK"

# 20000 USDC @ 6 decimals
MINT_RAW="${FUNDSTACK_ANVIL_MINT_USDC_RAW:-20000000000}"
WALLET="${1:-}"
if [[ -n "${2:-}" ]]; then
  MINT_RAW="$2"
fi

mint_one() {
  local w="$1"
  [[ -n "$w" && "$w" == 0x* ]] || return 0
  cast send "$TOKEN" "mint(address,uint256)" "$w" "$MINT_RAW" \
    --rpc-url "$RPC" --private-key "$PK" >/dev/null || fail "mint failed for $w"
  local bal
  bal="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$w" --rpc-url "$RPC" | awk '{print $1}')"
  ok "minted raw=$MINT_RAW to $w (balance=$bal)"
}

if [[ -n "$WALLET" ]]; then
  mint_one "$WALLET"
else
  mint_one "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  mint_one "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
fi

echo "TT_FUNDSTACK_ANVIL_MINT_USDC: OK token=$TOKEN raw=$MINT_RAW"
