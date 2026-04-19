#!/usr/bin/env bash
# **B-407** **链上** **最小** **步**：**Escrow** **`release()`** **（** **任意** **付** **gas** **的** **EOA** **）** **→** **读** **FeeRouter** **上** **该** **代币** **余额** **→** **FeeRouter** **`distribute(token, amount)`** **（** **`onlyOwner`** **）** **。**
#
# **Explorer** **核对** **（** **Sepolia** **示例** **：** **https://sepolia.etherscan.io/tx/<txHash>** **）** **：**
#   **release** **交易** **：** **Logs** **里** **有** **`Released`** **；** **Token** **转账** **里** **须** **有** **一笔** **ERC20** **`Transfer`** **：** **`from`** **=** **Escrow** **合约** **，** **`to`** **=** **`platformFeeRecipient`** **（** **须** **=** **FeeRouter** **）** **。**
#   **`distribute`** **交易** **（** **未** **设** **`B407_SKIP_DISTRIBUTE`** **时** **）** **：** **FeeRouter** **Logs** **含** **`PlatformFeeRouted`** **（** **B-081** **/** **B-383** **观测** **依赖** **索引** **入库** **）** **。**
# **链下** **下一步** **：** **`scripts/ops/b435-evidence-internal-curls.example.sh`** **（** **`indexer-tick`** **+** **`indexer-reconcile`** **）** **；** **若** **走** **B-383** **/** **B-081** **对拍** **，** **设** **`B435_INCLUDE_FEE_ROUTER_B383=1`** **及** **可选** **`VERIFY_FEE_ROUTER_EVENTS_RPC`** **+** **`FEE_ROUTER_VERIFY_TX_HASH`** **（** **`distribute`** **tx** **）** **。**
#
# **前置**：**`cast`** **（** **Foundry** **）** **；** **托管** **须** **已为** **`Funded`** **（** **本** **脚本** **不** **含** **`deposit`** **；** **须** **事先** **链上** **充值** **/** **部署** **）** **；** **Escrow** **`platformFeeRecipient`** **须** **指向** **与** **本** **脚本** **传入** **的** **FeeRouter** **一致** **，** **否则** **`release`** **后** **Router** **余额** **为** **0** **。**
#
# **环境** **（** **RPC** **优先** **顺序** **）**：
#   B407_RPC_URL / CHAIN_RPC_URL / RPC_URL
#   B407_ESCROW            Escrow 合约地址（**必填**；**或** **B407_ESCROW_ADDRESS** **与** **TT-B407** **runner** **同源** **）**
#   B407_FEE_ROUTER        FeeRouter 地址（**或** **FEE_ROUTER_ADDRESS**）
#   B407_RELAYER_PK        用于 **`release()`** **的** **私钥** **（** **仅** **需** **gas** **）**
#   B407_OWNER_PK          FeeRouter **`owner`** **私钥** **（** **`distribute`** **；** **未** **设** **`B407_SKIP_DISTRIBUTE=1`** **时** **必填** **）**
#   B407_TOKEN             可选；**默认** **从** **Escrow** **`token()`** **读取**
#
# **可选**：**`B407_SKIP_DISTRIBUTE=1`** **—** **仅** **`release()`** **（** **不** **调** **`distribute`** **；** **B-402/B-386** **通常** **仍** **需要** **`PlatformFeeRouted`** **）** **。**
# **可选**：**`B407_SKIP_RELEASE=1`** **—** **仅** **`distribute(token,amount)`** **（** **Escrow** **须** **已** **`release`** **过** **；** **不** **再** **调** **`release()`** **）** **。** **典型** **：** **上** **一轮** **已** **用** **`B407_SKIP_DISTRIBUTE=1`** **完成** **Explorer** **核对** **后** **，** **本** **轮** **只** **把** **Router** **内** **余额** **做** **`distribute`** **。**
# **留证**：**若** **设** **`B407_TX_RECORD_JSON`** **（** **路径** **）** **，** **成功** **后** **写入** **JSON** **（** **`release_tx_hash`** **/** **`distribute_tx_hash`** **等** **）** **供** **B-408** **收口** **。**
#
# **退出码**：**0** **成功** **；** **1** **参数** **；** **12** **缺** **依赖** **/** **链** **步** **失败** **。**

set -euo pipefail

RPC="${B407_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
ESC="${B407_ESCROW:-${B407_ESCROW_ADDRESS:-}}"
FR="${B407_FEE_ROUTER:-${FEE_ROUTER_ADDRESS:-}}"
REL="${B407_RELAYER_PK:-}"
OWN="${B407_OWNER_PK:-}"
TOKEN_OVERRIDE="${B407_TOKEN:-}"

if ! command -v cast >/dev/null 2>&1; then
  echo "b407-exec-chain-release-distribute.sh: cast (foundry) is required" >&2
  exit 12
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "b407-exec-chain-release-distribute.sh: jq is required" >&2
  exit 12
fi

extract_tx_hash_from_cast_send_output() {
  local blob="$1"
  local h
  h="$(printf '%s' "$blob" | grep -E '^[[:space:]]*transactionHash[[:space:]]+' | head -1 | awk '{print $2}' | tr -d '\r\n')"
  if [[ -z "$h" ]]; then
    h="$(printf '%s' "$blob" | grep -oE '0x[a-fA-F]{64}' | head -1)"
  fi
  printf '%s' "$h"
}

write_tx_record_json() {
  local rel="$1"
  local dis="$2"
  local path="${B407_TX_RECORD_JSON:-}"
  [[ -z "$path" ]] && return 0
  local dis_val="$dis"
  if [[ "${B407_SKIP_DISTRIBUTE:-0}" == "1" ]]; then
    dis_val=""
  fi
  jq -n \
    --arg rpc "$RPC" \
    --arg escrow "$ESC" \
    --arg fee_router "$FR" \
    --arg token "$TOKEN" \
    --arg release_tx_hash "$rel" \
    --arg distribute_tx_hash "$dis_val" \
    '{
      rpc_url: $rpc,
      escrow: $escrow,
      fee_router: $fee_router,
      token: $token,
      release_tx_hash: $release_tx_hash,
      distribute_tx_hash: (if ($distribute_tx_hash|length) > 0 then $distribute_tx_hash else null end)
    }' >"$path"
}

if [[ -z "$RPC" || -z "$ESC" || -z "$FR" ]]; then
  echo "b407-exec-chain-release-distribute.sh: need B407_RPC_URL or CHAIN_RPC_URL or RPC_URL; B407_ESCROW or B407_ESCROW_ADDRESS; B407_FEE_ROUTER or FEE_ROUTER_ADDRESS" >&2
  exit 1
fi
if [[ "${B407_SKIP_RELEASE:-0}" != "1" && -z "$REL" ]]; then
  echo "b407-exec-chain-release-distribute.sh: B407_RELAYER_PK is required unless B407_SKIP_RELEASE=1 (distribute-only)" >&2
  exit 1
fi
if [[ "${B407_SKIP_DISTRIBUTE:-0}" != "1" && -z "$OWN" ]]; then
  echo "b407-exec-chain-release-distribute.sh: B407_OWNER_PK is required unless B407_SKIP_DISTRIBUTE=1 (release-only)" >&2
  exit 1
fi
if [[ "${B407_SKIP_RELEASE:-0}" == "1" && "${B407_SKIP_DISTRIBUTE:-0}" == "1" ]]; then
  echo "b407-exec-chain-release-distribute.sh: B407_SKIP_RELEASE=1 and B407_SKIP_DISTRIBUTE=1 together would do nothing" >&2
  exit 1
fi

norm_addr() {
  local x="$1"
  x="$(printf '%s' "$x" | tr -d '\r\n' | tr '[:upper:]' '[:lower:]')"
  echo "$x"
}

if [[ "${B407_SKIP_DISTRIBUTE:-0}" != "1" ]]; then
  OWNER_ADDR="$(cast wallet address --private-key "$OWN" 2>/dev/null | tr -d '\r\n' || true)"
  if [[ -z "$OWNER_ADDR" ]]; then
    echo "b407-exec-chain-release-distribute.sh: could not derive address from B407_OWNER_PK" >&2
    exit 12
  fi
  OWNER_ADDR="$(norm_addr "$OWNER_ADDR")"

  RO_OWNER_RAW="$(cast call "$FR" "owner()(address)" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
  RO_OWNER="$(norm_addr "$RO_OWNER_RAW")"
  if [[ -z "$RO_OWNER" || "$RO_OWNER" == "0x0000000000000000000000000000000000000000" ]]; then
    echo "b407-exec-chain-release-distribute.sh: could not read FeeRouter owner()" >&2
    exit 12
  fi
  if [[ "$RO_OWNER" != "$OWNER_ADDR" ]]; then
    echo "b407-exec-chain-release-distribute.sh: B407_OWNER_PK address ${OWNER_ADDR} != FeeRouter owner ${RO_OWNER}" >&2
    exit 12
  fi
fi

if [[ -n "$TOKEN_OVERRIDE" ]]; then
  TOKEN="$TOKEN_OVERRIDE"
else
  TOKEN="$(cast call "$ESC" "token()(address)" --rpc-url "$RPC" | tr -d '\r\n' | awk '{print $NF}')"
fi
TOKEN="$(norm_addr "$TOKEN")"
if [[ -z "$TOKEN" || "$TOKEN" == "0x0000000000000000000000000000000000000000" ]]; then
  echo "b407-exec-chain-release-distribute.sh: could not resolve escrow token address" >&2
  exit 12
fi

echo "b407-exec-chain-release-distribute.sh: RPC=${RPC}"
echo "b407-exec-chain-release-distribute.sh: escrow=${ESC} token=${TOKEN} fee_router=${FR}"

REL_HASH=""
if [[ "${B407_SKIP_RELEASE:-0}" == "1" ]]; then
  echo "b407-exec-chain-release-distribute.sh: B407_SKIP_RELEASE=1 — skipping release() (Escrow must already be released)"
else
  echo "b407-exec-chain-release-distribute.sh: release()..."
  REL_OUT=""
  REL_OUT="$(cast send "$ESC" "release()" --private-key "$REL" --rpc-url "$RPC" --timeout 600 2>&1)" || {
    printf '%s\n' "$REL_OUT" >&2
    echo "b407-exec-chain-release-distribute.sh: release() failed (escrow must be Funded; see Escrow.sol)" >&2
    exit 12
  }
  printf '%s\n' "$REL_OUT"
  REL_HASH="$(extract_tx_hash_from_cast_send_output "$REL_OUT")"
  if [[ -z "$REL_HASH" ]]; then
    echo "b407-exec-chain-release-distribute.sh: warning: could not parse release() transactionHash from cast output" >&2
  fi
fi

if [[ "${B407_SKIP_DISTRIBUTE:-0}" == "1" ]]; then
  echo "b407-exec-chain-release-distribute.sh: B407_SKIP_DISTRIBUTE=1 — skipping distribute()"
  write_tx_record_json "$REL_HASH" ""
  echo "b407-exec-chain-release-distribute.sh: ok"
  exit 0
fi

AMT="$(cast call "$TOKEN" "balanceOf(address)(uint256)" "$FR" --rpc-url "$RPC" | tr -d '\r\n' | awk '{print $NF}')"
if [[ -z "$AMT" || "$AMT" == "0" ]]; then
  echo "b407-exec-chain-release-distribute.sh: FeeRouter token balance is 0 after release — check platformFeeRecipient == FeeRouter and token leg" >&2
  exit 12
fi

echo "b407-exec-chain-release-distribute.sh: distribute(token=${TOKEN}, amount=${AMT})..."
DIS_OUT=""
DIS_HASH=""
DIS_OUT="$(cast send "$FR" "distribute(address,uint256)" "$TOKEN" "$AMT" --private-key "$OWN" --rpc-url "$RPC" --timeout 600 2>&1)" || {
  printf '%s\n' "$DIS_OUT" >&2
  echo "b407-exec-chain-release-distribute.sh: distribute() failed" >&2
  exit 12
}
printf '%s\n' "$DIS_OUT"
DIS_HASH="$(extract_tx_hash_from_cast_send_output "$DIS_OUT")"
if [[ -z "$DIS_HASH" ]]; then
  echo "b407-exec-chain-release-distribute.sh: warning: could not parse distribute() transactionHash from cast output" >&2
fi

write_tx_record_json "$REL_HASH" "$DIS_HASH"

echo "b407-exec-chain-release-distribute.sh: ok"
exit 0
