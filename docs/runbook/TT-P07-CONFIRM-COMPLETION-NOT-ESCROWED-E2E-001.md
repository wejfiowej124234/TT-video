# TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001 · 非法态 `confirm-completion`（未 Escrowed）

**母表**：**[B-439](../任务母表.md)**  
**依赖**：**[B-436](../任务母表.md)** **/** **[`TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001`](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md)**（P07 主路径已 PASS 的前提下，补齐**最高风险**错误路径机读锚）  
**规格互证**：**[`docs/spec/04-后端与API.md`](../spec/04-后端与API.md)** **§3.4**（订单状态机与写路径）

---

## 0. 背景

真实用户常见误操作：订单尚处 **`Accepted`**（未 **`Escrowed`**）即调用 **`POST /api/v1/orders/:id/confirm-completion`**。主路径 E2E 不覆盖此负例；若无机读锚，非法态下 HTTP 状态与机器键易漂移。

---

## 1. 验收（封口条件）

1. **HTTP**：响应 **409 Conflict**。  
2. **JSON**：**`error`** = **`invalid_state`**，**`message`** = **`invalid_state`**，**`current`** = **`accepted`**（与 `OrderState::Accepted` 字符串化一致）。  
3. **机读**：下列测试在 **`cargo test -p traveltrust-api`** 下 **PASS**：

   ```bash
   cargo test -p traveltrust-api post_confirm_completion_when_not_escrowed -- --nocapture
   ```

4. **实现位置**：`crates/api/src/routes/orders/tests/confirm_completion_negative.rs`（Axum `oneshot` + `ChainOff` 内存态，向导 **`X-User-Id`**）。

---

## 2. 非目标（本卡不验收）

- 浏览器 **`/escrow/*`** UI 与重试清错。  
- **`POST …/reviews`** 非法态、`already_reviewed` 等其它负例（另开 TT）。  
- 并发双点 **`confirm-completion`**（另开优先级）。

---

**文档版本**：1.0 · 2026-04-17
