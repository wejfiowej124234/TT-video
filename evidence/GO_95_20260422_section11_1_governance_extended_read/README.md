# GO_95 — §11.1「Governance 扩展只读」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/governance/router.rs`** — **`GET …/governance/fee-routes`**、**`vault-forwards`**、**`fee-pool-aggregates`**、**`protocol-reference*`**、**`params`**、**`pool`**/**`rewards`** 及 **`.merge`** 的 **proposals**/**`governance_investor_share`**（**`investor-share-reconcile`**）/**`investor_distribution`**（**`investor-distribution-accruals`**）/**delegate**/**`voting-power`**/**`country-ledger`** 等；与 **04**、**14**、**域 J** 表行同源牵引；**不**替 **83/84**/**主网**/**治理 UI** 人验终局。

## 1. `governance::router()` 挂载摘要

**源码**：**`routes/governance/router.rs`** **`pub fn router()`** — 内联 **`fee-routes`** / **`vault-forwards`** / **`fee-pool-aggregates`** / **`protocol-reference`**（**`/pending`**）/**`params`**；**`.merge`** **`governance_proposals`**、**`governance_investor_share`**、**`investor_distribution::governance_router()`**（**`GET …/investor-distribution-accruals`**）、**`governance_delegate`**、**`governance_voting_power`**、**`governance_country_ledger`**。

## 2. 机读命令与诚实边界

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| **Read Contract**（**`fee-routes`/`vault-forwards`/…** 列表形与 **`SourceKind`**） | **`cargo test -p traveltrust-api governance_read_contract_contract_tests -- --test-threads=1`** → **7 passed** |
| **FeeRouter 投影表 UT** | **`cargo test -p traveltrust-api fee_router_events:: -- --test-threads=1`** → **5 passed** |
| **RegionVault 投影表 UT** | **`cargo test -p traveltrust-api region_vault_events:: -- --test-threads=1`** → **3 passed** |
| **`investor-share-reconcile` HTTP 占位** | **`cargo test -p traveltrust-api governance_investor_share:: -- --test-threads=1`** → **2 passed** |
| 路由契约门禁 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |

**诚实边界**：

- **`GET …/investor-distribution-accruals`** 全量子集 **`Router::oneshot`**/**PG** 以 **`routes::investor_distribution`** **10 passed** 为主链旁证（**§11.1 Internal 投资分录**）；本文**不**重复加计为 **Governance** 独占闭证。  
- **§7.4** 历史旁证 **[`…section7_4_fee_router_region_vault_governance_read/README.md`](../GO_95_20260421_section7_4_fee_router_region_vault_governance_read/README.md)** 与本文 **同域不同批次**；大版本可择一为主链引用，**禁止**双计 **U/C** 分子。  
- **不**表示 **proposals**/**delegate**/**country-ledger** 等 **merge** 子树已 **§8.2 行完成**；**不**替代 **staging `curl`**/**浏览器**/**93·C** 治理抽检。
