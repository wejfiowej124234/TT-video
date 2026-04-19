# TT-B385 · B-385 CountryPoolLedger `CountryLedgerCredited` 链上日志数 vs DB 投影 — 真实链路验证

**卡号**：`TT-B385-P5-COUNTRY-LEDGER-CREDITED-LOG-COUNT-CHAIN-VS-DB-OBS-001` · **母表** `B-385`（承 **B-383/B-384** 模式）  
**日期**：2026-04-15  
**范围**：**运维验证 / 证据**；与 **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** 多 jurisdiction 注册表 **正交**（本观测钉 **`COUNTRY_POOL_LEDGER_ADDRESS`** × **indexer-tick** 写入 **`p5_country_ledger_lines`** 路径）。

---

## 1. 目的

在 **本地** 或 **测试链** 上证明：

1. **`POST /api/v1/internal/indexer-reconcile`** 在 **`persist:true`** 且 **`include_p5_country_ledger_credited_log_count_chain_vs_db_observability:true`** 时，**`200`** 根级 **`p5_country_ledger_credited_log_count_chain_vs_db_observability`** 与 **`persist` 写入的 `summary` 同键**。
2. **`GET /api/v1/admin/observability/overview`** 的 **`overview.p5_country_ledger_credited_log_count_chain_vs_db_observability`** 自最新 **`orders_projection_vs_orders`** 报告 **`summary`** **回读**，与 **(1)** **同一次 reconcile 响应** 内该键 **JSON 深相等**。

**观测定义（v1）**：在 **`p5_country_ledger_lines_stats`** 给出的 **`[min_block_number,max_block_number]`**（与投影 **非空** 时一致）内，比较 **`eth_getLogs`**（**`COUNTRY_POOL_LEDGER_ADDRESS`** + **`CountryLedgerCredited`** **topic0**）**条数** 与 **`COUNT(p5_country_ledger_lines)`**。**块窗超过 v1 上限**（**`500000`** **inclusive 跨度**）时 **`marker=incomparable`**（**不**发 **`eth_getLogs`**）。

---

## 2. 前置条件

| 项 | 说明 |
|----|------|
| **进程** | API 已监听。 |
| **DB** | **`DATABASE_URL`**；**`p5_country_ledger_lines`** 有迁移；可与 **B-110** indexer 投影一致。 |
| **链** | **`CHAIN_RPC_URL`**、**`COUNTRY_POOL_LEDGER_ADDRESS`**、**`ESCROW_FACTORY_ADDRESS`** 等已配置，**`POST …/internal/indexer-reconcile`** **非** **`chain_not_configured`**。 |
| **内部密钥** | **`INTERNAL_API_SECRET`**。 |
| **Admin** | **admin** **Bearer**。 |

---

## 3. 一键 smoke（机读）

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="***"
export ADMIN_BEARER_TOKEN="***"
bash scripts/ops/b385-p5-country-ledger-credited-log-count-reconcile-admin-overview-smoke.sh
```

- **退出码 `0`**：reconcile 与 overview 两段观测 **深相等**，**`anchor`**=`**`385-P5-COUNTRY-LEDGER-CREDITED-LOG-COUNT-CHAIN-VS-DB-OBS-V1`**。  
- **`marker`** 可能为 **`aligned`** / **`drift`** / **`incomparable`** / **`unavailable`**（**RPC** 失败）；**B-385** 封口 **exit 0** 只要求 **两段 JSON 一致**，**不**强制 **`aligned`**。

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **母表 B-385** | [`docs/任务母表.md`](../任务母表.md) |
| **实现** | `crates/api/src/db/p5_country_ledger_credited_chain_vs_db_count_obs.rs`、`chain/country_ledger.rs` **`eth_get_logs_count_country_ledger_credited`** |
| **04 §表** | [`docs/spec/04-后端与API.md`](../spec/04-后端与API.md) **`indexer-reconcile`** / **`admin/observability/overview`** |

---

## 5. 验收（封口）

- [x] **`cargo test -p traveltrust-api`** 绿（**855** **passed**，**2026-04-15**）。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**（**2026-04-15**）。  
- [x] 目标环境执行 **§3** **`exit 0`**（**勿**在证据中贴密钥）。**留证**：**`marker=incomparable`**（**`observation_note`**=`chain_config_incomplete_or_missing_country_pool_ledger`；已设 **`CHAIN_RPC_URL`** + **`ESCROW_FACTORY_ADDRESS`**，**未**设 **`COUNTRY_POOL_LEDGER_ADDRESS`** 时与实现对拍）；**`anchor`**=`385-P5-COUNTRY-LEDGER-CREDITED-LOG-COUNT-CHAIN-VS-DB-OBS-V1`；**reconcile** 与 **admin overview** 观测 JSON **深相等**。
