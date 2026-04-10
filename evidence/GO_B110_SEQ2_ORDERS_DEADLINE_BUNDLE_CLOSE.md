# GO · B110-SEQ2 订单 `rating_deadline` 子主线 bundle 收口

**标识**：**`TT-B110-SEQ2-ORDERS-DEADLINE-BUNDLE-CLOSE-001`**  
**母表**：[docs/任务母表.md](../docs/任务母表.md) **B-132**  
**性质**：**文档与索引收口**（**不**替代 **04 / 14 / 110** 正文 SSOT；**不**新增 HTTP 契约键；**不**改公开响应字段语义）。

---

## 1. 完成范围（已形成「发布级子能力」块）

| 层 | 内容 | 代表锚点 |
|----|------|----------|
| 真值与计算 | **`rating_review_window_resolution_for_orders_api`**；列表/详情 **`rating_deadline`** 同源 | `crates/api/src/chain_off/orders.rs` |
| 可观测 | **`order.deadline_rating_observability`**；**`GET /meta`** **`orders.deadline_rating_observability`** + **`reconcile_probe`** | [04 §3.4](../docs/spec/04-后端与API.md) 订单/`meta` 句 |
| 时钟 | **`order_deadline_clock`** 请求级注入 | 单测与 handler 注释 **TT-B110-SEQ2-ORDERS-DEADLINE-CLOCK-INJECT-001** |
| 链读与回退 | **`Governor.orderRatingReviewWindowDays()`**；fail-closed → **P3** | `crates/api/src/chain/governor.rs` |
| 对拍 | **`deadline_ssot_reconcile_pass`**（resolution vs 独立 probe） | **TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001** |
| Admin 排障 | **`overview.orders_deadline_ssot`**（**bundle** 内与 ops 同源 RPC） | **TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001** |
| 运维判定 | **`orders_deadline_ssot_ops_check_value`**（**`overall` / `exit_code_hint` / `checks`**） | **TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001** |
| 自动化（可选） | **`Orders deadline SSOT ops (staging)`**；无 staging secrets **跳过** | **TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CI-STAGING-001** |

---

## 2. 边界（读本 GO 时不得外推）

- **本 GO 合入时** **`indexer_reconcile_compound_pass`** **未**含 deadline 子枝；**后续** **B-133** / **`TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001`** 已将 **`orders_deadline_ssot_reconcile`** **AND** 入复合门闸（**不**改本 bundle 已登记的 **公开 HTTP** 语义）。
- **未承诺其它治理 getter** 与本线 **同构自动化**；须 **另开母表行 + TT**。
- **`payment_deadline` / `chat_confirm_deadline`**：仍按既有 **53-S12** 规则；**非**本 bundle 扩展对象。
- **公开** **`GET /api/v1/orders*`** **根级键集**：不因本 bundle 继续横向加调试字段；排障走 **Admin overview** / **脚本** / **staging workflow**。

---

## 3. 互指（统一引用入口）

- **规格**：[04-后端与API.md](../docs/spec/04-后端与API.md) **TT-B110-SEQ2-ORDERS-DEADLINE-BUNDLE-CLOSE-001** 锚点句（与 **reconcile_probe** 条并列）。
- **Runbook**：[RUNBOOK.md §2.55](../ops/RUNBOOK.md)（**orders_deadline_ssot_ops_check**、**CI staging**、`scripts/orders-deadline-ssot-ops-check.sh`）。
- **Scripts**：[scripts/README.md](../scripts/README.md) **orders-deadline-ssot-ops-check** 表行。
- **Evidence 目录索引**：[evidence/README.md · #b110-seq2-orders-deadline-bundle-close](README.md#b110-seq2-orders-deadline-bundle-close)。
- **封口总索引**：[sealed-programs-and-epics-master-index.md](../docs/runbook/sealed-programs-and-epics-master-index.md) **B110-SEQ2** 行。

---

## 4. 推荐后续方向（规划级 · 须另开卡）

1. **Indexer / reconcile**：将 **orders deadline SSOT 健康** 与 **`projection_reconcile_clean`** 或 **compound gate** 做 **显式并列巡检**（**不**混读语义）。
2. **治理其它链上参数**：复用 **resolution + 独立 probe + admin 提示 + ops_check + 可选 CI** 的 **工程模式**，**逐参数** 开 TT。

---

## 5. 验收命令（回归）

```bash
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
```

（本 GO 合入时须 **绿**；本卡 **不**改业务代码时仍为回归基线。）
