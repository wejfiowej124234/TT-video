# TT-P07-CONCURRENT-REVIEW-SUBMIT-E2E-001 · 并发 `POST …/reviews`（幂等 · `already_reviewed`）

**母表**：**[B-442](../任务母表.md)**  
**依赖**：**[B-436](../任务母表.md)** **/** **[B-441](../任务母表.md)**（顺序重复锚）  
**规格**：本卡**不**改 **04**；与内存态 **`RwLock`** 下 **`review_submit_impl`** 读检查后、写锁内二次 **`already_reviewed`** 判定一致。

---

## 1. 验收（封口条件）

1. **环境**：**`ChainOff`**、**无** **`db_pool`**（纯内存双写路径）。  
2. **并发**：**同一** `order_id`、**同一** `reviewer`，**`tokio::join!`** 发起 **两** 个 **`POST /api/v1/orders/:id/reviews`**（相同 JSON）。  
3. **HTTP**：响应集合须为 **一条 200** + **一条 409**（顺序不限）。  
4. **409** 体：**`error`** / **`message`** = **`already_reviewed`**。  
5. **200** 体：**`status`** = **`ok`**（与主路径一致）。  
6. **机读**：

   ```bash
   cargo test -p traveltrust-api post_reviews_concurrent_same_user -- --nocapture
   ```

7. **实现**：`crates/api/src/routes/orders/tests/concurrent_review_submit_negative.rs`。

---

## 2. 非目标

- **DB** **`insert_review`** **ON CONFLICT** 路径（须 **`db_pool`** **+** **迁移** **表**）— 本卡只锚 **P3 内存** 竞态；**持久层** **并发** **机读** **见** **母表** **[B-443](../任务母表.md)** **/** **[`TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001`](TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001.md)** **。**  
- 多用户、双向同时评 — 另开矩阵。

---

**文档版本**：1.0 · 2026-04-17
