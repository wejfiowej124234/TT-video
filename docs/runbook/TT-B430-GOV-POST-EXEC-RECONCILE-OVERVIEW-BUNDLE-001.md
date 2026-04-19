# TT-B430 · 治理 execute 后 reconcile + overview 四键并列（无漂移）

**卡号**：`TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001` · **母表** **B-430**  
**范围**：**观测 / 对账 / 证据**；**不**改合约、**不**改 ABI；**不**替代 **B-424** 其它 meta/overview 门禁叙事。

---

## 1. 目的

在 **`Governor` → Timelock `execute`** **之后**（或任意需要确认「治理相关链上变更已反映到后端观测面」的窗口），按**固定顺序**：

1. **`POST /api/v1/internal/indexer-reconcile`**（**`persist:true`**，并显式打开 **B-381 / B-383 / B-384** 三个 `include_*` 开关）；
2. **`GET /api/v1/admin/observability/overview`**；

验证下列 **四** 个根级观测键在 **(1)** 的 **`200`** 响应与 **(2)** 的 **`overview.*`** 中 **JSON 深相等**（与既有 **b381/b383/b384** smoke 同形）：

| 母表 | 根键 | 锚（`anchor`） |
|------|------|----------------|
| **B-381** | `governance_pool_db_vs_chain_balance_drift_observability` | `381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1` |
| **B-383** | `fee_router_platform_fee_routed_log_count_chain_vs_db_observability` | `383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1` |
| **B-384** | `region_vault_forwarded_log_count_chain_vs_db_observability` | `384-REGION-VAULT-FORWARDED-LOG-COUNT-CHAIN-VS-DB-OBS-V1` |
| **B-415** | `fee_router_governance_fact_stream_observability` | `415-FEE-ROUTER-GOVERNANCE-FACT-STREAM-OBS-V1` |

**说明**：**B-415** **无**额外 body 开关——有 **DB** 且走完整对账分支时，**`indexer-reconcile`** **`200`** 与 **`persist` `summary`** 均含该键（见 **`crates/api`** **`indexer_reconcile`** 与 **RUNBOOK §2.55**）。

**同源自检（同一 reconcile 响应内）**：脚本另断言 **`governance_pool_db_vs_chain_balance_drift_observability`** **等于** **`fee_router_governance_fact_stream_observability.governance_pool_db_vs_chain_balance`**（若二者均非 `null`），防止 **B-381** 与 **B-415** 内嵌池漂移块分叉。

**公开 API（可选）**：设 **`B430_FETCH_PUBLIC_POOL=1`** 时脚本额外 **`GET /api/v1/governance/pool`** 落盘 **`b430-public-governance-pool.json`**（**不**自动数值断言；供与 **B-381/B-415** 人工对读 **SSOT** 展示）。

---

## 2. 前置条件

与 **[`TT-B382`](./TT-B382-GOVERNANCE-POOL-DRIFT-REAL-LINK-VERIFY-001.md)** / **B-383** / **B-384** 单卡 smoke **相同类**：**API**、**`DATABASE_URL`**、**`INTERNAL_API_SECRET`**、**admin Bearer**、**`jq`**；链上 env（**`CHAIN_RPC_URL`**、**`FEE_ROUTER_ADDRESS`**、**`REGION_VAULT_ADDRESS`** 等）与 **indexer** 配置一致。

---

## 3. 一键命令

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="***"
export ADMIN_BEARER_TOKEN="***"
# 可选落盘（默认目录见下）：
# export B430_WRITE_CLOSEOUT_PACK=1
# export B430_POST_INDEXER_TICK=1
# export B430_PROPOSAL_ID=<id>   # 用于 governance_effect_applied（status==executed → true）
# export B430_FETCH_PUBLIC_POOL=1
bash scripts/ops/b430-gov-post-exec-reconcile-overview-bundle.sh
```

- **`exit 0`**：**`GO`** — 四键 **reconcile ↔ overview** 无漂移，且 **B-381 vs B-415 内嵌** 自洽（若适用）。机读摘要：**`reconcile:"GO"`**、**`overview:"aligned"`**（与 **admin overview** 根键 **JSON** **深相等** **等价** **）。  
- **非 0**：**`SUSPECT`** — 见 **`scripts/ops/b430-gov-post-exec-reconcile-overview-bundle.sh`** 头注释 **退出码** 与 **stderr**。

### 3.1 证据包（`b430-closeout-record.json`）

设 **`B430_OUT_DIR`** **或** **`B430_WRITE_CLOSEOUT_PACK=1`** **时**，默认 **`evidence/b430_gov_post_exec_reconcile_overview/run_<UTC>/`** **写入**：

| 文件 | 说明 |
|------|------|
| **`b430-indexer-reconcile.json`** | **`POST …/internal/indexer-reconcile`** **完整** **`200`** **体** |
| **`b430-admin-overview.json`** | **`GET …/admin/observability/overview`** **体** |
| **`b430-verdict.json`** | **`reconcile`** **/** **`overview`** **/** **`governance_effect_applied`** **等** |
| **`b430-governance-proposal.json`** | 仅当设 **`B430_PROPOSAL_ID`** **且** **GET 200** |
| **`b430-closeout-record.json`** | **`schema_version`**: **`b430_governance_execute_closeout_v1`**；**`governance_effect_applied`** **：** **未设** **`B430_PROPOSAL_ID`** **为** **`null`** **；** **设** **且** **`.proposal.status=="executed"`** **为** **`true`** **否则** **`false`** |

**可选**：**`B430_POST_INDEXER_TICK=1`** — **`execute`** **后** **先** **`POST …/internal/indexer-tick`** **`{}`** **再** **reconcile** **。**

---

## 4. 与相邻 TT 的分工

| TT | 分工 |
|----|------|
| **TT-B431** | 链上 **`execute`** 后 **calldata / Timelock operation / getter** **Foundry** 对拍（合约层）。 |
| **TT-B430（本卡）** | **API 层**：**internal reconcile** 与 **admin overview** 聚合 **四键** **无漂移**；链上读数已进入 **B-381/B-383/B-384/B-415** JSON。 |
| **B-424** | **meta / overview** 产品侧门禁与叙事；**本卡不替代** 其全量范围。 |

---

## 5. 互证

- **脚本**：[`scripts/ops/b430-gov-post-exec-reconcile-overview-bundle.sh`](../../scripts/ops/b430-gov-post-exec-reconcile-overview-bundle.sh)  
- **RUNBOOK**：[§2.55](../../ops/RUNBOOK.md)（**B-430** 行，与本节同批互指）
