# TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001 · 完成态 + 评价 / 释放（最小）

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P3** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 7 步**  
**前置**：[P06](TT-TOURIST-JOURNEY-P06-PAY-DEPOSIT-001.md) 已通过  
**下一卡**：无 — 回到母旅程 [**TT-TOURIST-ORDER-ESCROW-JOURNEY-001**](TT-TOURIST-ORDER-ESCROW-JOURNEY-001.md) 做 **总勾选封口**

**主路径**：**PASS**（API HTTP 顺序实跑 · 2026-04-17 · `P3_CHAIN_OFF=1` 进程）

**已实跑序列**（同一 `traveltrust-api` 进程、`SEED_TEST_ACCOUNTS` 旅行者/向导）：`GET /meta`（`orders.order_mock_pay_enabled=true`）→ `POST /auth/login`（双账号）→ `GET /api/v1/me`（取 `guide.id`）→ `POST /api/v1/orders` → `POST …/accept` → `POST …/mock-pay` → `POST …/confirm-completion` → `POST …/reviews` → `GET …/reviews`（须 `Authorization: Bearer`）→ `GET …/orders/:id`（`status=completed`）。**未跑**：浏览器 `/escrow/*`、`POST …/confirm-rating`、链上 release、错误码矩阵与并发 — 见下「尚未覆盖」。

---

## 范围

在 **01/03/53** 允许的前提下，将订单推进到 **可展示的「业务完成」+ 资金侧终态路径** 之一：

- **`POST …/confirm-completion`**（若业务态单独存在）  
- **`POST …/reviews`** / **`POST …/confirm-rating`**（双方评分与释放前提见 **04**，**不得**理解为「单接口即链上放款」）

**最小目标**：旅行者与向导各完成 **必要操作** 后，**`GET /api/v1/orders/:id`** 为 **Completed**（或本卡书面定义的等价终态），且 UI **不误导**。

---

## 页面 / 路由

- `/escrow/[id]`  
- `/escrow/[id]/rate`（若启用）

---

## 依赖 API

- `POST /api/v1/orders/:id/confirm-completion`（若启用）  
- `POST /api/v1/orders/:id/reviews`  
- `POST /api/v1/orders/:id/confirm-rating`  
- `GET /api/v1/orders/:id`  
- （链上）release — 由执行器/合约事件驱动，见 **53 / 14**

---

## 验收（可勾选）

- [x] **主路径**：`mock-pay` 入金态 → `confirm-completion` → `completed` → **一条** `POST …/reviews` → `GET :id` 与列表一致（HTTP 已验证）  
- [x] **错误路径（非法态）**：**`Accepted`（未 Escrowed）** 时 **`POST …/confirm-completion`** → **409** **`invalid_state`**，**`current=accepted`** — **机读** **[`TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001`](TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001.md)** **/** **母表** **[B-439](../任务母表.md)**（`cargo test -p traveltrust-api post_confirm_completion_when_not_escrowed`）  
- [x] **重复 / 连点 `confirm-completion`**：已是 **`Completed`** 再次 **`POST …/confirm-completion`** → **409** **`invalid_state`**，**`current=completed`** — **机读** **[`TT-P07-DUPLICATE-CONFIRM-COMPLETION-E2E-001`](TT-P07-DUPLICATE-CONFIRM-COMPLETION-E2E-001.md)** **/** **母表** **[B-440](../任务母表.md)**（`cargo test -p traveltrust-api post_confirm_completion_twice_second_returns_409`）  
- [x] **重复 `POST …/reviews`**：第二次 → **409** **`already_reviewed`** — **机读** **[`TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001`](TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001.md)** **/** **母表** **[B-441](../任务母表.md)**（`cargo test -p traveltrust-api post_reviews_twice_second_returns_409`）  
- [x] **并发 / 竞态（同一用户双请求）**：**`tokio::join!`** 两路 **`POST …/reviews`** → **1×200** + **1×409** **`already_reviewed`** — **机读** **[`TT-P07-CONCURRENT-REVIEW-SUBMIT-E2E-001`](TT-P07-CONCURRENT-REVIEW-SUBMIT-E2E-001.md)** **/** **母表** **[B-442](../任务母表.md)**（`cargo test -p traveltrust-api post_reviews_concurrent_same_user`）  
- [x] **持久层 `insert_review` · `UNIQUE` + `ON CONFLICT`（须 `DATABASE_URL`）**：并发双插同一 **`(order_id, reviewer_id)`** → **1×`Ok(true)`** + **1×`Ok(false)`**，表内 **一行** — **机读** **[`TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001`](TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001.md)** **/** **母表** **[B-443](../任务母表.md)**（`cargo test -p traveltrust-api insert_review_concurrent_same_order_reviewer_one_true_one_false_on_conflict`；**非** HTTP **409** **断言**，见 Runbook **§2**）  
- [x] **`db_pool` · `POST …/reviews` · `insert_review`→`Ok(false)`**：须 **200** 幂等 **`weight_breakdown_note=persisted_review_inputs_not_replayed`**（**勿** **改为** **409**）— **机读** **[`TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001`](TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001.md)** **/** **母表** **[B-444](../任务母表.md)**（`cargo test -p traveltrust-api post_reviews_db_pool_insert_conflict`）  
- [x] **启动 `hydrate`（users/sessions）与全栈端口契约** — **母表** **[B-445](../任务母表.md)** **/** **[`TT-B445-HYDRATE-AND-DEV-STACK-PORTS-001`](TT-B445-HYDRATE-AND-DEV-STACK-PORTS-001.md)**（`cargo test -p traveltrust-api hydrate_from_db_roundtrips`；`bash scripts/dev/check-b445-dev-stack-ports-contract.sh`；Windows **`start-api-with-seed.bat`** **`[B-445]`** **提示**）  
- [ ] **仅资金终态可评价** 的 **403/400** 负例（非 completed 评、`review_window_expired`、低分无评论等）— **未**本批 HTTP 全矩阵覆盖（**重复/并发评** **已**机读，见上两条）  
- [ ] **双方** `confirm-rating` / 双边评分闭环 — **未**本批覆盖（仅旅行者单方评价）  
- [ ] **UI**：`/escrow/[id]`、重试清错、**无「成功态与错误文案并存」** — **未**本批浏览器验证  
- [ ] 母旅程 [**§5.6**](TT-TOURIST-ORDER-ESCROW-JOURNEY-001.md) **最小完成定义** 全量（含前端一致）— **待**与全旅程总勾选对齐  

### 尚未覆盖（相对本批主路径）

| 类别 | 项 |
|------|-----|
| **错误路径** | `POST …/reviews` 在非终态、低分无评论、`GET …/reviews` **无 Bearer** → **401**（`auth_placeholder_layer`）等；`mock-pay` 窗口超时；**重复 `POST …/reviews`** → **409** **`already_reviewed`**（**已**机读：**[`TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001`](TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001.md)**）；**`confirm-completion` 在 `Accepted` 未 Escrowed** → **409** **`invalid_state`**（**已**机读：**[`TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001`](TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001.md)**）；其它非法态与信任门禁 `403` 仍待矩阵化 |
| **并发 / 竞态** | 双开接单、重复 `mock-pay`、**真多线程** **`confirm-completion`**、**并发双评（异用户）**；**同一用户** **`POST …/reviews`** **并发** **（** **内存** **路径** **1×200** **+** **1×409** **`already_reviewed`** **）** **已**机读 **[`TT-P07-CONCURRENT-REVIEW-SUBMIT-E2E-001`](TT-P07-CONCURRENT-REVIEW-SUBMIT-E2E-001.md)**；**持久层** **`insert_review`** **`ON CONFLICT`** **并发** **已**机读 **[`TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001`](TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001.md)** **/** **母表** **[B-443](../任务母表.md)**；**`db_pool`** **HTTP** **幂等** **200** **（** **`Ok(false)`** **）** **已**机读 **[`TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001`](TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001.md)** **/** **B-444**；**顺序** **重复** **`confirm-completion` / `reviews`** **已**机读 **[`TT-P07-DUPLICATE-CONFIRM-COMPLETION-E2E-001`](TT-P07-DUPLICATE-CONFIRM-COMPLETION-E2E-001.md)** **/** **[`TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001`](TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001.md)** |
| **非主路径** | 真链 `deposit` 替代 `mock-pay`；`POST …/confirm-completion-intent`（EIP-712）替代 REST；`POST …/confirm-rating`；indexer/投影与链上 `Released` 晚于 completed 的观测 |

---

**文档版本**：1.7 · 2026-04-17
