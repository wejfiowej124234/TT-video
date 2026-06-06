# `/market` 自由市场 · 代码 SSOT

**① 本地 L5：已收口冻结（2026-05-30 · ACTIVE）** — **[`MARKET-L5-CLOSURE.md`](../evidence/GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md)** · **[`MARKET-UI-THAW.md`](../evidence/GO_local_marketing_front_closure/MARKET-UI-THAW.md)** · **[`MARKET-FILTER-SORT-UI-FREEZE.md`](../evidence/GO_local_marketing_front_closure/MARKET-FILTER-SORT-UI-FREEZE.md)**。

**四页代码/UI 总 SSOT：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](../evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)（含 `/` · 本子站 · provider · acquisition）

---

## 产品职责

**旅行预约** — 撮合主入口：发现订单 / 向导 · 绑定向导 · 自定义行程 · Escrow 深链。  
**Hub 三签：** `MarketHubSubNav` → `/market`（本页）· [`/market/provider`](provider/README.md) · [`/market/acquisition`](acquisition/README.md)

---

## 组件树（`app/market/page.tsx`）

```
MarketPageInner
├── MarketAmbientBackdrop（WarmRouteFieldBackdrop + MarketDarkRouteSceneDecor）
├── vignette · TT_MARKETING_HOME_AMBIENT_GLOW · TT_MARKETING_HOME_DOT_GRID
├── MarketPageHero（trip-days 快捷 · 自定义行程入口）
├── MarketHubSubNav
├── MarketMainFilterBand · StickyFilterBar · MarketTravelFilterSummaryStrip
├── MarketFlowContextBanner
├── MarketContentViewSortBar + MarketContent（view=orders|guides|split）
├── OrderDetailDrawer · GuideDetailDrawer · BookGuideModal · CustomItineraryModal
└── MarketPageFooter → LandingFooter
```

| 层级 | 文件 |
|------|------|
| 路由 | `app/market/page.tsx` · `layout.tsx` |
| 逻辑 | `components/market/useMarketPage.ts` · `useMarketPageRouterSync.ts` · `useMarketPageFavorites.ts` |
| 筛选/排序 | **`MarketMainFilterBand`** · `StickyFilterBar` · **`MarketContentViewSortBar`** · `lib/marketPageQuery.ts` · `lib/marketGuideFilterQuery.ts` |
| 子站 | **[`/market/provider`](provider/README.md)** · **[`/market/acquisition`](acquisition/README.md)** |
| Token | `lib/marketingUi.ts` — `TT_MARKETING_MARKET_L5_*` · `TT_MARKETING_MARKET_DARK_PATH` · 与 `/` 共享 `TT_MARKETING_HOME_DOT_GRID` / `HOME_AMBIENT_GLOW` |
| 页脚 | `MarketPageFooter.tsx` → **`LandingFooter`**（与 `/` 同源） |

**`<main>` 机读：** `data-testid="market-page"` · `data-tt-market-l5="1"` · `data-tt-market-ui-thaw="closed"` · `data-tt-market-filter-sort-frozen="1"`

---

## 数据链（① · 真 HTTP）

| API | 用途 |
|-----|------|
| **`GET /api/v1/discover/orders`** | 订单发现列表 |
| **`GET /api/v1/guides`** | 向导列表（query 由 `buildMarketGuideListApiParams` 构建） |
| **`GET /orders`** | 登录用户合并 **已发布·待选向导** 订单 |
| **`GET /orders/:id`** · **`POST …/accept`** | 抽屉详情 · 接单 |
| 写链 | 绑定向导 · 自定义行程 · `bindGuideToOrder` 深链 |

| 客户端 | 行为 |
|--------|------|
| Refetch debounce | **300ms**（`MARKET_LIST_REFETCH_DEBOUNCE_MS`） |
| URL 同步 | `country` · `city` · `language` · `service` · `days` · `sort` · `view` · `filters` · `bindGuideToOrder` 等 |
| Facet / 天数 / 排序 | ** largely 客户端**（① 已跑通；**②** MKT-FILT-P2-008/012 staging 收敛） |
| 收藏 | `FAV_ORDERS_KEY` · `FAV_GUIDES_KEY` — **`localStorage` SSOT** + 跨 tab；已登录 **best-effort** 同步 **`GET/POST/DELETE …/me/market-bookmarks`**（`marketTravelBookmarksSync.ts`）· 失败见 `market-bookmarks-sync-alert` |
| Dev variety | 可选 `appendMarketDevVarietyOrders`（本地丰富列表） |

---

## UI 冻结边界

- **本页 `/market`：** MARKET-L5 + 筛选/排序 UI **已冻** — 仅 bugfix · 数据链 · i18n · a11y。
- **子站** `/market/provider` · `/market/acquisition`：**不在** MARKET-L5 scope；见各子站 README。

**规格：** [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [29 撮合控制台](../../../docs/spec/29-自由市场-撮合控制台规范.md) · [五主路由冻结](../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

---

## 三阶进度

| 阶 | ① 已闭 / 待办 |
|----|----------------|
| **①** | L5 UI · URL 筛选 · debounce · discover/guides · 收藏 **localStorage + F-020（已登录）** · 绑定/接单写链 · **2026-06 runtime 性能** |
| **②** | **MKT-FILT-P2-001～014** staging 筛选/写链/性能 — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| **③** | **MKT-FILT-P3-001～006** |

**① 诚实边界：** [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md)

---

## 机读验收

```bash
cd frontend
npx vitest run lib/marketUiL5Thaw.contract.test.ts lib/marketPageQuery.test.ts \
  lib/marketGuideFilterQuery.test.ts components/market/marketTheme.contract.test.ts \
  components/market/useMarketPage.contract.test.ts
# 完整：见 MARKET-L5-CLOSURE.md §①
```

**②③：** 不在此页宣称 GO。
