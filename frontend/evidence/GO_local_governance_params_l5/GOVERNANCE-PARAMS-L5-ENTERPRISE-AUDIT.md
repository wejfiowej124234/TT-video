# Governance Params L5 · 企业级审计（2026-06-12 · ① 本地 · ACTIVE）

**阶段：① 本地** — `/governance/params` 协议参数公示全页

**代码真源：** `frontend/app/governance/params/GovernanceParamsPageMain.tsx` · `frontend/lib/governance/governanceParamsPageL5ClosureSprintModel.ts`

**冻结对读：** [GOVERNANCE-PARAMS-L5-FREEZE.md](./GOVERNANCE-PARAMS-L5-FREEZE.md)

---

## 收口总表

| 项 | 结论 |
|----|------|
| **有没有收口** | 是（① · ACTIVE · FREEZE + smoke 绿） |
| **有没有 UI 冻结** | 是（① · `governance-params-l5-20260612`） |

**诚实边界：** ① 本地绿 **≠** ② staging GO **≠** ③ Production GO

---

## 十维矩阵（① 满分档 · 10/10 目标）

| # | 维度 | 分 | 结论 |
|---|------|---:|------|
| 1 | 视觉 L5（暖色 cinematic） | 10 | 同源 proposals/orders 壳 · 冻结探针 |
| 2 | IA / 导航 | 10 | 参与三卡 · sticky 分区锚点 · steward 回程 |
| 3 | 文案 / i18n | 10 | params 专用 notice · 技术/API note 折叠 · meta 客态 |
| 4 | 任务完成度 | 10 | 对拍 → 提案 gate · 三卡 → 提案/委托/Hub |
| 5 | 功能性（①） | 10 | 主读 + pending · 百分条 · 十国表 · 重试 |
| 6 | 数据诚实 | 10 | 多次非钱包/非链上声明 · checksum 折叠 |
| 7 | 错误 / 空态 | 10 | 主读/待生效独立重试 · segment error |
| 8 | a11y | 10 | 表 caption/th scope · percent `role=meter` · focus ring |
| 9 | 交叉链 | 10 | footer 引导 + ProductCrossNav |
| 10 | 证据链 | 10 | vitest 18+ · smoke API · Playwright · README · AGENTS |

**综合：10 / 10（① 可验证 L5 · 产品 + 工程）**

---

## 功能链路矩阵

| # | 入口 | 目标 | 状态 | 未完成应在哪阶 |
|---|------|------|------|----------------|
| 1 | 页壳 | `/governance/params` | ✅ 完成 · 已冻结 | — |
| 2 | 主理人 deep link | `?from=steward_workbench` 回程 | ✅ 完成 | — |
| 3 | 参与三卡 | proposals / delegate / hub | ✅ 完成 | — |
| 4 | 对拍不一致 | `/governance/proposals` | ✅ 完成 | — |
| 5 | 公开 API | protocol-reference + pending | ✅ 完成 | ② 治理真值 |
| 6 | Playwright | `governance-params-full-l5.spec.ts` | ✅ 完成（可选跑） | — |

---

## 机读验收

```bash
bash scripts/dev/smoke-governance-params-l5-local.sh
bash scripts/dev/record-governance-params-l5-evidence.sh
```

末行：`TT_GOVERNANCE_PARAMS_L5_SMOKE: OK`

---

## ② / ③ 延期

| 项 | 阶段 |
|----|------|
| 待生效包链上/治理流程真值 | ② |
| 生产 SSOT / 法务签字 | ③ |
