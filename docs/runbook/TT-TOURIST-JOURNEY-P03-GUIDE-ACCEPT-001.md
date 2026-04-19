# TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001 · 向导接单（跨账号）

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P1** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 3 步**  
**前置**：[P02](TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001.md) 已通过；**须另备「向导」测试账号**（Registry/资格以环境为准）  
**下一卡**：[P04 · 双边确认](TT-TOURIST-JOURNEY-P04-BILATERAL-001.md)

---

## 范围

- 使用 **向导账号** 对 **旅行者创建的订单**（P02 或同源 **`POST /api/v1/orders`**）调用 **`POST /api/v1/orders/:id/accept`**（**验收以结果为准**；UI 推荐托管页 **`/escrow/:id`**「接单」钮，与 `OrderActionsBlock` 一致）。  
- **说明**：链下 **`GET /api/v1/discover/orders`** 仅聚合 **Draft + itinerary** 的可抢单；**`POST /api/v1/orders` 默认为 Created**，通常 **不会**出现在 **`/market`**，向导侧请走 **`/orders`** 与 **`/escrow/:id`**。  
- **旅行者账号** 侧列表与详情在接单后进入 **待双边确认**（`order_status_bilateral_pending`）等一致文案（与 **P04** 衔接）。

---

## 页面 / 路由（向导侧参考）

- **`/orders`**：参与方列表，向导可见待处理 Created 订单  
- **`/escrow/:orderId`**：**接单**（`escrow_accept`）主路径  
- `/market` 订单抽屉「确认接该项目」：适用于 **discover** 中出现的 Draft 单；与 Created 建单路径互补

---

## 依赖 API

- `POST /api/v1/orders/:id/accept`（403/先到先得等见 04）  
- `GET /api/v1/orders/:id`（旅行者与向导各刷新验证）

---

## 验收（可勾选）

- [x] 向导账号 **403 原因可解释**（未注册向导等）或 **200 接单成功**（E2E：`/escrow/:id` 接单钮）  
- [x] 接单后旅行者 **列表与向导侧状态文案一致**（刷新后仍为 **待双边确认** / `order_status_bilateral_pending`）；**`GET :id`** 可与列表同源手测  
- [ ] **先到先得**：同一单第二个 accept **被拒绝**（若可测；未纳入本最小 E2E）  
- [x] 自动化记录：**`guide@test.com` / `tourist@test.com`**、**orderId** 由用例生成；时间以 CI/本地运行时刻为准  

> **验收记录**：`PLAYWRIGHT_FULL_STACK=1 npm run e2e:p03-accept`（`e2e/p03-tourist-guide-accept.spec.ts`）通过：双账号切换、向导 `/orders` 可见新单、`/escrow/:id` 接单、旅行者刷新后状态一致；前置 API 会尝试 **cancel** 种子向导未结订单以释放 **`guide_has_active_order`** 档期。

---

**文档版本**：1.1 · 2026-04-17
