# TT-B447-REVIEW-WEIGHT-BREAKDOWN-DB-POOL-MEMORY-PARITY-001 · `reviews` 权重 `weight` / `weight_breakdown`：`db_pool` 成功插入 vs 纯内存

**母表**：[B-447](../任务母表.md)

**与相邻卡关系**：[TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001](./TT-P07-REVIEW-SUBMIT-DB-POOL-IDEMPOTENT-HTTP-001.md)（**B-444**）约定 **`ON CONFLICT`** 幂等响应**不**重放 `weight_breakdown`；本卡只约束**首次成功提交**（`insert_review` → `Ok(true)`）与**无 `db_pool`** 时成功路径的数值与 JSON 形状一致。

---

## 1. 验收（封口条件）

### 1.1 环境

- **`DATABASE_URL`**：须指向已迁移的 PostgreSQL；未设置则机读测试**跳过**（不记为本卡失败）。

### 1.2 机读

```bash
DATABASE_URL=postgres://… cargo test -p traveltrust-api b447_ -- --nocapture
```

- **断言**：同一测试内先后构造两套等价输入（向导评旅行者、`Completed`、相同订单金额与评审人账户创建时间锚点）：
  1. **`db_pool` + `insert_review` 成功**：HTTP 200，`review.weight_breakdown` 为对象；
  2. **无 `db_pool`**：HTTP 200，同上；
  3. 两次响应中 **`score`**、**`weight`**、**`weight_breakdown`** 内各数值字段（含 `rule_version`、`account_age_days`）在浮点误差容差内一致。

**实现**：`crates/api/src/routes/orders/tests/review_weight_dual_path_parity_b447.rs` **`b447_post_reviews_weight_breakdown_parity_db_pool_insert_ok_vs_memory_only`**；计算与序列化真源：`crates/api/src/chain_off/reviews.rs`（**`json_weight_breakdown`**）、`traveltrust_core::ReviewWeight`。

---

## 2. 非目标

- **不**覆盖 **B-444** 的幂等分支（`weight_breakdown_note=persisted_review_inputs_not_replayed`）。
- **不**替代 P07 其它 HTTP 负面/并发机读（**B-441～B-443**）。

---

**文档版本**：1.0 · 2026-04-17
