# TT-B382 · B-381 治理池 DB↔链对拍 — 真实链路验证

**卡号**：`TT-B382-GOVERNANCE-POOL-DRIFT-REAL-LINK-VERIFY-001` · **母表** `B-382`（承 **B-381** 实现）  
**日期**：2026-04-15  
**范围**：**运维验证 / 证据**；**不**改 **`crates/**`** 业务逻辑；**不**改 **04** 契约表（与 **B-381** 已登记句一致）。

---

## 1. 目的

在 **本地** 或 **测试链** 上证明：

1. **`POST /api/v1/internal/indexer-reconcile`** 在 **`persist:true`** 且 **`include_governance_pool_db_vs_chain_balance_drift_observability:true`** 时，**`200`** 根级 **`governance_pool_db_vs_chain_balance_drift_observability`** 与 **`persist` 写入的 `summary` 同键**（实现已保证）。
2. **`GET /api/v1/admin/observability/overview`** 的 **`overview.governance_pool_db_vs_chain_balance_drift_observability`** 自 **最新** **`orders_projection_vs_orders`** 报告 **`summary`** **回读**，与 **(1)** 中 **同一次 reconcile 响应** 内该键 **JSON 深相等**。

从而验证 **drift / aligned / incomparable / unavailable** 等 **`marker`** 在 **reconcile → 落库 → admin 展示** 链路上一致。

---

## 2. 前置条件

| 项 | 说明 |
|----|------|
| **进程** | API 已监听（例 **`http://127.0.0.1:8080`**）。 |
| **DB** | **`DATABASE_URL`** 可用；已存在 **`reconciliation_reports`** 迁移；indexer 对账路径可跑通（**`chain_off.db_pool`** 已挂）。 |
| **链** | **`CHAIN_RPC_URL`**、**`CHAIN_ID`**、**`FEE_ROUTER_ADDRESS`**（或 **`ChainConfig`** 同源配置）、**`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** 已按环境配置；与 **B110-SSOT-06** **`pool_balance`** 链上腿前提一致。 |
| **内部密钥** | 与 API 一致的 **`INTERNAL_API_SECRET`**（**`X-Internal-Api-Secret`**）。 |
| **Admin** | 具备 **admin** 角色的 **Bearer** 会话（与 **`scripts/ops/*-ops-check.sh`** 同形，**勿**入库）。 |

**说明**：若 **`governance_pool`** 无行、或 **`balance`** 不可解析、或 RPC/配置不全，**`marker`** 可能为 **`incomparable`** / **`unavailable`** —— 仍可通过本验证证明 **reconcile 与 admin 回读一致**；若需 **`drift`**，须在测试环境 **故意制造** 表内 **`balance` 词** 与链上 **`balanceOf(FeeRouter)`** 不一致（本 Runbook **不**强制注入步骤，以免误伤共享库）。

---

## 3. 推荐路径（机读一键）

项目根（**Git Bash** / Linux / macOS），已装 **`jq`**：

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="***"
export ADMIN_BEARER_TOKEN="***"
bash scripts/ops/b381-governance-pool-drift-reconcile-admin-overview-smoke.sh
```

- **退出码 `0`**：reconcile 与 overview 两段 **`governance_pool_db_vs_chain_balance_drift_observability`** **深相等**，且 **`anchor`** 为 **`381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1`**。  
- **非 0**：见脚本头注释（HTTP 错误、缺键、JSON 不一致等）。

---

## 4. 手工对照（可选）

1. **Reconcile**（与脚本同 body）：

```bash
curl -sS -X POST "${API_BASE_URL}/api/v1/internal/indexer-reconcile" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
  -d '{"persist":true,"include_governance_pool_db_vs_chain_balance_drift_observability":true}' | jq .
```

2. **Admin overview**：

```bash
curl -sS "${API_BASE_URL}/api/v1/admin/observability/overview" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" | jq .
```

3. 目视 **`marker`** / **`checks`**：应与 **`reconcile`** 根级同键对象一致（**`jq`** 深比较同上）。

---

## 5. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **母表 B-382** | [`docs/任务母表.md`](../任务母表.md) |
| **B-381 实现** | `crates/api/src/db/governance_pool_balance_drift_obs.rs` |
| **RUNBOOK §2.55** | [`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) internal indexer 与 admin 只读 |

---

## 6. 验收（本 TT 封口）

- [x] 在 **目标环境**（本地或测试链）执行 **§3** 脚本 **exit 0**。  
- [x] 记录 **`marker`** 与关键 **`checks`**（可粘贴 **jq** 输出至 PR / evidence，**勿**含密钥）。**封口留痕（2026-04-15）**：**`marker=incomparable`**（**`CHAIN_RPC_URL`** **+** **`ESCROW_FACTORY_ADDRESS`** **等** **最小** **链** **ENV** **；** **未** **配全** **`FEE_ROUTER_ADDRESS`** **/** **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** **，** **与** **§2** **说明** **一致** **）**；**`anchor=381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1`**；**脚本** **stdout** **`reconcile == admin overview`**。
