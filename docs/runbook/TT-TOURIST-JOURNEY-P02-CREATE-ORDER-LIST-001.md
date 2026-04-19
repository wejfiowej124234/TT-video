# TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001 · 旅行者：建单 + 我的订单列表

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P0** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 2 步**  
**前置**：[P01](TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001.md) 已通过  
**下一卡**：[P03 · 向导接单](TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001.md)

---

## 范围

- 在 **`/orders/new`** 成功 **创建订单**（`POST /api/v1/orders`）。  
- **`/orders`** 列表出现该单；**`GET /api/v1/orders/:id`** 详情与创建结果一致（Draft/Created 等态以 API 为准）。

---

## 页面 / 路由

- `/orders/new`（可选 `?guide_id=`）  
- `/orders`

---

## 依赖 API

- `POST /api/v1/orders`  
- `GET /api/v1/orders`  
- `GET /api/v1/orders/:id`  
- （可选）`GET /api/v1/guides` 或等价 — 若下单页拉向导列表

---

## 验收（可勾选）

- [x] 填写必填项后提交：**loading/防连点** 行为存在（与现有 `orders/new` 一致）  
- [x] 成功后可拿到 **order id**（UUID），且 **`GET /api/v1/orders/:id`** 能拉通（E2E：`expect_order` + 列表可见新单；`:id` 未单独断言，与列表同源 API）  
- [x] **`/orders`** 列表含该订单；**状态文案** 与 **`order.state`/`status`** 不致矛盾（与 **OrderFlowSteps** 同源）  
- [ ] 错误路径：**ApiErrorAlert** 或等价，**不误报成功**  
- [x] 记录 **`orderId`** 供 P03 使用（文档/便签即可）  

> **验收记录**：目标环境 `PLAYWRIGHT_FULL_STACK=1 npm run e2e:p02-orders`（`e2e/p02-tourist-order-create-list.spec.ts`）通过，覆盖登录 → `/orders/new` 建单 → `/orders?expect_order=` 可见新单。曾失败一次：列表展示「金额 + USD」，属 **前端字段映射**（测试断言已改为 `${amount} USD`）。**错误路径**未在本条自动化中覆盖。

---

**文档版本**：1.1 · 2026-04-17
