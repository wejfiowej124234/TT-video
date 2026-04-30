# GO_95 · §7.2 Feed degraded（`GET …/community/feed` · 与 **F-014** 同源文案）· 2026-04-21

## 契约与解析

| 项 | 文件 | 说明 |
|----|------|------|
| **HTTP 2xx + `status: degraded` 不抛** | **`frontend/lib/apiClient/community.ts`** **`communityReadOk`** | **`getFeed`** 走 **`communityReadOk`**：**`degraded`** 包络返回给调用方，**不**经 **`throwUnlessApiOk`** 误杀。 |
| **包络解析** | **`frontend/lib/communityFeedPageEnvelope.ts`** **`parseCommunityFeedPageEnvelope`** | **`ok`**：`posts` 须为数组；**`degraded`**：**`posts`** 可缺/非数组 → **按 `[]`**，**`kind: "degraded"`** + **`envelope`** 原样保留（**不**冒充 ok 空列表）。 |
| **人读文案** | **`frontend/lib/communityFeedDegradedMessage.ts`** | **`reason`** 非空 → **`community_feed_degraded_reason`**；否则 **`community_feed_degraded`**（与 **51/31**、**`GET /api/v1/community/feed`** 根级字段对齐）。 |

## Feed 主路径（壳层 + Hook）

| 面 | 文件 | 说明 |
|----|------|------|
| **首屏 / 重拉** | **`frontend/components/community/useCommunityFeedApi.ts`** | **`parseCommunityFeedPageEnvelope`** → **`degraded`**：**`setFeedError(communityFeedDegradedMessage(...))`**，**保留**已解析 **`posts`**（若有）。 |
| **壳层展示 + a11y** | **`frontend/components/community/CommunityFeedFilterBar.tsx`** | **`feedError`**：**`role="alert"`** **`aria-live="polite"`** + **`ApiErrorAlert`** + **重试** 表单。 |
| **壳入口** | **`frontend/app/community/page.tsx`**、**`frontend/app/community/topic/[tag]/page.tsx`** | **`CommunityFeedMain`** → **`useCommunityFeed`** → **`useCommunityFeedApi`**（与 **§3 · F-014** **`/community/explore`** 叙事：**同一 Feed API**；Explore 另见下）。 |
| **加载更多遇 degraded** | **`useCommunityFeedApi`** **`loadMore`** | **`degraded`**：**`setFeedNextCursor(null)`** + **`throw new Error("feed_load_more_degraded")`**；**`useCommunityFeed`** **`handleLoadMore`** **`.catch`** → **`mapApiReadError`** → **`mapOrderWriteError`**：**`feed_load_more_degraded`** → **`community_feed_degraded`**（与首屏文案键一致）。 |

## Explore 瀑布流（F-014 页身旁证）

- **`frontend/app/community/explore/page.tsx`**：**`useInfiniteQuery` + `getFeed`**；**`exploreFeedDegradedBanner`** 对 **`pages[]`** 扫描 **`parseCommunityFeedPageEnvelope`**，首遇 **`degraded`** → **`communityFeedDegradedMessage`**；**`getNextPageParam`** 在 **非 ok** 时 **`undefined`**（**不**继续分页）。

## 其它复用

- **`frontend/app/community/feedback/page.tsx`**：列表 **`degraded`** 时 **`communityFeedDegradedMessage`**（同源函数）。

## 单测旁证

- **`frontend/lib/communityFeedPageEnvelope.test.ts`**：**`degraded` allows missing posts** 等。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§8.2 · F-014** **行完成**/**93 D**/**E2E**；**不**声称 **§3.1** **F-014** 母行已闭。
