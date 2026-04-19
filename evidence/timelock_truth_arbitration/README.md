# Timelock 真源裁断（母表 B-434 · TT-B434）

**状态**：**已裁断**；**当前机读真源** **→** **[`decision_record.v3.json`](decision_record.v3.json)**（**`supersedes`** **[`decision_record.v2.json`](decision_record.v2.json)**）  
**上一版（归档）**：[`decision_record.v2.json`](decision_record.v2.json)（**`supersedes`** **[`decision_record.v1.json`](decision_record.v1.json)**）  
**历史记录（仅归档）**：[`decision_record.v1.json`](decision_record.v1.json)  
**Runbook**：[`docs/runbook/TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md`](../../docs/runbook/TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md)

---

## 裁断结论（写死 · 以 v3 为准）

| 字段 | 值 |
|------|-----|
| **`timelock_truth_decision`** | **`B`**（**唯一** **`GovernanceTimelock`** **真源** **；** **须** **含** **B-407** **`setAllowedExecutionTarget`** **） |
| **链** | **Sepolia** **`chain_id`** **11155111** |
| **选定 `TIMELOCK_ADDRESS`（canonical）** | **`0x726EA62833EbC1DC4FA3A69cDcfA490b7C619874`** **（** **v3** **）** |
| **同栈引用（与裁断一致）** | **Governor** **`0x9FC8265EF33E6273C3786341E5f20D59C518F316`** · **GovernanceVotesToken** **`0x9f88A0072319C5d5C6eC1C61082288F6B86511A2`** |

**v2** **（** **`0x55fd…`****/**`0x247a…`****/**`0x3d8e…`** **）** **已** **由** **v3** **取代** **：** **见** **[`decision_record.v3.json`](decision_record.v3.json)** **`rationale_summary_zh`** **。**

---

## 运维硬约束（定版后必须遵守）

1. **禁止** **将** **vanilla** **`forge script … Deploy.s.sol --broadcast`** **整包** **产出** **中的** **「** **新** **`GovernanceTimelock`** **地址** **」** **与** **当前** **`GOVERNOR_ADDRESS`** **/** **`TIMELOCK_ADDRESS`** **混** **为** **同一** **套** **环境** **真值** **。**
2. **全栈** **资金** **合约** **（** **FeeRouter** **/** **池** **/** **RegionVault** **/** **Treasury** **等** **）** **必须** **以** **上表** **canonical** **Timelock** **为** **owner** **/** **spender** **/** **Timelock** **执行** **白名单** **目标** **接线** **（** **分步** **部署** **/** **定制** **脚本** **/** **迁移** **，** **按** **[** **`TT-B435`** **](../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)** **）** **。**
3. **目标** **环境** **`GET /meta` → `chain.contracts.timelock_address`** **须** **与** **canonical** **一致** **后** **再** **宣称** **闭环** **。**

---

## 下一动作（TT-B435）

**执行** **[** **`TT-B435`** **](../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)** **：** **使用** **仓库** **脚本** **[** **`contracts/script/DeployFundStackUnderTimelock.s.sol`** **](../../contracts/script/DeployFundStackUnderTimelock.s.sol)** **（** **勿** **原版** **`Deploy.s.sol`** **整包** **）** **，** **再** **填** **`.env`** **/** **`GET /meta`** **、** **关** **mock** **、** **跑** **真实** **扣款** **与** **观测** **对拍** **。**
