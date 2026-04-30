# GO_95 · §7.2 社区帖子橱窗（**F-031** · **`commerce_showcase_kind` 优先**）· 2026-04-21

## 后端 SSOT（写入 / 校验）

| 项 | 文件 | 说明 |
|----|------|------|
| **发帖 JSON 解析** | **`crates/api/src/routes/community/posts.rs`** **`parse_create_post_commerce_body`** | **`commerce_showcase_kind`** 仅允许 **`itinerary_led` \| `lodging_led` \| `acquisition_led` \| `general_led`**；非法值 → **`invalid_commerce_showcase_kind`**；**`commerce_market_listing_id`** 可选 **UUID**。 |
| **持久化** | **`crates/api/src/db/community.rs`** | **`INSERT`/`SELECT`** 含 **`commerce_showcase_kind`**、**`commerce_market_listing_id`**。 |
| **单测** | **`crates/api/src/routes/community/tests_create_post_commerce_db.rs`** | **`general_led` / `acquisition_led`** 等写入后 **`SELECT`** 校验列值。 |

## 前端映射（Feed / me 同源）

| 项 | 文件 | 说明 |
|----|------|------|
| **API → `CommunityPost`** | **`frontend/components/community/communityFeedMappers.ts`** **`mapApiPostToCommunityPost`** | **`COMMERCE_SHOWCASE_KINDS`** **Set** 白名单；未知字符串 **`→ undefined`**（**不**把脏值塞进 UI）。 |
| **单测** | **`frontend/components/community/communityFeedMappers.test.ts`** | 合法 kind 映射；**`bogus_kind`** **忽略**。 |

## 「社区帖子」Tab / 橱窗 UI（对客 **§3 · F-031** 叙事）

| 项 | 文件 | 说明 |
|----|------|------|
| **权威 vs 启发式** | **`frontend/lib/communityMePostsShowcaseModel.ts`** | 文档注释：**后端 `commerce_showcase_kind` 为权威**；**`inferCommunityMePostsShowcaseKind`** 先读 **`post.commerceShowcaseKind`**，否则 **`haystack`** 启发式；**`isCommunityMePostsShowcaseKindFromApi`** 区分 **API 角标** vs **`~` 推断**。 |
| **橱窗网格** | **`frontend/components/me/communityMeNotes/CommunityMePostsShowcaseThumbGrid.tsx`** | **`inferCommunityMePostsShowcaseKind`** + **`kindFromApi`**：**有 API kind** 显示纯 **`kindLabel`**；否则 **`~${kindLabel}`** + **`community_me_posts_showcase_kind_inferred_hint`** **`title`**。 |
| **数据拉取** | **`frontend/lib/communityMePostsDrawerFetch.ts`** **`fetchAllPostsForCommunityMeDrawer`** | **`getMyPosts`** 游标分页，与 **`parseMyPostsPageEnvelope`** 契约一致。 |
| **入口** | **`frontend/app/community/me/page.tsx`** + **`CommunityMePostsExperience.tsx`** | **`?tab=posts`** 抽屉内挂载 **`CommunityMePostsShowcaseThumbGrid`**。 |

## 市场侧发帖辅助（带 kind）

- **`frontend/lib/marketProductCommunityPublish.ts`**：构造 **`POST /community/posts`** body 时写入 **`commerce_showcase_kind`**（**`general_led` / `acquisition_led` / `itinerary_led`** 等），与 **API 客户端** **`frontend/lib/apiClient/community.ts`** 类型注释一致。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§8.2 · F-031** **行完成**/**MANUAL**/**93 D**；**不**声称 **`market_listings`** 全扇面已产品终验。
