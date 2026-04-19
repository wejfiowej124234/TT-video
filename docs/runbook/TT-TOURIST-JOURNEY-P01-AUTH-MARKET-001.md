# TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001 · 旅行者：登录 + 市场只读

**母表**：**[B-438](../任务母表.md)**（**P01** **专卡**）**·** **总程序** **[B-436](../任务母表.md)**  
**优先级**：**P0** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 1 步**  
**前置**：无（环境：`traveltrust-api` + DB + 测试账号，见 `.env.example` / Runbook）  
**下一卡**：[P02 · 建单与列表](TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001.md)

---

## 范围

- **旅行者账号** 完成登录，并能进入 **`/market`**。  
- **只读**：列表/抽屉能消费 **`GET /api/v1/discover/orders`**（或当前 UI 等价入口），**不**要求下单。

---

## 页面 / 路由

- `/auth/login`（或注册后登录）  
- `/market`  
- （可选）`GET /meta` 门闸页行为与 Header 登录态一致

---

## 依赖 API

- `GET /meta`（产品国、门闸类键按需）  
- `GET /api/v1/discover/orders`（与市场 UI 同源；前端封装 **`getDiscoverOrders`**）  
- `GET /api/v1/me`（登录态；前端 **`getMe`**，与顶栏用户菜单一致）

---

## 可直接开做 · 执行清单（B-438）

按 **顺序** 做；**前一档未完成则不做下一档**（除非只修文档/注释）。

### 1. 页面与组件（前端真源）

| 层级 | 路径 | 备注 |
|------|------|------|
| 路由 | `frontend/app/market/page.tsx`、`layout.tsx`、`error.tsx`、`loading.tsx` | 撮合主界面 **`/market`**（04 / 13-1：HTTP 仍 `discover`） |
| 数据钩 | `frontend/components/market/useMarketPage.ts` | **`getDiscoverOrders`**、分页、`discoverEpoch` 竞态（B-061） |
| 市场壳 | `MarketPageHero`、`MarketContent`、`StickyFilterBar`、`MarketAmbientBackdrop`、`MarketPageFooter` | 与 `useMarketPage()` 出参绑定 |
| 抽屉 / 模态 | `OrderDetailDrawer`、`GuideDetailDrawer`、`BookGuideModal`、`CustomItineraryModal` | P01 **只读**：打开抽屉不强制下单；登录深链见 `buildLoginReturnPathWithQuery` |
| API 常量 | `frontend/lib/api.ts` | `routes.discoverOrders` → **`/api/v1/discover/orders`** |
| 客户端 | `frontend/lib/apiClient`（`getDiscoverOrders`、`getMe` 等） | 与 04 §3.4 字段对齐 |
| 登录 | `frontend/app/auth/login/page.tsx` 及 `auth/layout.tsx` | `returnUrl` 回 **`/market`** |
| 顶栏登录态 | `frontend/components/Header.tsx` | **`getMe`** + **`traveltrust:auth-change`** + `localStorage` `traveltrust_user_id` |

### 2. 接口对接（最小集合）

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/meta` | 门闸 / 产品国（若页面已挂 `MetaProvider` 则继承） |
| GET | `/api/v1/me` | 登录后用户摘要；**401** → 视为未登录 |
| GET | `/api/v1/discover/orders` | 市场列表；**200** + 空数组合法 |

### 3. 状态与边界

- **会话**：cookie / 与 **`getMe`** 一致；登出 **`postLogout`** 后 **`traveltrust:auth-change`** 触发顶栏刷新。  
- **列表**：`useMarketPage` 内 **`discoverEpoch`** / **`inFlightDiscoverEpoch`** 防止慢请求覆盖新筛选（勿删）。  
- **错误**：`error.tsx` 或列表区 **`ApiErrorAlert`** 同类：**可读文案 + 重试**；**不**白屏静默失败。  
- **非目标（P01）**：不验收 **`/orders/new`** 建单全路径（归 **P02**）；若 CTA 可达仅作 smoke。

### 4. 验收（B-438 · 仅以下 4 条）

- [ ] **`GET /api/v1/me`** **200**（须在**已登录**会话下于 DevTools 中观察；**未登录**时 **401** 为预期，属 **会话类**，不单独当作「接口坏了」）  
- [ ] **`GET /api/v1/discover/orders`** **200**（空列表仍 **200**）  
- [ ] **`/market`** **非白屏**；若失败，**错误态可见**（可读文案 / 重试 / `error` 边界）  
- [ ] 登录或登出后，全站能收到 **`traveltrust:auth-change`**（实现：`applyClientSessionAfterAuth` / `applyLocalLogoutAfterServerOk`，**`frontend/lib/apiClient/auth.ts`**）

**失败归因（只修一类）**：**接口**（5xx、路由 404、非预期 body）→ **会话**（已登录仍 **401**、cookie/token 未带上）→ **前端状态**（白屏且无请求、或竞态覆盖列表）。

### 5. 提交顺序（最短版）

1. **起** `traveltrust-api` **与** 前端 **`npm run dev`**（**勿**与根 `.env` **`PORT`** 抢同一端口；常见：**API 8080** + **Next 3012**，若 **3012** 已被 API 占用则用 **`TRAVELTRUST_FRONTEND_PORT=3020`** 等）并设好 **`NEXT_PUBLIC_API_BASE_URL`** 指向 API。  
2. 浏览器打开 **`/market`**。  
3. DevTools **Network**：先看 **`/api/v1/me`**，再看 **`/api/v1/discover/orders`**。  
4. 对照 **§4** 勾选；再按需跑 **`cargo test -p traveltrust-api`** / **`npx tsc --noEmit`**，**PR** 附环境与勾选。

---

**文档版本**：1.2 · 2026-04-17（**§4** **四** **验收** **点** **+** **最短** **执行** **序**）
