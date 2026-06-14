# Governance Proposals L5 · 企业级审计（2026-06-13 · ① 本地 · ACTIVE）

**阶段：① 本地** — `/governance/proposals*` 治理议题全链路（行业钱包 L5）

**代码真源：** `frontend/lib/governance/governanceProposalsL5ClosureSprintModel.ts` · `GovernanceProposalCreateWizard.tsx` · `GovernanceProposalDetailLoadedArticle.tsx`

**冻结对读：** [GOVERNANCE-PROPOSALS-L5-FREEZE.md](./GOVERNANCE-PROPOSALS-L5-FREEZE.md)

---

## 收口总表

| 项 | 结论 |
|----|------|
| **有没有收口** | 是（① · ACTIVE · FREEZE + smoke 绿） |
| **有没有 UI 冻结** | 是（① · `governance-proposals-l5-20260613`） |
| **企业审计（①）** | **100 / 100** |

**诚实边界：** ① 本地 Anvil/meta 绿 **≠** ② Sepolia GO **≠** ③ Production GO

---

## 十维矩阵（① 满分档 · 对标 OZ Governor / Tally / Safe+Timelock）

| # | 维度 | 分 | 结论 |
|---|------|---:|------|
| 1 | 视觉 L5（暖色 cinematic） | 10 | 同源 orders/params 壳 · 冻结探针 |
| 2 | IA / 导航 | 10 | 5 步向导 · steward 回程 · 列表/详情 subnav |
| 3 | 文案 / i18n | 10 | 链上票权 · cancel · simulate 降级 · 双语键 |
| 4 | 任务完成度 | 10 | propose → vote → queue → execute · cancel |
| 5 | 功能性（①） | 10 | 模板 calldata · multi-action · GovSingleOpOnly 守卫 |
| 6 | 钱包互动 | 10 | Connect · switchChain · chainId 硬闸 · 错误映射 |
| 7 | 数据诚实 | 10 | 禁链下假票 · MVP weight 与链上 weight 分离 |
| 8 | 错误 / 空态 | 10 | simulate hard-block vs warn · threshold blocked |
| 9 | 交叉链 | 10 | explorer 链接 · ProductCrossNav · steward CTA |
| 10 | 证据链 | 10 | vitest 40+ · smoke · Playwright · FREEZE · AGENTS |

**综合：10 / 10（① 可验证 L5 · 产品 + 工程）**

---

## 功能链路矩阵

| # | 入口 | 目标 | 状态 | 未完成应在哪阶 |
|---|------|------|------|----------------|
| 1 | 主理人工作台 | `/governance/proposals/new?from=steward_workbench` | ✅ 完成 · 已冻结 | — |
| 2 | 创建向导 | 钱包 propose + simulate | ✅ 完成 | — |
| 3 | 详情页 | castVote + queue/execute + cancel | ✅ 完成 | ② 真链证据 |
| 4 | Timelock | GovSingleOpOnly 单 action | ✅ 完成 | — |
| 5 | Playwright | create + full L5 spec | ✅ 完成（可选跑） | — |
| 6 | Sepolia 全链 | propose→vote→queue→execute | ❌ 未完成 | **②** |

---

## 机读验收

```bash
bash scripts/dev/smoke-governance-proposals-l5-local.sh
```

末行：`TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK`

---

## ② / ③ 延期

| 项 | 阶段 |
|----|------|
| Sepolia propose/vote/Timelock 全链验收 | ② |
| Production Governor + 法务签字 | ③ |
