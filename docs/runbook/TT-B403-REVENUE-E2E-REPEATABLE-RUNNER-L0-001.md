# TT-B403 · B-403 L0 — 可重复 revenue 索引跑流（runner + `run_id` 留证）

**母表**：`B-403` · **卡号**：`TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001`  
**类型**：**运维脚本** **L0**（**NDJSON** **留证** **；** **B-404** **L1** **`GET …/internal/revenue-e2e-run-status`** **另** **轨** **—** **见** **[TT-B404](./TT-B404-REVENUE-E2E-RUN-STATUS-L1-001.md)**）  
**日期**：2026-04-15  

---

## 1. 目的

在 **TT-B402**（单轮 **`indexer-reconcile`** **+** **B-383/B-386** **烟测**）之上，用 **同一仓库根** **可重复** **执行** **N** **轮**（默认 **3** **轮**，可调 **2**）：

1. 生成 **`run_id`**（UUID）并写入 **NDJSON** **留证**；
2. **`POST /api/v1/internal/indexer-tick`**（**200**）；
3. 调用 **`scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh`**（**exit** **0**）— **与** **B-402** **观测** **语义** **一致**。

**不**在本卡内实现 **53** **订单** **→** **链上** **释放** **→** **`distribute`**（仍属业务/部署；见 **TT-B402** **Runbook**）；本卡 **L0** **只** **固化** **「** **tick** **→** **reconcile** **观测** **」** **可重复** **编排** **与** **留证**。

---

## 2. 命令与环境

| 变量 | 说明 |
|------|------|
| **`INTERNAL_API_SECRET`** | 必填；**`X-Internal-Api-Secret`** |
| **`ADMIN_BEARER_TOKEN`** | 必填；**`b402`** **同源** |
| **`API_BASE_URL`** | 默认 **`http://127.0.0.1:8080`** |
| **`B403_ROUNDS`** | 轮数，默认 **3**（**2～3** **轮** **验收** **可** **设** **2**） |
| **`B403_RUNS_OUT`** | 留证目录，默认 **`evidence/b403_revenue_e2e_runs`**（相对仓库根） |

**链** **与** **DB**：**`POST …/internal/indexer-tick`** **须** **与** **[`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) §2.55** **一致** **的** **`CHAIN_RPC_URL`** **、** **`ESCROW_FACTORY_ADDRESS`** **、** **`FEE_ROUTER_ADDRESS`** **等** **；** **否则** **可能** **503** **`ESCROW_FACTORY_ADDRESS not set`** **/** **`chain_not_configured`** **（** **runner** **`exit 2`** **）** **。** **仅** **跑** **reconcile** **烟测** **、** **不** **依赖** **tick** **时** **仍** **可用** **单轮** **`b402`** **脚本** **。**

```bash
bash scripts/ops/b403-revenue-e2e-repeatable-runner.sh
```

**退出码**：**0** 成功；**2** **`indexer-tick`** **非** **200**；**5** **某轮** **`b402`** **失败**；**6** **留证** **写** **失败**。

---

## 3. 留证

- **路径**：**`${B403_RUNS_OUT}/b403-run-manifest.jsonl`**
- **行类型**：**`b403_session_start`** → 每轮 **`b403_round`**（**含** **`run_id`**）→ **`b403_session_ok`**
- **末行**（**stdout**，成功时）：**`b403-revenue-e2e-repeatable-runner.sh: ok (rounds=N; session_id=…; manifest=…)`**

---

## 4. 与 B-404（L1）的边界

**L1** **已** **收口** **为** **`GET /api/v1/internal/revenue-e2e-run-status?run_id=<uuid>`**（**母表** **B-404** **/** **[TT-B404](./TT-B404-REVENUE-E2E-RUN-STATUS-L1-001.md)**）：**只读** **聚合** **manifest** **`b403_round`** **与** **DB** **快照** **（** **orders** **计数** **、** **最新** **reconcile** **summary** **之** **B-383/B-386** **键** **）** **—** **勿** **与** **本** **L0** **runner** **混为** **同一** **交付** **单元** **。**

---

## 5. 互证

- **脚本**：[scripts/ops/b403-revenue-e2e-repeatable-runner.sh](../../scripts/ops/b403-revenue-e2e-repeatable-runner.sh)  
- **B-402**：[TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md](./TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md)  
- **运维**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md) **§2.55**
