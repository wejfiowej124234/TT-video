# Runtime Chain SSOT · cast 只读接线校验 — 证据包（第 2 跑）

**脚本**：`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`  
**运行时刻（UTC）**：2026-04-16T11:16:23Z（目录名 `run_*`）  
**仓库 `git rev-parse --short HEAD`**：`f267483`（运行当时）。

## 相对第 1 跑（`run_20260416T110557Z`）的变化

- **`.env` 已正式包含** **`TIMELOCK_ADDRESS`**（**DeployGovernanceStack** 同次 **GovernanceTimelock**），**不再**依赖单次 shell 内 **`cast governor.timelock()`** 注入。
- **`FEE_ROUTER_ADDRESS`**：**仍** **未** **配置**。**`DeployGovernanceStack.s.sol`** **不** **部署** **FeeRouter**；**`FeeRouter.owner()==Timelock`** **属于** **`Deploy.s.sol`** **全栈** **批次** **与** **Runbook §7.1** **接线**。脚本行为：**WARN** 并 **跳过** **`feeRouter.owner`** **对拍**（**`exit_code=0`**，治理三角仍 **OK**）。

## 结论

- **`exit_code=0`**：**Governor / Timelock / GovernanceVotesToken** 引用与链上 **一致**；**`CHAIN_ID`** **与** **`cast chain-id`** **一致**（**11155111**）。
- **FeeRouter 腿**：未执行；补齐 **`FEE_ROUTER_ADDRESS`**（与 **`GET /meta` → `fee_router_address`** 同源）后 **再跑** **本脚本** **可** **消除** **WARN** **并** **纳入** **同一** **证据** **形态**。

## 产物

- **`console.txt`**：完整输出（**不含**私钥）。

## 与其它闭环的边界

- 本证据：**运行时接线**（RPC 上治理栈自洽 + 可选 FeeRouter.owner）。
- **不替代**：**Explorer** **/** **运维台账** **对** **「** **最新** **部署** **批次** **」** **的** **确认**。
