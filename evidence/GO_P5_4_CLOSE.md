# P5-4 收口证据索引（应计分录叙事 + Claim 治理前端 · Epic P5-4-1/2/3 · 母表/台账总卷）

**锚点 ID**：**`TT-DOC-P5-4-PM-CLOSE-001`**

**过门口径**：**Epic P5-4** 在 **不改动** 已封口 **B-115** / **B-116** / **P5-1** / **P5-2** / **P5-3** / **P5-5** **实现**、**不**改写 **`InvestorDistributionClaim`** **合约语义**、**不**经浏览器暴露 **`registerAccrual`** 或 **任何 `POST …/internal/*` 写路径**、**不**把 **`fee-pool-aggregates` Σ** **冒充** 应计/Claim 主叙事的前提下，交付 **①** 链上 Claim 最小钱包交互（**P5-4-1**）、**②** 治理 **GET** 应计分录只读 UI（**P5-4-2**）、**③** 路由门禁与文档/母表/README 互指闭环（**P5-4-3 · 本卷**）。

**叙事互指**：[**04 · P5-4**](../docs/spec/04-后端与API.md#p5-4-epic-governance-distribution)、[**04 §3.4 前端路由表**](../docs/spec/04-后端与API.md)（**`/governance/distribution-accruals`**、**`/governance/distribution-claim`**）、[**13-1 表 2-续**](../docs/spec/13-1-UI产品级SSOT与页面规范.md)、分配域封口仍归 **B-115** — [**GO_B115_CLOSE.md**](GO_B115_CLOSE.md)。

**收口日期**：2026-04-09

## 子卡完成情况（P5-4-1 / P5-4-2 / P5-4-3）

| 代号 | 交付摘要 | 权威入口 / 验收 |
|------|----------|-----------------|
| **P5-4-1** | **`InvestorDistributionClaim`**：**`NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS`**；**`claim` / `withdrawDividend`** 写路径；**`distributionToken` / `claimable` / …** 只读；**`useSimulateContract`** 预检；**不**封装 **`registerAccrual`** | **`frontend/app/governance/distribution-claim`**、**`frontend/dapp/hooks/useInvestorDistributionClaimWrite.ts`**、**`frontend/dapp/abis/InvestorDistributionClaim.json`**；**`distributionClaimPage.contract.test.ts`** |
| **P5-4-2** | **应计分录只读**：**仅** **`GET /api/v1/governance/investor-distribution-accruals`**（**`buildGovernanceInvestorDistributionAccrualsUrl`**）；列表/详情；**不**调用 **`/internal/`** | **`frontend/app/governance/distribution-accruals`**、**`frontend/lib/governanceInvestorDistributionAccruals.ts`**；**`distributionAccrualsPages.contract.test.ts`** |
| **P5-4-3** | **门禁与台账**：**04 · P5-4**、本 **GO**、**evidence/README**、**任务母表**、**CONTRIBUTING** / **README** 可点击链；**`run-check-04-routes.sh`** 锁 **04 §3.4** 前端表 | 本文档；**[04 · P5-4](../docs/spec/04-后端与API.md#p5-4-epic-governance-distribution)** |

## 与 B-115 / B-116 / P5-1 / P5-2 / P5-3 / P5-5 边界（冻结）

| 域 | P5-4 允许 | **禁止** |
|----|-----------|----------|
| **B-115** | 前端 **只读** 消费已公开 **GET**；链上 **Claim** 由用户钱包调已部署合约 | **不**改 **accrual 表结构**、**不**改 **`register-accrual` / `registerAccrual`** **链上/链下封口语义** |
| **B-116** | **正交** | **不**改 **`fee-pool-aggregates` Σ** 主语义；**不**把 Σ **当作** 应计页主叙事 |
| **Claim 合约** | ABI 与 **`claim`/`withdrawDividend`** / **`claimable`** 等对读 | **不**改 **Solidity** **行为与错误定义**（本 Epic **仅前端+文档**） |
| **internal** | — | 浏览器 **不**调用 **`POST …/internal/*`** **写路径**；**不**在 UI 实现 **owner 登记** |
| **P5-1 / P5-2 / P5-3 / P5-5** | 并列 Epic，导航互指 | **不**改写其已封口 **实现** |

## 验收命令（可复核 · P5-4-3）

```bash
cd frontend && npm test -- --run
bash scripts/run-check-04-routes.sh
```

**说明**：**P5-4-1/2** 的 Vitest 含 **契约单测**（页面源码 **无** **`/api/v1/internal/`**、写 ABI **无** **`registerAccrual`**）；**`run-check-04-routes`** 与 **Build** CI 同源，锁 **04 §3.4** 前端路径与 **`frontend/app`** 一致。

## 台账互指（可点击）

| 文档 | 锚点 |
|------|------|
| **04 · P5-4** | [**docs/spec/04-后端与API.md · P5-4**](../docs/spec/04-后端与API.md#p5-4-epic-governance-distribution) |
| **任务母表** | [**docs/任务母表.md**](../docs/任务母表.md) 检索 **P5-4** / **P5-4-1** / **P5-4-2** / **P5-4-3** |
| **evidence 入口** | [**README · P5-4 Epic**](README.md#p5-4-epic-governance-distribution-claim-ui) |
| **贡献指南 · 路由** | [**CONTRIBUTING.md · 路由与契约**](../CONTRIBUTING.md) |
| **分配域封口（仍归 B-115）** | [**GO_B115_CLOSE.md**](GO_B115_CLOSE.md) |

## 明确排除（非 P5-4 本卷）

- **`RegionDistributionClaim`** 独立产品页（与 **Investor** 合约 **地址正交**；当前前端 **未**强制双挂载）
- **链上实跑留痕**（tx hash 入 **`evidence/GO_YYYYMMDD/`**）**非**本静态 GO 必选项；值班可按 **Runbook** 另卷归档
