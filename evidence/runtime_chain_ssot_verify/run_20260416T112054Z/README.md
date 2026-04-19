# Runtime Chain SSOT · cast 只读接线校验 — 证据包（第 3 跑）

**脚本**：`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`  
**运行时刻（UTC）**：2026-04-16T11:20:54Z  
**仓库 `git rev-parse --short HEAD`**：`f267483`（与 **`release_proof.json`** 同批更新时工作区）。

## 结论

- **`exit_code=0`**：**Governor / Timelock / GovernanceVotesToken** 三角与 **Sepolia** **RPC** 链上引用 **一致**；**`CHAIN_ID`** **与** **`cast chain-id`** **一致**（**11155111**）。
- **`FEE_ROUTER_ADDRESS`**：**未** **配置**；脚本 **WARN** 并 **跳过** **`feeRouter.owner()==Timelock`**。**链上** **未** **在** **近期** **区块** **检索到** **`PlatformFeeRouted`** **（** **无** **`distribute`** **活动** **）** **，** **且** **仓库** **/** **RPC** **未** **解析出** **与** **本** **Timelock** **同** **全栈** **批次** **的** **FeeRouter** **部署** **地址** **；** **须** **从** **全栈** **`Deploy.s.sol`** **部署** **记录** **或** **Explorer** **人工** **填入** **`.env`** **后** **再** **跑** **本** **脚本** **以** **并入** **同一** **腿** **。**

## 稳定对外表述（与 `release_proof.json` 同源）

**治理栈四层闭环已成立，FeeRouter 运行时 owner 对拍待全栈部署地址补齐后并入。**

## 产物

- **`console.txt`**：完整输出（**不含**私钥）。
