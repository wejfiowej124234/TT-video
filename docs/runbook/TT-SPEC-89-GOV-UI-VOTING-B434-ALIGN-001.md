# TT-SPEC-89-GOV-UI-VOTING-B434-ALIGN-001 · 89 治理 UI：投票面板与 B-434 v3 确定版对齐

**卡号**：`TT-SPEC-89-GOV-UI-VOTING-B434-ALIGN-001`  
**母表**：**B-437**（[`docs/任务母表.md`](../任务母表.md)）  
**类型**：spec 落地 · 前端治理 · 链上真值对齐  
**日期**：2026-04-17  
**状态**：未封口（**spec** **v2.0.9** **已定稿**；**实现** **待** **本卡** **验收**）

---

## 1 · 权威规格

- **[`docs/spec/89-治理UI-全球旅游市场治理控制台设计规格.md`](../spec/89-治理UI-全球旅游市场治理控制台设计规格.md)** — **§5.3**（投票面板与链上确定版）、**§8.3**、**§十一**、**§十四**  
- **合约**：[`contracts/src/TravelTrustGovernor.sol`](../../contracts/src/TravelTrustGovernor.sol)、[`contracts/src/GovernanceVotesToken.sol`](../../contracts/src/GovernanceVotesToken.sol)、[`contracts/src/GovernanceTimelock.sol`](../../contracts/src/GovernanceTimelock.sol)  
- **运维三键**：[evidence/timelock_truth_arbitration/decision_record.v3.json](../../evidence/timelock_truth_arbitration/decision_record.v3.json)（**B-434 v3**），与 **`GET /meta` → `chain.contracts`** **同源**  
- **并列任务卡**：**TT-B408**（影响面板 parity）、**TT-B432**（治理 UI 路由门闸）、**TT-B428**（质押→治理演示）

---

## 2 · 范围（本轮）

- **`/governance/proposals/:id`** 内 **`ProposalVotePanel`**（及同页 **投票** **sticky** **区**）：**选项** **Against / For / Abstain** **与** **`castVote(proposalId, support)`** **`support∈{0,1,2}`** **一致** **；** **未** **伪造** **`targets[]/calldatas[]`** **解码** **（** **仍** **遵** **89** **Partial** **TT-B408** **声明** **）** **。**  
- **钱包链 ID**、**Governor/TTG/Timelock** **地址** **与** **meta** **一致** **。**  
- **委托** **入口** **`/governance/delegate`** **与** **04 §3.4** **一致** **（** **若** **路由** **已** **登记** **）** **。**

**非本轮**（**不** **扩** **scope** **）：** **提案创建器** **全** **§四** **wizard** **；** **Region** **地图** **全** **§八** **子页** **。**

---

## 3 · 验收（可勾选）

- [ ] **§5.3** **表** **与** **实现** **无** **冲突** **（** **合约** **名** **/** **`support`** **枚举** **）**  
- [ ] **Active** **提案** **在** **投票窗口** **内** **可** **`castVote`** **；** **窗口** **外** **/** **已** **投** **/** **零** **权重** **分** **因** **提示** **（** **见** **89** **§5.2** **）**  
- [ ] **`GET /meta`** **与** **`decision_record.v3.json`** **三键** **一致** **（** **测试网** **验收** **时** **）**  
- [ ] **`bash scripts/run-check-04-routes.sh`** **通过** **（** **含** **B-432** **治理** **表面** **）**  
- [ ] **`cd frontend && npx tsc --noEmit`** **通过** **（** **若** **改** **`frontend/app/governance/**`** **）**  
- [ ] **（** **可选** **）** **`npm run test:b432`** **通过**

---

## 4 · 封口与索引

- **封口后**：迁入 [`docs/AI任务卡索引.md`](../AI任务卡索引.md) **一览** **+** **正文** **；** **母表** **B-437** **状态** **改为** **已做** **。**  
- **纯文档轮** **若** **无** **代码** **变更** **：** **仅** **抽查** **[`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417` §3](TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)** **（** **见** **[`TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md`](TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md)** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
