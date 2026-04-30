# GO_95 · §7.1 域 F（市场）审计证据 · 2026-04-21

## 前端路由（**04 §3.4** 前端表 / **13-1** 与 **94** 互读）

| 路径 | 实现要点 |
|------|----------|
| **`/market`** | **`frontend/app/market/page.tsx`**：**`useMarketPage`** → **`getDiscoverOrders`**（**`routes.discoverOrders`** = **`GET /api/v1/discover/orders`**）+ **`getGuides`**；与 **04**「主 UI **`/market`**、HTTP 路径保留 **discover**」一致。 |
| **`/market/provider`** | **`frontend/app/market/provider/page.tsx`** → **`MarketStandaloneBusinessPage`** **`variant="provider"`** → **`getMarketProviderListings`**（**`apiClient/marketSubsite.ts`** ↔ **`routes.marketProviderListings`**）。 |
| **`/market/acquisition`** | **`frontend/app/market/acquisition/page.tsx`** → **`variant="acquisition"`** → **`getMarketAcquisitionListings`**。 |
| **`/market/provider/showcase/[id]`** | **`frontend/app/market/provider/showcase/[id]/page.tsx`**：**`MerchantShowcaseDetailView`** / **`loadMerchantShowcaseListingPage`**（与 **04** 映射表「**`market/provider/**`**」子站详情一致）。 |
| **`/market/acquisition/[id]`** | **`frontend/app/market/acquisition/[id]/page.tsx`**：**`AcquisitionListingDetailView`** / **`loadAcquisitionListingPage`**。 |

## 星标（**F-020**）≠ 社区收藏

- **本机层**：**`frontend/components/market/marketPageUtils.ts`** **`FAV_ORDERS_KEY` / `FAV_GUIDES_KEY`** + **`loadFavSet` / `saveFavSet`**（**localStorage**）。
- **账户层（已登录）**：**`useMarketPage`** **`getMarketTravelBookmarks`** / **`postMarketTravelBookmark`** / **`deleteMarketTravelBookmark`** ↔ **`frontend/lib/api.ts`** **`routes.meMarketBookmarks`** / **`meMarketBookmarkByTarget`**（**04** **`GET|POST|DELETE …/me/market-bookmarks`**）。
- **社区**：**不**调用 **`postCollect`**；与 **04 §3.4** 旁注「**不**出现在个人中心收藏列表」一致（实现上另增 **PG 星标** 同步，**仍**与 **`community_collects`** 分轨）。

## **`api.ts` 市场族路径**（与 **94** / **`market_subsite`**）

**`routes.discoverOrders`**、**`meMarketBookmarks`**、**`marketProvider*`**、**`marketAcquisition*`** — 见 **`frontend/lib/api.ts`** 行级注释与 **`frontend/lib/apiClient/marketSubsite.ts`** / **`marketTravelBookmarks.ts`**。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0
```

## 边界

**不**替代 **§8.2** **F-020～022** 行完成；**不**替代 **94** 全量生产终验或 **93** 矩阵 **PASS**。
