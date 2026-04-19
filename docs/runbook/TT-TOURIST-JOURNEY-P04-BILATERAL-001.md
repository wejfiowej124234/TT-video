# TT-TOURIST-JOURNEY-P04-BILATERAL-001 · 双边确认

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P1** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 4 步**  
**前置**：[P03](TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001.md) 已通过  
**下一卡**：[P05 · 终版确认与进托管](TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001.md)

---

## 范围

- **旅行者与向导各自** 完成 **`POST /api/v1/orders/:id/confirm-bilateral`**（顺序任意；双方均打勾后 **`sub_status` → `confirmed`**）。  
- UI：**`/escrow/[id]`** 的 **`BilateralConfirmBlock`**「**确认行程与金额**」；步骤条在双方确认后进入 **已确认·待付款**（`order_status_confirmed_awaiting_payment`，与 `OrderFlowSteps` 同源）。

---

## 页面 / 路由

- **`/escrow/[id]`**：双边确认区 + `OrderFlowSteps` 状态文案

---

## 依赖 API

- `POST /api/v1/orders/:id/confirm-bilateral`  
- `GET /api/v1/orders/:id` 与 **`GET /api/v1/orders`**（列表项须含 **`sub_status`**，供「我的订单」徽章与详情一致）

---

## 验收（可勾选）

- [x] 仅一方确认时：**`sub_status` 仍为 `pending_bilateral`**（或尚未 `confirmed`），**不**视为已完成双边  
- [x] 双方均确认后：**`GET :id`** 与 **列表** 中 **`sub_status === confirmed`**，UI **`/escrow`** 显示 **已确认·待付款**（进入 P05 前置）  
- [x] 失败时 **`BilateralConfirmBlock`** 展示 **`order_error_bilateral_failed`**（非静默）  

> **验收记录**：`PLAYWRIGHT_FULL_STACK=1 npm run e2e:p04-bilateral`（`e2e/p04-bilateral-confirm.spec.ts`）。**链下 API**：`order_list_item_json` 已含 **`sub_status`**；**前端** `orderStatusLabelKeyFromApiOrder` 在同时存在 **`display_status`** 与 **`sub_status`** 时合并子状态，避免列表长期停在「待双边确认」。全栈 E2E 若复用旧 `target/debug/traveltrust-api` 二进制，请先 **`cargo build -p traveltrust-api`** 或停掉占用进程后再跑。

---

**文档版本**：1.1 · 2026-04-17
