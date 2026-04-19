# Runtime Chain SSOT · cast 只读接线校验 — 证据包（第 4 跑）

**脚本**：`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`  
**运行时刻（UTC）**：2026-04-16T11:24:02Z  

## Explorer 侧结论（与 `GET /meta` → `fee_router_address` 同源性）

- **Blockscout Sepolia** `account&action=txlist`，部署者 **`0x104FCb93B5e097F92c93Ee4621C487C6C953D212`**。  
- 区块 **10669413** 内 **nonce 0→2** 为 **GovernanceVotesToken**、**GovernanceTimelock**、**TravelTrustGovernor**；**同批无 FeeRouter 合约创建**。  
- **详细摘录**：`evidence/runtime_chain_ssot_verify/SEPOLIA_DEPLOYER_BLOCKSCOUT_NOTE.md`  
- 因此 **本环境** **无法** **从** **治理专用** **部署批次** **得到** **可填** **`.env`** **的 **`FEE_ROUTER_ADDRESS`** **；** **须** **全栈 **`Deploy.s.sol`** **（** **或** **等价** **）** **运维** **记录** **中的** **FeeRouter** **地址** **。**

## 结论

- **`exit_code=0`**：**Governor / Timelock / GovernanceVotesToken** 三角与 **Sepolia** **RPC** 链上引用 **一致**；**`CHAIN_ID`** **与** **`cast chain-id`** **一致**（**11155111**）。
- **`FEE_ROUTER_ADDRESS`**：**未** **配置**；脚本 **WARN** 并 **跳过** **`feeRouter.owner()==Timelock`**。

## 稳定对外表述（与 `release_proof.json` 同源）

**当前版本已完成源码、观测、测试网执行与治理栈运行时接线四层闭环；FeeRouter 因不在本次治理栈部署批次中，其 owner 对拍待全栈部署地址补齐后并入。** 加强版见 **`evidence/GO_FINAL_20260416/release_proof.json`** 的 **`four_layer_closure_external_line_interview_zh`**。

## 产物

- **`console.txt`**：完整输出（**不含**私钥）。
