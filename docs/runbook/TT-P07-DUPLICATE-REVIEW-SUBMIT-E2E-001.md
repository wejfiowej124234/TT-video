# TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001 · 重复 `POST …/reviews`（`already_reviewed`）

**母表**：**[B-441](../任务母表.md)**  
**依赖**：**[B-436](../任务母表.md)** **/** **[`TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001`](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md)** · **[B-440](../任务母表.md)**（重复 `confirm-completion` 锚，正交）  
**规格**：本卡**不**改 **04**；与 **`review_submit_impl`** **`err_key("already_reviewed")`** 同源。

---

## 1. 验收（封口条件）

1. **首调**：订单 **`Completed`**，评价窗口内，参与者 **`POST …/reviews`**（合法 `score`/`comment`）→ **200**。  
2. **重复调**：**同一** `order_id`、**同一** `reviewer` **再次** `POST …/reviews` → **409 Conflict**。  
3. **JSON**：**`error`** / **`message`** = **`already_reviewed`**（与 `api_json::err_key` 一致）。  
4. **机读**：

   ```bash
   cargo test -p traveltrust-api post_reviews_twice_second_returns_409 -- --nocapture
   ```

5. **实现**：`crates/api/src/routes/orders/tests/duplicate_review_submit_negative.rs`（Axum `oneshot`，**`X-User-Id`** + **`application/json`**）。

---

## 2. 非目标

- **非终态**评、`review_window_expired`、低分无评论 — 另条矩阵。  
- **真并发**双线程 `POST …/reviews` — 本卡仅**顺序**重复提交。

---

**文档版本**：1.0 · 2026-04-17
