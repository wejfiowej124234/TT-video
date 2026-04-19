# Sepolia · 部署者交易列表（FeeRouter 是否存在）

**目的**：回答「能否从 Explorer 拿到与 **`GET /meta` → `fee_router_address`** 同源的 **`FEE_ROUTER_ADDRESS`**」——**在仅运行 **`DeployGovernanceStack`** 的批次下**，**链上** **无** **同部署者** **创建的 **`FeeRouter`** **合约**。

## 数据源

- **Blockscout Sepolia** HTTP API：`module=account&action=txlist`
- **部署者 EOA**（与 **`GovernanceTimelock.admin()`** 同源）：**`0x104FCb93B5e097F92c93Ee4621C487C6C953D212`**
- **代表性 URL**（查询参数可调整）：  
  `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=0x104FCb93B5e097F92c93Ee4621C487C6C953D212&page=1&offset=30&sort=desc`

## 结论（摘录同一区块内的合约创建）

在 **blockNumber `10669413`** 中，自 **nonce 0→2** 的 **contract creation** 为：

| nonce | contractAddress（新合约） | 说明 |
|------|---------------------------|------|
| 0 | `0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7` | GovernanceVotesToken |
| 1 | `0x1E94f265106521B009aD395525cF87Ed00dd84a6` | GovernanceTimelock |
| 2 | `0xcAc92Fb6c9594CE4a72bE90D3B7FF0B9ca33FE5b` | TravelTrustGovernor |

**该部署批次中未出现 `FeeRouter` 部署交易**，因此 **无法** 为本环境 **`.env`** **凭空** **写入** **与 **`DeployGovernanceStack`** **同批** **的 **`FEE_ROUTER_ADDRESS`**。

## 与 `runtime-chain-ssot-cast-verify.sh` 的关系

- **治理三角**（`governor.token` / `governor.timelock` / `timelock.governor`）**可** **完整** **对拍** **（** **`exit_code=0`** **）** **。**
- **`feeRouter.owner()==Timelock`** **须** **另** **有** **全栈 **`Deploy.s.sol`** **（** **或** **等价** **）** **部署** **的 **`FeeRouter`** **地址** **；** **填入 **`FEE_ROUTER_ADDRESS`** **后** **再** **跑** **脚本** **即可** **并入** **同一** **腿** **。**
