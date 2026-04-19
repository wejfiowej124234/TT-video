# TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001 · `db_pool` 下 `POST …/reviews` 幂等 200（非 409）

**母表**：**[B-444](../任务母表.md)**  
**依赖**：**[B-443](../任务母表.md)**（`insert_review` **`ON CONFLICT`** **SQL** **层**）；本卡锚 **HTTP** **`review_submit_impl`** 在 **`Ok(false)`** **分支** **的** **稳定** **语义**。

---

## 1. 验收（封口条件）

1. **环境**：**`DATABASE_URL`** **指向** **已迁移** **PostgreSQL**（**无** **则** **测试** **跳过** **）** **。**
2. **契约**：当 **`insert_review`** **返回** **`Ok(false)`** **且** **`fetch_review_by_order_and_reviewer`** **成功** **时** **，** **HTTP** **须** **200** **，** **且** **`review.weight_breakdown_note` = `persisted_review_inputs_not_replayed`** **，** **`weight_breakdown`** **为** **null** **（** **不重放** **本次** **请求** **输入** **的** **权重** **分解** **）** **。**
3. **机读**：

   ```bash
   DATABASE_URL=postgres://… cargo test -p traveltrust-api post_reviews_db_pool_insert_conflict -- --nocapture
   ```

4. **实现**：`crates/api/src/routes/orders/tests/review_submit_db_pool_idempotent_contract.rs` **；** **`reviews.weight`** **从** **DB** **读** **使用** **`(weight)::float8`** **（** **`NUMERIC`→`f64`** **）** **见** **`crates/api/src/db/reviews.rs`** **。**

---

## 2. 与 B-442 / B-443 的分工

| 卡 | 断言 |
|----|------|
| **B-442** | **无** **`db_pool`** **：** **并发** **→** **1×200** **+** **1×409** **`already_reviewed`** |
| **B-443** | **SQL** **`insert_review`** **并发** **→** **1×`Ok(true)`** **+** **1×`Ok(false)`** |
| **B-444**（本卡） | **有** **`db_pool`** **：** **`Ok(false)`** **→** **HTTP** **200** **幂等** **（** **非** **将** **此** **分支** **改为** **409** **）** |

---

**文档版本**：1.0 · 2026-04-17
