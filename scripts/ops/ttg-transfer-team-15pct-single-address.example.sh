#!/usr/bin/env bash
# 将 GovernanceVotesToken（TTG）总供应的 **15%** 从 **msg.sender 私钥对应账户** 单笔 `transfer` 到 **单地址**（测试网/联调简化；与 docs/spec/82-治理币-文档总览.md §三之二「测试：单地址承接团队桶」一致）。
# 生产若拆多地址，仍用多次 transfer 或台账披露；本脚本不替代法务/披露。
#
# 依赖：foundry `cast`、python3（大整数 wei）
#
# 用法（在仓库根，已 `source .env` 或 export）：
#   export GOVERNANCE_TOKEN_ADDRESS=0x…
#   export CHAIN_RPC_URL=https://…
#   export PRIVATE_KEY=0x…          # 须为当前链上持有足够 TTG 的账户（通常为部署者）
#   export TTG_TEAM_ALLOCATION_RECIPIENT=0x104FCb93B5e097F92c93Ee4621C487C6C953D212   # 可选，默认值如下
#   bash scripts/ops/ttg-transfer-team-15pct-single-address.example.sh
#
# 干跑（不广播）：设 TTG_TRANSFER_TEAM_DRY_RUN=1
set -euo pipefail

TOK="${GOVERNANCE_TOKEN_ADDRESS:?set GOVERNANCE_TOKEN_ADDRESS}"
RPC="${CHAIN_RPC_URL:?set CHAIN_RPC_URL}"
PK="${PRIVATE_KEY:?set PRIVATE_KEY}"
TO="${TTG_TEAM_ALLOCATION_RECIPIENT:-0x104FCb93B5e097F92c93Ee4621C487C6C953D212}"

TS_HEX="$(cast call "$TOK" "totalSupply()(uint256)" --rpc-url "$RPC")"
export TS_HEX
AMOUNT_HEX="$(python3 -c "import os; h=os.environ['TS_HEX'].strip(); n=int(h,16); print(hex(n*15//100))")"

echo "GOVERNANCE_TOKEN_ADDRESS=$TOK"
echo "totalSupply=$TS_HEX"
echo "team_15pct_wei=$AMOUNT_HEX"
echo "recipient=$TO"

if [[ "${TTG_TRANSFER_TEAM_DRY_RUN:-}" == "1" ]]; then
  echo "TTG_TRANSFER_TEAM_DRY_RUN=1 — 跳过 cast send"
  exit 0
fi

cast send "$TOK" "transfer(address,uint256)" "$TO" "$AMOUNT_HEX" --rpc-url "$RPC" --private-key "$PK"
