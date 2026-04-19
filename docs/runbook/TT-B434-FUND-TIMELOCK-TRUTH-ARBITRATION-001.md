# TT-B434 · B-434 — 全栈资金主线：Timelock 真源裁断（先母表、后部署）

**母表**：`B-434`  
**卡号**：`TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001`  
**日期**：2026-04-16  

**裁断已落盘（** **2026-04-16** **）** **：** **[`evidence/timelock_truth_arbitration/README.md`](../../evidence/timelock_truth_arbitration/README.md)** **/** **[`decision_record.v1.json`](../../evidence/timelock_truth_arbitration/decision_record.v1.json)** **（** **`timelock_truth_decision`** **=** **`B`** **）** **。**

---

## 0. 定位（为什么必须先开这张卡）

`contracts/script/Deploy.s.sol` **单次广播**会 **`new GovernanceTimelock`** 并再部署 **FeeRouter / RegionVault / 双池 / Treasury / ReserveVault** 等，与 **`DeployGovernanceStack.s.sol`** **仅** **部署** **GovernanceVotesToken + GovernanceTimelock + TravelTrustGovernor** **是两条脚本线**。若在未裁断 **「哪套 `GovernanceTimelock` 为唯一真值」** 的情况下直接跑全栈广播，会出现 **两套地址并存**，**观测 / meta / B-417 / B-431** 易形成 **「看起来闭环、实际上双套部署」** 的假真值。

**本卡只解决一件事**：书面裁断 **Timelock 真源与后续部署策略**，**不**在此卡内实现 **新合约逻辑**（**不**默认改 `crates/**` 业务代码）。

---

## 1. 依赖与真源（读前 ≤8 路径）

| 路径 | 用途 |
|------|------|
| [`contracts/script/Deploy.s.sol`](../../contracts/script/Deploy.s.sol) | 全栈经济批次；内含 **新 Timelock → FeeRouter.owner** 等 |
| [`contracts/script/DeployGovernanceStack.s.sol`](../../contracts/script/DeployGovernanceStack.s.sol) | 治理栈；**无** FeeRouter |
| [`evidence/GO_FINAL_20260416/SPEC_89_81_84_CODE_ALIGNMENT.md`](../../evidence/GO_FINAL_20260416/SPEC_89_81_84_CODE_ALIGNMENT.md) | **Deploy.s.sol** 与 **Governor/Token** 脚本分工 |
| [`evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md`](../../evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md) | 运行时七键 / cast 自检 |

---

## 2. 裁断选项（必须二选一或等价书面第三方案）

| 方案 | 含义 | 主要成本 / 风险 |
|------|------|------------------|
| **A · 新 Timelock 为真** | 以 **`Deploy.s.sol`** **同批** **`GovernanceTimelock`** **作为** **经济 + 治理** **统一** **Timelock** **真源** | 须 **迁移或重部署** **Governor / Token** **与** **之** **绑定** **（** **或** **接受** **新** **治理** **栈** **）** **；** **旧** **Sepolia** **治理** **地址** **作废** **须有** **台账** **。** |
| **B · 现有治理 Timelock 为真** | **保留** **当前** **`TIMELOCK_ADDRESS`** **（** **DeployGovernanceStack** **）** **；** **FeeRouter** **/** **池** **/** **RegionVault** **等** **须** **对** **该** **Timelock** **接线** **（** **定制** **脚本** **/** **分步** **部署** **/** **迁移** **）** | **禁止** **把** **默认** **`Deploy.s.sol`** **整包** **输出** **不经** **证明** **写** **入** **与** **现有** **`GOVERNOR_ADDRESS`** **混用** **的** **`.env`** **。** |

**输出物（验收）**：一份 **书面** **裁断记录**（可落在 `evidence/` 子目录或运维台账），至少包含：

- **`timelock_truth_decision`**：`A` | `B` | **（** **等价** **第三** **方案** **标题** **）**
- **选定 Timelock 地址**（**与** **目标** **环境** **`GET /meta` → `chain.contracts.timelock_address`** **一致** **的** **承诺** **）**
- **影响范围**：**七键**、**B-417** **证据**、**B-431** **Foundry** **/** **测试网** **是否** **需要** **重** **锚** **或** **新** **跑**
- **责任人 + 日期**

---

## 3. 本轮允许改动范围（执行 TT-B434 时）

- **Runbook** / **母表** / **`.env.example` 注释** / **`RUNTIME_CHAIN_SSOT_CHECKLIST.md` 指针** / **evidence 裁断记录**  
- **禁止**：跳过本裁断 **直接** **以** **`Deploy.s.sol`** **广播** **结果** **作为** **唯一** **生产** **真值** **而不** **处理** **与** **现有** **治理** **栈** **的** **关系**

---

## 4. 下一卡依赖

**[`TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)** **须** **在** **本** **卡** **§2** **输出物** **齐备** **后** **才** **可** **进入** **执行** **态** **。**

---

## 5. 验收封口（本 TT）

- [x] **母表** **[`B-434`](../任务母表.md)** **行** **状态** **与** **本** **Runbook** **互指**  
- [x] **书面** **`timelock_truth_decision`** **（** **或** **同义** **字段** **）** **已** **落盘** **（** **`evidence/timelock_truth_arbitration/`** **）**  
- [x] **团队** **明确** **：** **裁断** **前** **不** **将** **vanilla** **`Deploy.s.sol`** **整包** **广播** **为** **唯一** **运维** **真值** **；** **定版** **后** **按** **`B`** **执行** **接线** **（** **下一** **步** **`TT-B435`** **）**

---

**AI 一句话**：先钉死 **一套 Timelock**，再谈 **FeeRouter / 池子**；否则 **双套地址** **必** **污染** **meta** **与** **对账** **。
