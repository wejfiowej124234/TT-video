# `/community/*` TT 社区 · 代码 SSOT

**① 本地 · Phase ① 收口冻结（2026-06-03）** — UI 壳 + 发帖/子路由/社交窄链 L5 已闭；Feed 真密度 / CDN / 生产 GO → **②** 测试网 / **③** 公网。

**冻结 SSOT：** [`COMMUNITY-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE1-FREEZE.md) · **详细证据：** [`COMMUNITY-L5-CLOSURE.md`](../../evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) · **五主 UI 壳：** [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

| 层级 | 文件 |
|------|------|
| 壳 | `app/community/layout.tsx` · `components/community/CommunityRouteShell.tsx` |
| 叠层 | 暖场 + podium/渐变（弱于 `/did-rank`，**88 §1.1**）· **无** `Web3SciFiBackground` |
| 子路由 | **18** 页（机读 **`communitySubRoutes.contract.test.ts`**）：Feed · explore · friends · messages · activity · me 子页 · user/post/topic · feedback 等 |
| **redirect** | **`tt/` → `explore`** · **`me/` → `/me/settings/profile`** · **`guidelines/` → `/terms/community-guidelines`** |
| 数据 | **API 主路径** `lib/apiClient/community/*`；dev 空库 **`communityShowcase.ts`** + **`data-tt-*`** 披露（**非** `communityMockData` 运行时主路径） |
| **Feed 内层 L5（① · 发现/masonry/geo）** | `CommunityFeedMain` · `CommunityFeedDiscoveryChrome` · `CommunityFeedMasonryGrid` · `communityFeedDiscoveryQuickFilters.ts` · `communityFeedMasonryCardViewModel.ts` · `lib/apiClient/community/feed.ts` · 后端 `feed_geo.rs` |
| Tab 激活 | **`COMMUNITY_SHELL_TAB_ACTIVE`** → **`TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM`**（**哑光 premium** · **`bg-ref-sun/10`** · **无 Action 渐变 fill**） |

**规格：** [31-TT社区](../../../docs/spec/31-TT社区页面设计.md) · [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

**L5 审计任务清单（① P1 全闭 · ②③ backlog）：** [`DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md`](../../evidence/GO_local_marketing_front_closure/DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) · 五页总表 [`FIVE-PAGES-L5-AUDIT-TASKS.md`](../../evidence/GO_local_marketing_front_closure/FIVE-PAGES-L5-AUDIT-TASKS.md)

---

## ① HTTP 数据链（代码真源 · 2026-06-03）

| 能力 | 方法 · 路径 | 前端 |
|------|-------------|------|
| Feed | `GET /api/v1/community/feed`（`mode` · `tag` · **`q`** · geo 等） | `useCommunityFeed` · `useCommunityFeedApi` · **`feedSearchMode`** |
| 发帖/互动 | `POST …/posts` · like/collect/comment/follow 等 | `PublishDrawer` · `useCommunityFeedPublishSubmit` |
| 活动中心 | **`GET …/me/activity`** · **`GET …/me/notifications`**（同源） | `activity/page.tsx` · `getMeActivity` · **`activity-events-v1` \| `likes-summary-v1`** |
| 发现目的地 | **`GET …/explore/destinations`** | `useCommunityExplorePage` · **`api-aggregate-v1` \| `static-v1`** |
| 消息/好友 | `GET …/conversations` · `…/friends` 等 | `messages/*` · `friends/page.tsx` |
| 我的子页 | `GET …/me/posts|collects|likes|…` | `me/*` |
| 反馈 | `GET/POST …/feedback` | `useCommunityFeedbackRemoteList` · 成功时 **`list-source=server`** only |
| Showcase | **无 HTTP** · 空库注入 | `shouldUseCommunityShowcaseOnEmpty()` — **production / testnet profile 硬关** |

**机读披露（节选）：**

```text
data-tt-community-feed-search-mode="api-text-q-v1" | "client-filter-topic-v1"
data-tt-community-activity-scope="activity-events-v1" | "likes-summary-v1"
data-tt-community-explore-dest-catalog="api-aggregate-v1" | "static-v1"
data-tt-community-feedback-list-source="server" | "local-mixed"
data-tt-community-feed-showcase="active-v1"   # 仅 dev showcase 激活时
```

**② 未闭（勿用 ① 冒充）：** 完整通知收件箱 · staging 真 UGC · CDN/HLS · PostGIS POI 全量 · **93** 矩阵 — 见 **COMMUNITY-PHASE1-FREEZE §②③**。

---

## ① 验收

```bash
bash scripts/dev/run-community-l5-green.sh
```

**发帖/头像链变更另闸：** `PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all`（见 **COMMUNITY-L5-CLOSURE**）

**注意：** `/community/me` **不**使用 `MePageBackground`（与 `/me` 区分，**88 §二**）；裸路径 **redirect** → 见 [`me/README.md`](me/README.md)

**②③：** 见 [`COMMUNITY-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE1-FREEZE.md) **§② / §③**
