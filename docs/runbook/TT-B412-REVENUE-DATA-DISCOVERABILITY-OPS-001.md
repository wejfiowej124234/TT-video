# TT-B412 · Revenue「数据可查」运维只读路径

**ID**：`TT-B412-REVENUE-DATA-DISCOVERABILITY-OPS-001`  
**母表**：[B-412](../任务母表.md)  
**状态**：已封口（2026-04-15 · Runbook + `b412` 脚本）

---

## 1. 目的

在 **不新增任何 indexer / reconcile 观测 JSON 键** 的前提下，打通 **「订单（业务锚）→ 收入相关投影与观测（B-383 / B-386）→ `GET …/admin/observability/overview` ↔ `POST …/internal/indexer-reconcile`」** 的 **可复现只读路径**，使值班能回答：**这笔订单所在的链与收入腿观测从哪里读、与 reconcile 摘要是否同键**。

---

## 2. 硬边界

- **禁止**：为「可查性」**新增** `indexer_reconcile` body 开关、**`admin/observability/overview`** 顶键或 DB 观测模块。
- **允许**：组合 **已有** 路由与 **既有** 观测键（**B-383** `fee_router_platform_fee_routed_log_count_chain_vs_db_observability`、**B-386** `revenue_pipeline_log_count_chain_vs_db_bundle_observability`），与 **[TT-B402](TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md)** **同一** **reconcile** **体**。

---

## 3. 路径表（封口版）

| 步骤 | 问题 | 只读入口 | 说明 |
|:----:|------|----------|------|
| ① | 这笔订单在后台长什么样？ | **`GET /api/v1/admin/orders/:id`**（**须** **Admin Bearer**；**须** **API** **挂载** **chain_off**） | 响应 **`order.id`**、**`order.chain_id`**（若有）、**`status`** **/** **`projection_terminal`**（若 DB 投影可用则经既有 B-097 路径） |
| ② | 收入腿链上日志数 vs DB、bundle 汇总是否一致？ | **`POST /api/v1/internal/indexer-reconcile`** **`persist:true`** **+** **B-383+B-386** 标志（与 **b402** 同源） | 根级两键 + **锚** 与 **TT-B402** 一致 |
| ③ | 管理总览是否与 reconcile 同键？ | **`GET /api/v1/admin/observability/overview`** | **`overview.<key>`** **与** **②** **根级** **深相等**（**b402** **已** **断言**） |

**语义链（文档层，非新键）**：订单 **`chain_id`** 与 indexer 经济投影 **`chain_id`** 对齐时，**B-386** `rollup` 才最有信息量；仅有 FeeRouter 投影而缺 **384/385** 同窗事件时 **`marker`** 可能 **drift/unavailable**（**TT-B402** **已** **说明**）。

---

## 4. ≤8 文件实现清单（白名单）

| # | 路径 | 说明 |
|---|------|------|
| 1 | **`docs/runbook/TT-B412-REVENUE-DATA-DISCOVERABILITY-OPS-001.md`** | 本 Runbook（路径表 + 验收） |
| 2 | **`scripts/ops/b412-order-to-revenue-discoverability-smoke.sh`** | ① **`GET …/admin/orders/:id`** **锚定** **→** **复用** **`b402-min-revenue-e2e-reconcile-smoke.sh`** |
| 3 | **`scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh`** | **既有**（**B-402**）；**不** **改** **观测** **键** **名** |
| 4 | **`ops/RUNBOOK.md`** **§2.55** | **B-412** **段** **互指** **本** **Runbook** **与** **b412** **脚本** |
| 5 | **`docs/任务母表.md`** **B-412** **行** | **状态** **/** **TT** **指针** |
| 6 | **`docs/AI任务卡索引.from-stash.md`** **一览** **384** | **索引** **封口** **行** |

**未** **改** **`crates/api/**`**（**无** **新** **观测** **实现**）；**未** **改** **`docs/spec/04-后端与API.md`** **契约** **句** **（** **本** **卡** **为** **运维** **可查** **路径** **）** **。**

---

## 5. 可复现查询路径（手工 / 脚本）

### 5.1 环境（占位符勿入库）

- **`API_BASE_URL`**：如 `http://127.0.0.1:8080`
- **`INTERNAL_API_SECRET`**：**`X-Internal-Api-Secret`**
- **`ADMIN_BEARER_TOKEN`**：**`Authorization: Bearer …`**
- **`B412_ORDER_ID`**：目标订单 UUID（**须** **在** **chain_off** **订单** **存储** **中** **存在**）

### 5.2 一键（推荐）

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="…"
export ADMIN_BEARER_TOKEN="…"
export B412_ORDER_ID="<uuid>"
bash scripts/ops/b412-order-to-revenue-discoverability-smoke.sh
```

**仅** **验证** **reconcile ↔ overview**（**不** **拉** **admin** **订单**）：

```bash
export B412_SKIP_ORDER=1
bash scripts/ops/b412-order-to-revenue-discoverability-smoke.sh
```

（**等价** **于** **单独** **执行** **`b402-min-revenue-e2e-reconcile-smoke.sh`** **。）

---

## 6. 验收断言（机读）

| 断言 ID | 条件 | 失败码（脚本） |
|---------|------|----------------|
| **A1** | **`GET …/admin/orders/:id`** **HTTP** **200** | **2** |
| **A2** | 响应 JSON **存在** **`.order`** **且** **`.order.id`** **（** **大小写** **不敏感** **）** **等于** **`B412_ORDER_ID`** | **3** |
| **A3** | **`POST …/internal/indexer-reconcile`** **体** **含** **`fee_router_platform_fee_routed_log_count_chain_vs_db_observability`** **与** **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`** **且** **锚** **与** **B-383/B-386** **一致** | **b402** **→** **3～5** |
| **A4** | **`GET …/admin/observability/overview`** **含** **上述** **两** **键** **且** **与** **reconcile** **根级** **JSON** **深相等** | **b402** **→** **4/5** |

**stdout 成功末行**（**b402** **继承**）：**`b402-min-revenue-e2e-reconcile-smoke.sh: ok (...)`**。

---

## 7. 与相邻 TT

- **TT-B409**：订单 **chain_off** **状态机** **HTTP** **已** **封口** **；** **本** **卡** **在** **admin** **读** **订单** **后** **接** **收入** **观测** **。**
- **TT-B402**：**同一** **B-383+B-386** **reconcile** **体** **；** **b412** **=** **订单** **锚** **+** **b402** **。**

---

## 8. 互证索引

- **from-stash**：[AI任务卡索引.from-stash.md](../AI任务卡索引.from-stash.md) **一览** **384**。
- **运维**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md) **§2.55**（**B-412** **段**）。
