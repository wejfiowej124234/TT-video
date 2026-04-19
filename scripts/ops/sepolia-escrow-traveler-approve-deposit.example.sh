#!/usr/bin/env bash
# 用**支持 approve/transferFrom 的标准 ERC20**（如 **`MockERC20`** 或测试网已部署的 ERC20），以**旅行者钱包**执行：
#   [可选] MockERC20.mint → erc20.approve(Escrow) → Escrow.deposit(totalAmount)
# 从而在链上产生真实 **`Deposited`** 资金流（**不是** Timelock / indexer / reconcile）。
#
# 前置：
#   - Escrow 须为 **Created(1)**，且 **`msg.sender == traveler`**；**`deposit(amount)`** 要求 **amount == totalAmount**（见 `contracts/src/Escrow.sol`）。
#   - **不要用 `GovernanceVotesToken` 作支付币**（无 approve/transferFrom）。
#   - 私钥必须是 **订单 traveler 地址** 对应的私钥；**一行** **0x + 64 hex**，见 `b435-sepolia-stake-first-payment.example.sh` 同式 `_normalize_hex_pk`。
#
# 用法（仓库根）：
#   export ESCROW_ADDRESS=0xYourEscrowInstance
#   set -a && source .env && set +a
#   bash scripts/ops/sepolia-escrow-traveler-approve-deposit.example.sh
#
# 可选：MockERC20 测试币自助领取（合约 `mint` 为 public 测试用）
#   export ESCROW_MINT_TEST_TOKENS=1
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

_normalize_hex_pk() {
  local k="$(_strip_cr "${1:-}")"
  [[ -z "$k" ]] && { printf '%s' "$k"; return; }
  if [[ "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then printf '%s' "$k"; return; fi
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then printf '0x%s' "$k"; return; fi
  printf '%s' "$k"
}

RPC="$(_strip_cr "${CHAIN_RPC_URL:-}")"
ESCROW="$(_strip_cr "${ESCROW_ADDRESS:-}")"
PK_RAW="${PRIVATE_KEY:-${B417_PRIVATE_KEY:-${B417_GOV_EXEC_PK:-${CHAIN_EXECUTOR_PRIVATE_KEY:-}}}}"
PK="$(_normalize_hex_pk "$PK_RAW")"
export CHAIN_RPC_URL="$RPC"
export PRIVATE_KEY="$PK"

if [[ -z "$RPC" ]]; then
  echo "sepolia-escrow-traveler-approve-deposit: set CHAIN_RPC_URL in .env" >&2
  exit 1
fi
if [[ -z "$ESCROW" ]]; then
  echo "sepolia-escrow-traveler-approve-deposit: export ESCROW_ADDRESS=0x... (single Escrow proxy)" >&2
  exit 1
fi
if [[ -z "$PK" ]]; then
  echo "sepolia-escrow-traveler-approve-deposit: set PRIVATE_KEY to the **traveler** wallet (0x+64 hex)." >&2
  exit 1
fi

command -v cast >/dev/null 2>&1 || {
  echo "sepolia-escrow-traveler-approve-deposit: need cast (Foundry)" >&2
  exit 1
}

TOKEN="$(cast call "$ESCROW" "token()(address)" --rpc-url "$RPC" | tr -d '\r\n')"
TRAVELER="$(cast call "$ESCROW" "traveler()(address)" --rpc-url "$RPC" | tr -d '\r\n')"
TOTAL_LINE="$(cast call "$ESCROW" "totalAmount()(uint256)" --rpc-url "$RPC" | tr -d '\r\n')"
TOTAL_RAW="${TOTAL_LINE%%[*}"
TOTAL_RAW="${TOTAL_RAW%% *}"
TOTAL_RAW="${TOTAL_RAW// /}"
STATUS_LINE="$(cast call "$ESCROW" "status()(uint8)" --rpc-url "$RPC" | tr -d '\r\n')"
STATUS_RAW="${STATUS_LINE%%[*}"
STATUS_RAW="${STATUS_RAW%% *}"

SELF="$(cast wallet address --private-key "$PK")"

echo "=== Escrow: $ESCROW"
echo "token: $TOKEN"
echo "traveler (chain): $TRAVELER"
echo "totalAmount: $TOTAL_RAW"
echo "status (0=None,1=Created,2=Funded,...): $STATUS_RAW"
echo "signer: $SELF"

if [[ "${SELF,,}" != "${TRAVELER,,}" ]]; then
  echo "sepolia-escrow-traveler-approve-deposit: PRIVATE_KEY must be the **traveler**; chain traveler=$TRAVELER" >&2
  exit 1
fi
if [[ "$STATUS_RAW" != "1" ]]; then
  echo "sepolia-escrow-traveler-approve-deposit: Escrow must be status Created(1); got $STATUS_RAW" >&2
  exit 1
fi

# MockERC20：任意地址可 mint（仅测试）；见 contracts/src/MockERC20.sol
if [[ "${ESCROW_MINT_TEST_TOKENS:-0}" == "1" ]]; then
  echo "=== [0/3] MockERC20.mint(traveler, totalAmount) — test only"
  cast send "$TOKEN" "mint(address,uint256)" "$SELF" "$TOTAL_RAW" --rpc-url "$RPC" --private-key "$PK" --async
fi

BAL_LINE="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$SELF" --rpc-url "$RPC" | tr -d '\r\n')"
BAL_RAW="${BAL_LINE%%[*}"
BAL_RAW="${BAL_RAW%% *}"
echo "traveler token balance: $BAL_RAW (need >= totalAmount)"

echo "=== [1/3] erc20.approve(escrow, totalAmount)"
APPROVE_TX="$(cast send "$TOKEN" "approve(address,uint256)" "$ESCROW" "$TOTAL_RAW" --rpc-url "$RPC" --private-key "$PK" --async)"
APPROVE_TX="$(_strip_cr "$APPROVE_TX")"
echo "approve tx: $APPROVE_TX"

echo "=== [2/3] Escrow.deposit(totalAmount) — must equal totalAmount exactly"
DEPOSIT_TX="$(cast send "$ESCROW" "deposit(uint256)" "$TOTAL_RAW" --rpc-url "$RPC" --private-key "$PK" --async)"
DEPOSIT_TX="$(_strip_cr "$DEPOSIT_TX")"
echo "deposit tx: $DEPOSIT_TX"

CHAIN_ID_LINE="$(cast chain-id --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
echo "=== done. chain_id=$CHAIN_ID_LINE"
echo "Deposited event: open Escrow $ESCROW on explorer → Logs → Deposited"
echo "Tx links (Sepolia; change domain if not 11155111):"
echo "  approve  https://sepolia.etherscan.io/tx/$APPROVE_TX"
echo "  deposit  https://sepolia.etherscan.io/tx/$DEPOSIT_TX"
echo
echo "Next (after indexer sees Funded / order escrowed):"
echo "  0) Full path from seed login + HTTP order + createEscrow + bind + Funded:  bash scripts/ops/b407-sepolia-http-create-fund-bind.example.sh"
echo "  1) Explorer-only release:  B407_SKIP_DISTRIBUTE=1 bash scripts/ops/b407-exec-chain-release-distribute.sh"
echo "     → on release tx verify Released + ERC20 Transfer Escrow → FeeRouter."
echo "  2) Distribute only (after ①; do NOT run release again):  B407_SKIP_RELEASE=1 bash scripts/ops/b407-exec-chain-release-distribute.sh"
echo "  3) API:  bash scripts/ops/b435-evidence-internal-curls.example.sh"
echo "     (optional B435_INCLUDE_FEE_ROUTER_B383=1 VERIFY_FEE_ROUTER_EVENTS_RPC=1 FEE_ROUTER_VERIFY_TX_HASH=0x… from distribute tx)"
