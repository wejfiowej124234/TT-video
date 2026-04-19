# TT-P07-DUPLICATE-CONFIRM-COMPLETION-E2E-001 · 重复 `confirm-completion`（已是 Completed）

**母表**：**[B-440](../任务母表.md)**  
**依赖**：**[B-436](../任务母表.md)** **/** **[`TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001`](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md)** · **[B-439](../任务母表.md)**（非法态单步锚）  
**规格**：本卡**不**改 **04**；行为与订单状态机一致。

---

## 1. 验收（封口条件）

1. **首调**：订单 **`Escrowed`**，向导 **`POST …/confirm-completion`** → **200**，`order.status=completed`。  
2. **重复调**：同一订单、同一参与者**再次** `POST …/confirm-completion` → **409 Conflict**。  
3. **JSON**：**`error`** / **`message`** = **`invalid_state`**，**`current`** = **`completed`**。  
4. **机读**：

   ```bash
   cargo test -p traveltrust-api post_confirm_completion_twice_second_returns_409 -- --nocapture
   ```

5. **实现**：`crates/api/src/routes/orders/tests/duplicate_confirm_completion_negative.rs`。

---

## 2. 非目标

- 真并发（双线程同时 POST）— 本卡仅**顺序**重复提交，锚定**错误体稳定**。  
- **`POST …/reviews`** 重复提交 — 另有 **`already_reviewed`**（**409**）路径，可另开 TT。

---

**文档版本**：1.0 · 2026-04-17
