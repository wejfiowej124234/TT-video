# TT-B404 · B-404 L1 — `revenue-e2e-run-status`（按 `run_id` 只读聚合）

**母表**：`B-404` · **卡号**：`TT-B404-REVENUE-E2E-RUN-STATUS-L1-001`  
**类型**：**internal GET**（**只读**；**与** **B-403** **L0** **bash** **runner** **分轨**）  
**日期**：2026-04-15  

---

## 1. 目的

在 **[TT-B403](./TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md)** **NDJSON** **留证** **之外** **，** **提供** **单** **HTTP** **请求** **按** **`run_id`** **拉取** **：

- **L0** **真值**：**`manifest_round`**（**`kind=b403_round`** **且** **`run_id`** **匹配** **）** **、** **可选** **`manifest_session`** **（** **`b403_session_start`** **）** **；**
- **自** **`b402_last_line`** **解析** **`rollup.marker`** **（** **`observability_from_b402_stdout`** **）** **；**
- **DB** **（** **有** **`PgPool`** **时** **）** **：** **全局** **`orders`** **计数** **、** **最新** **`orders_projection_vs_orders`** **报告** **元数据** **、** **`summary`** **内** **B-383** **/** **B-386** **键** **摘录** **—** **显式** **不** **按** **`run_id`** **FK** **（** **见** **响应** **`correlation_note`** **）** **。**

---

## 2. 契约与路径

- **HTTP**：**`GET /api/v1/internal/revenue-e2e-run-status?run_id=<uuid>`**
- **鉴权**：与其它 **internal** **路由** **一致** **，** **须** **`X-Internal-Api-Secret`** **（** **见** **[`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) §2.55** **）** **。**
- **manifest** **路径** **：** **`TRAVELTRUST_B403_MANIFEST_PATH`** **>** **`TRAVELTRUST_REPO_ROOT`/evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl** **>** **cwd** **相对** **evidence/…**
- **规格** **：** **[spec/04 §3.4](../spec/04-后端与API.md)** **大表** **行** **`GET …/internal/revenue-e2e-run-status`**

---

## 3. 烟测（可选）

```bash
# run_id 取自 b403-run-manifest.jsonl 中某行 b403_round.run_id
curl -sS -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
  "${API_BASE_URL:-http://127.0.0.1:8080}/api/v1/internal/revenue-e2e-run-status?run_id=${RUN_ID}"
```

**API** **工作目录** **非** **仓库根** **时** **，** **导出** **`TRAVELTRUST_B403_MANIFEST_PATH`** **为** **绝对路径** **。**

---

## 4. 互证

- **实现**：`crates/api/src/routes/internal/revenue_e2e_run_status.rs`
- **L0**：[TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md](./TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md)
- **运维**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md) **§2.55**
