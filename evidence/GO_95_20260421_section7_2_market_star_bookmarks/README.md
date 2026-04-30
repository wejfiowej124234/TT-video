# GO_95 · §7.2 市场星标（`me/market-bookmarks` · 本机 + 账户）· 2026-04-21

## 实现面（与 **§7.1 域 F** / **F-020** 分轨互证）

| 能力 | 文件 | 行为摘要 |
|------|------|----------|
| **会话门** | **`frontend/components/market/useMarketPage.ts`** **`marketBookmarksSessionPresent`** | **`getAuthHeaders()`** 含 **`Authorization`** 或 **`X-User-Id`** 才视为已登录；**仅此时**调用 **`postMarketTravelBookmark`** / **`deleteMarketTravelBookmark`**。 |
| **本机星标（未登录亦可）** | 同上 + **`frontend/components/market/marketPageUtils.ts`** **`loadFavSet`/`saveFavSet`** | **`FAV_ORDERS_KEY`/`FAV_GUIDES_KEY`**：**首屏**从 **localStorage** 载入 **`favoritedOrderIds`/`favoritedGuideIds`**；切换时**先**写 **Set** + **`saveFavSet`**。 |
| **账户拉齐（GET）** | **`pullMarketBookmarksFromServer`** | 已登录时 **`getMarketTravelBookmarks()`**；**`payload.status !== "ok"`** → **`bookmarkSyncError`**（**`market_bookmarks_sync_status_not_ok`**）；**`catch`** → **`mapApiReadError`**（**`market_bookmarks_sync_failed`**）；成功则 **`setFavorited*`** 并 **`saveFavSet`** 与 PG 对齐。 |
| **写失败不掩盖** | **`toggleOrderFavorite`** / **`toggleGuideFavorite`** | 已登录：**乐观**更新 **Set** + **`saveFavSet`**，**`post`/`delete`** **`.catch`** 内 **回滚 Set + `saveFavSet`** 并 **`showFavoriteToggleErrorBriefly`**（**`market_favorite_toggle_failed`**）。 |
| **UI 提示 / 重试** | **`frontend/components/market/MarketTravelFilterPanel.tsx`** | **`bookmarkSyncError`** 展示 **`data-testid="market-bookmarks-sync-alert"`** + **`retryMarketBookmarksSync`**（**`market_bookmarks_sync_retry`**）。 |

## API

- **`GET/POST /api/v1/me/market-bookmarks`**、**`DELETE …/{targetType}/{targetId}`**：**`frontend/lib/api.ts`** **`routes.meMarketBookmarks`**/**`meMarketBookmarkByTarget`**；实现 **`frontend/lib/apiClient/marketTravelBookmarks.ts`**（**`throwUnlessApiOk`**；契约 **`order_ids`/`guide_ids`** 须为 **`string[]`**）。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§8.2 · F-020**/**93 B** 全量；**不**覆盖 **社区 `postCollect`**（**F-017**/**§7.2 收藏** 已分轨）。
