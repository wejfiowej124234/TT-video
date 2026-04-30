# GO_95 · §7.1 域 G（社区）审计证据 · 2026-04-21

## **`/community/*` 页面扇面（**17** `page.tsx`）

| 路径 | 角色 |
|------|------|
| **`/community`** | 入口 **`frontend/app/community/page.tsx`** |
| **`/community/explore`** | **`getFeed`**（**`routes.community.feed`**）+ **`mapApiReadError`** / **`communityFeedDegradedMessage`**（**§7.2** 横切；本域记入口） |
| **`/community/me`** | **`getMeFollowing`** 等 + **`CommunityMe*Experience`**（赞/藏/帖壳） |
| **`/community/me/posts`**、**`/likes`**、**`/collects`** | **Me** 子列表与 **04** **`GET …/me/posts|likes|collects`** 同源消费面 |
| **`/community/me/reports`**、**`/me/reports/[id]`** | **`getMyCommunityReports`** 等 ↔ **`routes.community.meReports`** / **`reportById`** |
| **`/community/post/[id]`** | 帖详情 + 互动 |
| **`/community/topic/[tag]`**、**`/activity`**、**`/user/[id]`**、**`/friends`**、**`/messages`**、**`/feedback`**、**`/tt`** | 话题/活动/用户/好友/DM/反馈/TT 壳；与 **04** **`routes.community.*`** 族交叉 |

（完整枚举以仓库 **`find frontend/app/community -name 'page.tsx'`** 为准。）

## 点赞 / 收藏 / 举报 → **PG**（与 **`api.ts`** / **`apiClient/community.ts`**）

| 能力 | API | 客户端 |
|------|-----|--------|
| **Feed** | **`GET /api/v1/community/feed`** | **`getFeed`** |
| **发帖** | **`POST /api/v1/community/posts`** | **`createCommunityPost`** 等（**`routes.community.posts`**） |
| **赞** | **`POST/DELETE …/posts/:id/like`** | **`postLike`** / **`deleteLike`**（**`community.posts.test.ts`** 契约） |
| **藏** | **`POST/DELETE …/posts/:id/collect`** | **`postCollect`** / **`deleteCollect`** |
| **举报** | **`POST /api/v1/community/reports`**、**`GET …/me/reports`**、**`GET …/reports/:id`** | **`postCommunityReport`**、**`getMyCommunityReports`** 等（**`community.ts`** 注释锚 **160** / **04**） |

## 错误态

- **`mapApiReadError`**（读路径）与 **`interpretCommunityWriteError`** / **`formatCommunityApiMessage`**（写路径）在 **`/community/explore`**、**`/community/me/reports`** 等页使用；**`ApiErrorAlert`** / **`CommunityMeDataStateSurface`** / **`deriveListDataState`** 结构化空态与 **31**/**88** 叙述对齐（抽检，**不**替代全文审计）。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0
```

## 边界

**不**替代 **§8.2** **F-014～019** 行完成；**不**替代 **160/31** 全文终验或 **93 D** 全量 **PASS**。
