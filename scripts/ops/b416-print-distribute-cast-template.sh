#!/usr/bin/env bash
# B-416 · **L1** **：** **打印** **`FeeRouter.distribute(uint256)`** **`cast send`** **模板** **（** **占位** **calldata** **；** **须** **人工** **替换** **地址** **/** **金额** **）** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b416-print-distribute-cast-template.sh`**
#
# 互证：**[`docs/runbook/TT-B416-FEE-ROUTER-WRITE-PATH-TESTNET-ADMIN-001.md`](../../docs/runbook/TT-B416-FEE-ROUTER-WRITE-PATH-TESTNET-ADMIN-001.md)**。
set -euo pipefail

FEE_ROUTER="${FEE_ROUTER_ADDRESS:-${FEE_ROUTER:-0x0000000000000000000000000000000000000000}}"
ORDER_ID="${B416_ORDER_ID:-0}"

cat <<EOF
# Template: cast send FeeRouter.distribute(orderId)
# Fill RPC_URL / PRIVATE_KEY / FEE_ROUTER_ADDRESS / B416_ORDER_ID in your shell before running.

cast send "${FEE_ROUTER}" "distribute(uint256)" "${ORDER_ID}" \\
  --rpc-url "\${CHAIN_RPC_URL:-\$RPC_URL}" \\
  --private-key "\${B416_DISTRIBUTE_PRIVATE_KEY:-\$PRIVATE_KEY}"
EOF
