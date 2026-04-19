#!/usr/bin/env bash
# B-416 L1：**cast** **distribute** **模板** **（** **不** **发送** **）** **。**
set -euo pipefail
FEE="${FEE_ROUTER_ADDRESS:-${B416_FEE_ROUTER:-}}"
TOK="${B416_TOKEN:-}"
AMT="${B416_AMOUNT_WEI:-}"
if [[ -z "$FEE" || -z "$TOK" || -z "$AMT" ]]; then
  echo "b416-print-distribute-cast-template: set FEE_ROUTER_ADDRESS/B416_FEE_ROUTER, B416_TOKEN, B416_AMOUNT_WEI" >&2
  exit 1
fi
echo "cast send \"$FEE\" \"distribute(address,uint256)\" \"$TOK\" \"$AMT\" --rpc-url \"\$CHAIN_RPC_URL\""
