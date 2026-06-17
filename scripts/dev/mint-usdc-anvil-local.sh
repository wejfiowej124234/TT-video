#!/usr/bin/env bash
# ① Anvil · 给指定钱包 mint MockERC20 USDC（Deploy.s.sol 部署的 SETTLEMENT_TOKEN）
#
# 用法：bash scripts/dev/mint-usdc-anvil-local.sh 0xYourWallet [amount_usdc]
# 默认 amount=2000（覆盖 MIN_STAKE 1000）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

WALLET="${1:-}"
AMOUNT_USDC="${2:-2000}"
[[ -n "$WALLET" && "$WALLET" == 0x* ]] || fundstack_anvil_fail "usage: mint-usdc-anvil-local.sh 0xWallet [amount_usdc]"

fundstack_anvil_load_dotenv SETTLEMENT_TOKEN
TOKEN="${SETTLEMENT_TOKEN:-}"
[[ -n "$TOKEN" ]] || fundstack_anvil_fail "SETTLEMENT_TOKEN missing — run deploy-fundstack-anvil-local.sh --apply first"

RAW="$(python - <<PY
amt = "${AMOUNT_USDC}"
print(int(float(amt) * 10**6))
PY
)"

cast send "$TOKEN" "mint(address,uint256)" "$WALLET" "$RAW" \
  --rpc-url "$FUNDSTACK_ANVIL_RPC" --private-key "$FUNDSTACK_ANVIL_DEPLOYER_PK" >/dev/null \
  || fundstack_anvil_fail "mint failed"

fundstack_anvil_ok "minted ${AMOUNT_USDC} USDC (raw $RAW) to $WALLET"
