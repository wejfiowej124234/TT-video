# TT-P07-DB-INSERT-REVIEW-ON-CONFLICT-CONCURRENT-001 · 持久层 `insert_review` 并发与 `ON CONFLICT`

**母表**：**[B-443](../任务母表.md)**  
**依赖**：**[B-442](../任务母表.md)**（HTTP 内存路径并发语义）；本卡锚 **SQL** **唯一约束** **+** **`DO NOTHING`**，**非** **HTTP** **路由** **E2E**。

---

## 1. 验收（封口条件）

1. **环境**：本机或 CI **已** 配置 **`DATABASE_URL`** **指向** **已迁移** **的** **PostgreSQL**（**无** **`DATABASE_URL`** **时** **测试** **跳过** **，** **不** **失败** **）** **。**
2. **并发**：**同一** `order_id`、**同一** `reviewer_id`、**不同** `reviews.id`，**`tokio::join!`** **双** **调** **`crate::db::insert_review`** **。**
3. **返回值**：须 **恰** **一** **`Ok(true)`** **（** **新** **插入** **）** **+** **一** **`Ok(false)`** **（** **`ON CONFLICT`** **未** **插入** **）** **。**
4. **表**：**`reviews`** **中** **该** **`(order_id, reviewer_id)`** **恰** **一行** **（** **唯一索引** **`ux_reviews_order_id_reviewer_id`** **）** **。**
5. **机读**：

   ```bash
   DATABASE_URL=postgres://… cargo test -p traveltrust-api insert_review_concurrent_same_order_reviewer_one_true_one_false_on_conflict -- --nocapture
   ```

6. **实现**：`crates/api/src/db/reviews.rs` **`insert_review_on_conflict_tests`** **。**

---

## 2. 与 B-442（HTTP）的分工

| 维度 | B-442 | B-443（本卡） |
|------|-------|----------------|
| 入口 | **`POST …/reviews`**，内存 **`RwLock`** | **`insert_review`** **直接** **写** **库** |
| 观测 | **HTTP** **1×200** **+** **1×409** **`already_reviewed`** | **`bool`** **一真一假** **+** **行数** **=** **1** |
| 须 **`db_pool`** | 否 | 是（**`DATABASE_URL`**） |

**说明**：**`db_pool`** **场景** **下** **`review_submit_impl`** **在** **`insert_review` → `Ok(false)`** **时** **可能** **走** **幂等** **200** **（** **读** **回** **已** **存** **行** **）** **，** **与** **B-442** **的** **409** **不** **等价** **。** **本** **卡** **不** **断言** **HTTP** **；** **仅** **锚** **持久层** **`ON CONFLICT`** **并发** **收敛** **。** **HTTP** **幂等** **200** **机读** **见** **母表** **[B-444](../任务母表.md)** **/** **[`TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001`](TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001.md)** **。**

---

**文档版本**：1.0 · 2026-04-17
