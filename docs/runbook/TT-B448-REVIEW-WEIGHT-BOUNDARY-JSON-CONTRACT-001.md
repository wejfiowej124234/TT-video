# TT-B448-REVIEW-WEIGHT-BOUNDARY-JSON-CONTRACT-001 · `review_weight_v1` 极值 / 边界与 `weight_breakdown` JSON 契约

**母表**：[B-448](../任务母表.md)

**与相邻卡关系**：[TT-B447-REVIEW-WEIGHT-BREAKDOWN-DB-POOL-MEMORY-PARITY-001](./TT-B447-REVIEW-WEIGHT-BREAKDOWN-DB-POOL-MEMORY-PARITY-001.md)（**B-447**）约束 **db_pool** 与 **无 db_pool** 成功路径数值一致；本卡在 **`traveltrust_core::ReviewWeight`** **输入空间** **极值** **/** **账龄因子临界** **上** **钉** **`json_weight_breakdown`** **（** **`serde_json::json!`** **）** **键序** **与** **有限** **浮点** **语义** **，** **防** **极端** **场景** **分叉** **。

---

## 1. 验收（封口条件）

### 1.1 机读（无 PostgreSQL 依赖）

```bash
cargo test -p traveltrust-api b448_ -- --nocapture
```

**实现**：`crates/api/src/chain_off/reviews.rs` **`b448_review_weight_boundary_contract_tests`**（直接调用与 **`POST …/reviews`** **同源** **`json_weight_breakdown`**）。

**覆盖摘要**（非穷举列举，以源码为准）：

- **金额**：`0`、极大、`1e-12` 级正数 → **`amount_factor`** **`clamp(0.1,10)`** **与** **`weight`** **自洽** **。**
- **账龄 `account_age_days`**：**0**；**182/183** 天邻域（**`age_factor`** **下限** **0.5** **临界** **）；** **1094/1095** 天邻域（**上限** **3.0** **）；** **`u64::MAX`** **→** **因子仍** **clamp** **至** **3** **。**
- **乘积上界**：**`amount_factor≤10`** **且** **`age_factor≤3`** **→** **`weight≤30`** **。**
- **JSON**：**`json_weight_breakdown`** **产出对象键序** **固定** **（** **`rule_version` → … → `guide_historical_score_reserved`** **）** **；** **数值字段** **须** **有限** **（** **非** **Inf/NaN** **）** **。**

---

## 2. 非目标

- **不** 替代 **B-447** 双路径 HTTP parity（本卡无 **`DATABASE_URL`**）。
- **不** 改变 **`review_weight_v1`** **公式** **（** **仅** **加** **回归** **锚** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
