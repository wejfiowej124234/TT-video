# TT-B406 · B-406 — 自举测试订单 + Revenue 跑流（无预置 `B405_ORDER_ID`）

**母表**：`B-406`（实现参考；母表/索引登记按仓库封口流程）  
**卡号**：`TT-B406-REVENUE-E2E-BOOTSTRAP-ORDER-001`  
**前置**：[TT-B402](./TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md)、[TT-B405](./TT-B405-REAL-ORDER-DRIVEN-REVENUE-E2E-L2-001.md)（**B-404** **`revenue-e2e-run-status`**）  
**日期**：2026-04-15  

---

## 1. 目的

在 **B-405** 仍用 **`B405_ORDER_ID` / `GET …/orders`** 取锚的前提下，由 **B-406** 在 **同一** **shell** **内** **先** **完成**：

1. **`POST /auth/seed-test-accounts`**（可选，**`B406_SKIP_SEED=1`** 跳过）  
2. **`POST /auth/login`**：**旅行者** + **向导** **Bearer**  
3. **`GET /api/v1/guides`** → **`guide_id`**（**`items[0].id`**，**`active`**）  
4. **`POST /api/v1/orders`** → **`POST …/accept`** → **`POST …/mock-pay`** → 订单 **Escrowed**（**53** **资金** **已** **进** **托管** **语义** **的** **链下** **替身** **；** **真** **链** **release** **仍** **见** **TT-B402**）  
5. **导出** **`B405_ORDER_ID`** **并** **调用** **`b405-revenue-e2e-order-driven-runner.sh`**（**tick + b402 + b405** **manifest**）  
6. **stdout** **末段** **提示** **`GET …/internal/revenue-e2e-run-status?run_id=…`** **（** **B-404** **）** **留证** **核对**  

**不再** **要求** **人工** **预先** **准备** **订单** **UUID**。

**真实** **链** **`release`/`distribute`** **驱动** **的** **同** **骨架** **编排** **见** **[TT-B407](./TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)** **（** **无** **`mock-pay`** **）** **。**

---

## 2. 硬性前置

| 条件 | 说明 |
|------|------|
| **`P3_CHAIN_OFF=1`** | **`POST …/mock-pay`** **在** **实现** **上** **否则** **501** **（** **`not_implemented`** **）** **。** |
| **`SEED_TEST_ACCOUNTS=1`** | **建议** **开启** **以便** **`seed-test-accounts`** **补** **`tourist@test.com`** **/** **`guide@test.com`** **。** |
| **其余** | 与 **B-402/B-405** **相同** **：** **API+DB+链** **配置** **、** **`INTERNAL_API_SECRET`** **、** **`ADMIN_BEARER_TOKEN`** **、** **`jq`** **。** |

---

## 3. 命令

```bash
export INTERNAL_API_SECRET=...
export ADMIN_BEARER_TOKEN=...
bash scripts/ops/b406-revenue-e2e-bootstrap-and-runner.sh
```

**可调**：**`B405_ROUNDS`**（**默认** **2**）、**`B406_GUIDE_CITY`**（**默认** **杭州**）、**`API_BASE_URL`**。

---

## 4. 互证

- **脚本**：[`scripts/ops/b406-revenue-e2e-bootstrap-and-runner.sh`](../../scripts/ops/b406-revenue-e2e-bootstrap-and-runner.sh)  
- **嵌套**：[`scripts/ops/b405-revenue-e2e-order-driven-runner.sh`](../../scripts/ops/b405-revenue-e2e-order-driven-runner.sh)  
- **L1**：**`GET /api/v1/internal/revenue-e2e-run-status`** · [04 §3.4](../spec/04-后端与API.md)  
- **运维**：[`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) **§2.55**  
