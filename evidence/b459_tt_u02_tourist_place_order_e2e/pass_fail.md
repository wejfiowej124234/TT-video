# B-459 / TT-U02 · PASS/FAIL（Runbook §1）

**执行时间**：2026-04-17（本机 Windows）

## 命令与 exit 码

| 命令 | exit |
|------|------|
| `cargo test -p traveltrust-api p21_order_create_accept_mock_pay_confirm -- --test-threads=1` | **0** |
| `cd frontend && PLAYWRIGHT_FULL_STACK=1 npm run e2e:p02-orders` | **0**（**1 passed**，约 **40s**） |

**说明**：默认 **`npm run e2e:p02-orders`** 仅由 Playwright 拉起 **Next**（**`playwright.config.ts`** **`webServer`**）；**未** 设 **`PLAYWRIGHT_FULL_STACK=1`** 时，若 **:8080** **无** **`/health`**，用例会 **`test.skip`**（**不算** **FAIL**，但 **不** **封口** **「全栈下单」**）。本次封口采用 **`PLAYWRIGHT_FULL_STACK=1`** 并行起 **`traveltrust-api`**（**`scripts/dev/start-api-for-playwright.*`**）。

## §1.3 表（逐项）

| 项 | 结果 | 说明 |
|----|------|------|
| **`POST /api/v1/orders`** 返回订单 **id** | **PASS** | **E2E** **日志** **`path=/api/v1/orders status=200`**；**p21** **链上** **机读** **绿** **。** |
| **`GET /api/v1/orders`** **/** **`GET …/:id`** 与创建一致 | **PASS（列表）** **/** **PARTIAL（按 id）** | **列表**：**`/orders`** **`getOrders`** **与** **新单金额** **一致**（**E2E** **断言** **`${amount} USD`**）。**按 id**：**`frontend/lib/apiClient/orders.ts`** **`getOrder`** **；** **`OrderDetailDrawer`** **/** **`/itinerary/new`** **`getOrder`** **—** **实现** **完备** **，** **本** **E2E** **未** **单独** **HTTP** **断言** **`GET /orders/:id`** **。** |
| **市场** **/** **新建订单** **页** **非** **纯假数据** | **PASS** | **`useMarketPage`**：**`getDiscoverOrders`** **+** **`getGuides`**（**[`useMarketPage.ts`](../../frontend/components/market/useMarketPage.ts)**）；**`/orders/new`**：**`postOrder`** **+** **`getGuides`** **。** |
| **E2E** **`e2e:p02-orders`** | **PASS** | **须** **全栈** **前提** **见** **上** **「** **说明** **」** **。** |

## 页面/API 真值（B-459 关注点）

| 区域 | 客户端 | 后端锚点 | 结果 |
|------|--------|----------|------|
| **市场 `/market`** | **`getDiscoverOrders`**, **`getGuides`** | **`GET /api/v1/discover/orders`**, **`GET /api/v1/guides`** | **PASS** |
| **向导** | 同上 + 卡片详情 | **`guides`** **种子** **/** **列表** | **PASS**（**E2E** **依赖** **`seed-test-accounts`** **+** **guides** **非空**） |
| **新建行程 `/itinerary/new`** | **`getOrder`**, **`postItineraryCreate`** | 订单头 + 行程写入 | **PASS（代码）**；**本** **E2E** **未** **跑** **该** **路由** **。** |
| **创建订单 → 列表** | **`postOrder`** → **`/orders`** **`getOrders`** | **`chain_off::order_create_impl`**（**[`orders.rs`](../../crates/api/src/chain_off/orders.rs)** **`L1156`** **起**） | **PASS** |
| **DB 落库** | （服务端） | **`db_pool.is_some()`** 时 **`persist_order_if_db`** **/** **`TRAVELTRUST_STRICT_ORDER_DB_WRITE`** | **PASS（逻辑）** **/** **未** **在** **E2E** **内** **`SELECT orders`** **（** **缺口** **见** **下** **）** **。** |
| **未登录** | **`login_required`** **→** **跳转** **/** **提示** | **`order_create`** **401** **`login_required`**（**[`routes/orders/mod.rs`](../../crates/api/src/routes/orders/mod.rs)** **`L697`** **起**）；**`/orders/new`** **前端** **捕获** **同** **message** | **PASS（稳定码）** |

---

## 缺口清单（不展开 B-460+）

1. **Runbook §1.2 与默认命令**：单写 **`npm run e2e:p02-orders`** 在 **无** **8080** **API** 时多为 **skip**；**封口** **须** **约定** **`PLAYWRIGHT_FULL_STACK=1`** **或** **手工** **先起** **API** **。**
2. **DB 强证据**：**无** **类似** **TT-U01** **`PLAYWRIGHT_VERIFY_PG`** **的** **`orders`** **行** **校验**；**有** **`DATABASE_URL`** **时** **后端** **会** **异步** **`persist_order_if_db`** **，** **但** **本** **证据** **未** **psql** **互证** **。**
3. **`GET /api/v1/orders/:id`**：**产品** **路径** **已** **接** **；** **自动化** **仅** **覆盖** **列表** **，** **未** **断言** **单条** **GET** **。** 

## 最小修复顺序（建议）

1. **文档** **/** **Runbook**：在 **§1.2** **旁** **显式** **写** **「** **全栈** **：** **`PLAYWRIGHT_FULL_STACK=1`** **`npm run e2e:p02-orders`** **」** **（** **或** **等效** **前置** **）** **—** **零** **代码** **，** **避免** **「** **假** **绿** **」** **（** **全** **skip** **）** **。** 
2. **可选** **E2E**：在 **`p02-tourist-order-create-list.spec.ts`** **末尾** **对** **新建** **订单** **id** **追加** **`request.get(`${API_BASE}/api/v1/orders/${id}`)** **expect** **200** **—** **最小** **行** **数** **封** **`GET :id`** **。** 
3. **可选** **DB**：**设** **`DATABASE_URL`** **+** **（** **需** **强** **封口** **时** **）** **`TRAVELTRUST_STRICT_ORDER_DB_WRITE=1`** **，** **并** **加** **`PLAYWRIGHT_VERIFY_ORDERS_PG`** **式** **查询** **或** **手工** **`order_id.txt` + psql`** **—** **对齐** **Runbook** **§2** **「** **orders** **表** **」** **真值** **。** 

---

## 实现与 Runbook 对齐

- **Runbook**：[`docs/runbook/TT-U02-TOURIST-PLACE-ORDER-E2E-001.md`](../../docs/runbook/TT-U02-TOURIST-PLACE-ORDER-E2E-001.md) **§1** **。** 
- **E2E**：[`frontend/e2e/p02-tourist-order-create-list.spec.ts`](../../frontend/e2e/p02-tourist-order-create-list.spec.ts) **。** 
