# B-462 / TT-A02 · 订单字段 · 状态 · API/DB 对齐表

**母表**：[B-462](../../docs/任务母表.md) · **Runbook**：[TT-A02](../../docs/runbook/TT-A02-FRONTEND-API-DB-ALIGN-ORDERS-001.md) · **Spec**：[04 §3.4](../../docs/spec/04-后端与API.md) · **[14](../../docs/spec/14-合约-API-ABI-前后端对齐.md)**（合约/ABI 与 API 互指）

**本文件**：列表/详情展示字段、`?state=` 筛选、Escrow 轮询对齐字段、投影徽章（B-097）与 **`orders`/`orders_projection`** 关系；**不**改状态机规则（53/01 为 SSOT）。

---

## 1 · `OrderState` 字符串（API 根级与 `order.state`）

| 来源 | 说明 |
|------|------|
| **Rust** | **`order_state_to_str`** / **`str_to_order_state`**（**`crates/api/src/chain_off/mod.rs`** 一带） |
| **列表项** | **`state`** 与 **`status`** 均为同一 **`order_state_to_str(o.state)`**（**`order_list_item_json`**，**`crates/api/src/chain_off/orders.rs`**） |
| **前端** | **`OrderListItem.state` / `.status`**（**`frontend/lib/apiClient/orders.ts`**）；展示优先 **`state`**，兼容 **`status`**（**`app/orders/page.tsx`**） |
| **筛选** | **`GET /api/v1/orders?state=`** 与 **`OrderRow.state`** 精确匹配（**B-071**；**`orders_list_impl`** **`state_filter`**） |
| **URL** | **`/orders?state=`** 仅白名单 **`completed` / `cancelled` / `disputed`**（**`ORDERS_LIST_TERMINAL_FILTER_OPTIONS`**）；非法值剔除，避免假筛选（**`normalizeOrdersListStateQueryParam`**） |

---

## 2 · 列表项 `GET /api/v1/orders` · `items[]`（与 Discover 同形段）

**后端 SSOT**：**`order_list_item_json`**（上引 **`orders.rs`**）→ 附加 **`display_status` / `projection_terminal`**（**`apply_orders_projection_fields_to_list_item_json`**，有 **`orders_projection`** 时）。

| 键（节选） | DB / 内存 | 前端 `OrderListItem` |
|------------|-------------|----------------------|
| **`id`** | **`orders.id`**（**`OrderRow.id`**） | **`id`** |
| **`tourist_id` / `traveler_id`** | **`orders.tourist_id`**（87 双读） | **`tourist_id` / `traveler_id`** |
| **`guide_id`** | **`orders.guide_id`** | **`guide_id`** |
| **`amount` / `currency`** | **`orders.amount` / `currency`** | 同左 |
| **`state` / `status`** | **`orders.state`** | 同 §1 |
| **`sub_status`** | **`orders.sub_status`** | **`sub_status`** |
| **`escrow_address`** | **`orders.escrow_address`** | **`escrow_address`** |
| **`chain_id`** | **`orders.chain_id`**（可选） | 列表消费见投影/链范围 |
| **`destination` / `city` / `days` / `travel_date` / `image`** | 行程 bundle（**`itineraries`** 内存/DB hydrate） | 同左 |
| **`breakdown` / `itinerary`** | bundle 预览（与 **discover** 同源） | **`OrderBreakdown` / `MarketOrderItinerary`** |
| **`created_at` / `accepted_at` / `escrowed_at` / `completed_at`** | **`OrderRow` 时间戳** | 列表类型可选展示 |
| **`payment_deadline` 等** | 截止计算 + observability | 详情/工具函数消费 |
| **`display_status`** | 投影 **`status`** 或回退 **`order_state_str`**（B-097） | **`display_status`** |
| **`projection_terminal`** | **`orders_projection`** 终端行 | **`projection_terminal`** |

**04**：**§3.4** **`GET /api/v1/orders`**、**discover** 详表、**B-069** Escrow 管线段。

---

## 3 · 详情 `GET /api/v1/orders/:id`

| 项 | 说明 |
|----|------|
| **信封** | 根级 **`status: ok`** + **`order`** 对象（及 **`itinerary`** 等嵌套，见 04） |
| **与列表对齐** | **`order.state` / `order.status` / `order.sub_status` / `order.escrow_address`** 为 **B-069** 钉死与列表合并字段；**`OrderDetailDrawer`** 轮询 **`getOrder`** 刷新上述四键 |
| **投影** | **`apply_orders_projection_fields_to_order_json`** 写入 **`order.projection_terminal` / `order.display_status`**（与列表投影逻辑对齐，**B-097**） |
| **前端** | **`getOrder`**（**`orders.ts`**）；**`orderListItemToDetailDrawer`**（**`app/orders/page.tsx`**）把列表项映射为 **`OrderDetailItem`**，字段同源 |

---

## 4 · `/orders` · `?state=`（B-071）与 **`getOrders`**

| 环节 | 真值 |
|------|------|
| **前端 query** | **`ORDERS_LIST_STATE_QUERY`** = **`state`**；**`getOrders({ state })`** 传小写（**`orders.ts`**） |
| **后端** | **`state_filter: Option<OrderState>`**，解析失败 → **400** **`invalid_state`**（路由层；见 **04** **B-071** 行） |
| **一致性** | **`frontend/lib/ordersListStateQuery.ts`** 注释与 **`order_state_to_str`** 枚举对齐 |

---

## 5 · Escrow 静默轮询（B-069）

| 项 | 真值 |
|----|------|
| **条件** | **`orderListItemWatchesForBackendEscrowSync(item)`** 为真（**`Accepted`** 等口径与 **`orderLikeMayOnchainDeposit`** 一致） |
| **周期** | **`ORDERS_ESCROW_AUTO_SYNC_POLL_MS`**（默认 **5000**）；**`document.hidden`** 跳过；**`visibilitychange`→`visible`** 补跑 |
| **列表** | **`refreshOrders({ silent: true })`** → **`GET /api/v1/orders`** |
| **抽屉** | 打开时同周期 **`GET /api/v1/orders/:id`**，合并 **§3** 四字段 |

---

## 6 · DB 表（真值锚）

| 表 | 与 API 关系 |
|----|-------------|
| **`orders`** | 主行：**`id`、参与方、`amount`、`currency`、`state`、托管与时间字段、`escrow_address`、`chain_id` 等**（**04 §二** / **附录 DDL**） |
| **`orders_projection`** | 链上/索引投影终端；驱动 **`projection_terminal` / `display_status`**（**B-097**） |
| **`itineraries`** | 行程 bundle；列表/详情 **`itinerary`/`breakdown`** 与 **discover** 同构 |

**说明**：**chain_off** 内存 **`OrderRow` + itineraries** 为运行真值；**`DATABASE_URL`** 打开时双写/投影读库路径见 **04**、Runbook **§9** / **`dual_write`**。

---

## 7 · 行程 PATCH / 评价 GET·POST（Vitest 覆盖）

| API | 客户端 | 证据测试 |
|-----|--------|----------|
| **`PATCH /api/v1/orders/:id/itinerary`** | **`patchOrderItinerary`** | **`orders.itinerary-reviews.test.ts`** |
| **`GET/POST …/reviews`** | **`getOrderReviews` / `postReview`** | 同上 |

与 **04 §3.4**、**53** 行程表一致；**不**在本卡扩展状态机。

---

## 8 · 进入 B-460（TT-U03）的前置（仅互指）

**[TT-U03](../../docs/runbook/TT-U03-ORDER-LIFECYCLE-COMPLETE-REVIEW-E2E-001.md)**：**硬前置** **TT-U02（B-459）** **与** **本卡（B-462）** **绿** **后** **执行** **订单全生命周期 E2E**（**`b410-user-flow-e2e-gate.sh`** **+** **Runbook §1.2 Playwright**）。
