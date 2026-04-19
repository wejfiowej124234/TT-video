#!/usr/bin/env bash
# TT-B435 §3.3（备选）：在 Sepolia 上对 IdentityStakingPool 做 approve + stake（与前端 /staking 同路径）。
# 若治理票 `GovernanceVotesToken` 无 `approve`/`transferFrom`，请改用托管/FeeRouter 等真实资金 tx + `b435-merge-first-payment-tx.example.sh`。
#
# 安全：私钥只放在本机 .env，勿粘贴到聊天、勿提交 git。在仓库根执行：
#   set -a && source .env && set +a
#   bash scripts/ops/b435-sepolia-stake-first-payment.example.sh
#
# 依赖：foundry（cast）；须 CHAIN_RPC_URL、GUIDE_STAKING_ADDRESS（或 STAKING_PROVIDER_ADDRESS）、私钥（**优先级** **PRIVATE_KEY** **>** **B417_PRIVATE_KEY** **>** **B417_GOV_EXEC_PK** **>** **CHAIN_EXECUTOR_PRIVATE_KEY**）；
#       账户须有 Sepolia ETH；须有质押代币余额（与 DeployFundStack 所用 FUND_STACK_TOKEN 一致）。
# 若未事先 source .env：自动加载仓库根 .env，并去掉 Windows CRLF（\r），避免 PRIVATE_KEY len=0。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

# cast 接受 0x+64hex 或 64hex；统一为 0x 前缀
_normalize_hex_pk() {
  local k="$(_strip_cr "${1:-}")"
  [[ -z "$k" ]] && { printf '%s' "$k"; return; }
  if [[ "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then printf '%s' "$k"; return; fi
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then printf '0x%s' "$k"; return; fi
  printf '%s' "$k"
}

RPC="$(_strip_cr "${CHAIN_RPC_URL:-}")"
GUIDE_STRIP="$(_strip_cr "${GUIDE_STAKING_ADDRESS:-}")"
PROV_STRIP="$(_strip_cr "${STAKING_PROVIDER_ADDRESS:-}")"
POOL_RAW="${B435_STAKING_POOL:-${GUIDE_STRIP:-$PROV_STRIP}}"
POOL="$(_strip_cr "$POOL_RAW")"
PK_RAW="${PRIVATE_KEY:-${B417_PRIVATE_KEY:-${B417_GOV_EXEC_PK:-${CHAIN_EXECUTOR_PRIVATE_KEY:-}}}}"
PK="$(_normalize_hex_pk "$PK_RAW")"
export CHAIN_RPC_URL="$RPC"
export GUIDE_STAKING_ADDRESS="$GUIDE_STRIP"
export PRIVATE_KEY="$PK"

if [[ -z "$RPC" ]]; then
  echo "b435-sepolia-stake-first-payment: set CHAIN_RPC_URL in $ROOT/.env" >&2
  exit 1
fi
if [[ -z "$POOL" ]]; then
  echo "b435-sepolia-stake-first-payment: set GUIDE_STAKING_ADDRESS or STAKING_PROVIDER_ADDRESS (or B435_STAKING_POOL) in $ROOT/.env" >&2
  exit 1
fi
if [[ -z "$PK" ]]; then
  echo "b435-sepolia-stake-first-payment: no usable private key after loading $ROOT/.env" >&2
  echo "  Set one of: PRIVATE_KEY, B417_PRIVATE_KEY, B417_GOV_EXEC_PK, CHAIN_EXECUTOR_PRIVATE_KEY (= 0x + 64 hex, one line, no quotes)." >&2
  echo "  If using Notepad, save UTF-8 without BOM; remove stray spaces around '='." >&2
  exit 1
fi

command -v cast >/dev/null 2>&1 || {
  echo "b435-sepolia-stake-first-payment: need 'cast' (Foundry)" >&2
  exit 1
}

echo "=== pool: $POOL"
TOKEN="$(cast call "$POOL" "token()(address)" --rpc-url "$RPC" | tr -d '\r\n')"
MIN_LINE="$(cast call "$POOL" "MIN_STAKE()(uint256)" --rpc-url "$RPC" | tr -d '\r\n')"
# cast 新版可输出 "1000000000 [1e9]"，只取首段十进制/hex，避免 cast send 解析失败
MIN_RAW="${MIN_LINE%%[*}"
MIN_RAW="${MIN_RAW%% *}"
MIN_RAW="${MIN_RAW// /}"
# 默认用 MIN_STAKE；可 export B435_STAKE_WEI=0x... 覆盖（uint256 hex）
AMOUNT="${B435_STAKE_WEI:-$MIN_RAW}"
SELF="$(cast wallet address --private-key "$PK")"

echo "token: $TOKEN"
echo "MIN_STAKE: $MIN_RAW"
echo "stake amount: $AMOUNT"
echo "signer: $SELF"

# --async: stdout is only the tx hash (easier to capture than full receipt logs).
DEFAULT_HASH_JSON="$ROOT/evidence/b435_fullstack_fund_testnet_closeout/run_20260416T122500Z/tx_hashes.json"
HASH_JSON="${B435_TX_HASHES_JSON:-}"
if [[ -z "$HASH_JSON" && -f "$DEFAULT_HASH_JSON" ]]; then
  HASH_JSON="$DEFAULT_HASH_JSON"
fi

echo "=== [1/2] erc20 approve(pool, amount)"
APPROVE_TX="$(cast send "$TOKEN" "approve(address,uint256)" "$POOL" "$AMOUNT" --rpc-url "$RPC" --private-key "$PK" --async)"
APPROVE_TX="$(_strip_cr "$APPROVE_TX")"
echo "approve tx: $APPROVE_TX"

echo "=== [2/2] stake(amount)"
STAKE_TX="$(cast send "$POOL" "stake(uint256)" "$AMOUNT" --rpc-url "$RPC" --private-key "$PK" --async)"
STAKE_TX="$(_strip_cr "$STAKE_TX")"
echo "stake tx (§3.3 first_payment): $STAKE_TX"

if [[ -n "$HASH_JSON" && -f "$HASH_JSON" ]] && command -v jq >/dev/null 2>&1; then
  tmp="${HASH_JSON}.${BASHPID:-$$}.tmp"
  if jq --arg h "$STAKE_TX" '.first_payment = $h' "$HASH_JSON" >"$tmp" 2>/dev/null && mv -f "$tmp" "$HASH_JSON"; then
    echo "Updated first_payment in $HASH_JSON"
  else
    rm -f "$tmp"
    echo "b435-sepolia-stake-first-payment: could not merge into $HASH_JSON — set first_payment to: $STAKE_TX" >&2
  fi
elif [[ -n "$HASH_JSON" ]]; then
  echo "b435-sepolia-stake-first-payment: install jq and keep $HASH_JSON present to auto-fill, or paste manually: $STAKE_TX" >&2
else
  echo "Optional: export B435_TX_HASHES_JSON=$ROOT/evidence/.../tx_hashes.json to auto-write first_payment (needs jq)." >&2
fi

echo "=== done."
