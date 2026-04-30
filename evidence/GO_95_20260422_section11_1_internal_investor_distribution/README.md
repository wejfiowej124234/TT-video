# GO_95 — §11.1「Internal 投资分录（investor distribution）」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/investor_distribution.rs`**（**B-086 / B-088 / B-115-3** 头注释）与 **`routes/internal/mod.rs`**/**`routes/governance/router.rs`** 挂载；与 **04**、**域 J** **`distribution-accruals`** 叙事同源；**不**在本文闭 **§8.2 F-029** / **indexer-tick 主网** / **治理 UI 人验**。

## 1. 路由与 `merge` 挂载

### 1.1 Internal（**`internal::router()`** 首段 **`.merge`**）

| 方法 | 路径 |
|------|------|
| POST | `/api/v1/internal/investor-distribution-accrual` |
| POST | `/api/v1/internal/investor-distribution-register-accrual` |

**源码**：**`investor_distribution::internal_router()`**；**`crates/api/src/routes/internal/mod.rs`** **`router()`** 首行 **`.merge(crate::routes::investor_distribution::internal_router())`**。

### 1.2 Governance 只读（**`governance::router()`** 内 **`.merge`**）

| 方法 | 路径 |
|------|------|
| GET | `/api/v1/governance/investor-distribution-accruals` |

**源码**：**`investor_distribution::governance_router()`**；**`crates/api/src/routes/governance/router.rs`** **`.merge(crate::routes::investor_distribution::governance_router())`**（与 **proposals**/**`governance_investor_share`** 等并列）。

## 2. 机读命令与诚实边界

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| **`routes::investor_distribution`** 子集 | **`cargo test -p traveltrust-api 'routes::investor_distribution::' -- --test-threads=1`** → **10 passed**（含 **`b086_*`** / **`b088_*`** / **`b1153_*`** / **`b1155_*`** / **`governance_accruals_placeholder_without_db`** 等；部分用例需 **`DATABASE_URL`** + 迁移，见源码 **`#[tokio::test]`** 体） |
| 路由契约门禁 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |

**诚实边界**：

- 本文**卫星 `[x]`** 仅表 **路由面 + `routes::investor_distribution::tests` 机读**；**不**升格 **§8.2 F-029** **READY**/**行完成**；**不**替代 **110 / Runbook** **indexer-tick** 真链终验。  
- **`GET …/investor-distribution-accruals`** 与 **§11.1** 仍开的 **「Governance 扩展只读」**（**`fee-routes`/`vault-forwards`/…** 整段对拍）**正交** — 本包**不**因 **accruals** 单路径勾掉该 **`[ ]`**。  
- **域 J** **`buildGovernanceInvestorDistributionAccrualsUrl`** 等前端 ↔ **04** 全量人验**不**由本 README 替代。
