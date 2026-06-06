/**
 * **订单 API**（列表、详情、创建、接单/取消/完成/托管/行程/评价等；**`crates/api/src/routes/orders/mod.rs`** + **`orders/*`**；**04** §3.4）。
 *
 * **chain_off 分岔（与测试网/公网同源）**：
 * - **`GET /api/v1/orders`**：**有 chain_off** → 须登录，否则 **401** **`login_required`**；**无 chain_off** → **200** **`status:ok`**、**`items:[]`** + **`rule`** 占位说明（**非** 503，与 **`get_orders`** 一致）。
 * - **`GET /api/v1/orders/:id`**：**有 chain_off** → 须登录 + 真实 **`order_get_impl`**；**无 chain_off** → **200** 占位体（**`order.status: unknown`** 等），**非** 503。
 * - **`POST /api/v1/orders`** 及 **`POST|PATCH …/orders/:id/*`**（接单、消息、评价、托管、争议等）：**无 chain_off** → **503** **`chain_off_unavailable`**；须登录的端点未会话 → **401**。
 * - **`GET|POST …/orders/:id/reviews`**（**`orders/reviews.rs`**）：**无 chain_off** → **503**。
 * - **Intents**（**`…/confirm-completion-intent`**、**`…/open-dispute-intent`**、**`…/execute-resolution-intent`**，**`routes/intents.rs`**）：**不**检查 **`chain_off`**；落 **outbox**，**202** **`accepted`** 等见各函数 JSDoc。
 * 写请求经 **`writeRequestHeaders`**（内含 **`getAuthHeaders` + 幂等键）。
 *
 * 实现拆分为 **`types`** / **`orderHttp`** / **`reviewsDisputesIntents`**；本文件为 **barrel**。
 */

export * from "./types";
export * from "./orderHttp";
export * from "./reviewsDisputesIntents";
