import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "../../communityMeDrawerListCaps";
import { utf8ByteLength } from "../../utf8ByteLength";

/** 与 **`communityMeDrawerListCaps`** 同源；经本域再导出，便于 **`@/lib/apiClient`** barrel 与 **`getMeLikes`/`getMeCollects`** 同路径消费。 */
export { COMMUNITY_ME_DRAWER_LIST_ID_CAP };

/** 与 `posts.rs` **`FEED_LIMIT`** 同源：未传 `limit` 时服务端默认页大小。 */
export const COMMUNITY_FEED_LIST_DEFAULT_PAGE = 20;

/** Feed / `me/posts` / `users/:id/posts`：服务端 **`limit.min(100).max(1)`**（①②③ 同钳位）。 */
export const COMMUNITY_FEED_LIST_API_MAX = 100;

/**
 * Feed **`tag`**、**`GET …/stats/posts-by-tag`**、**`POST …/posts` `tags[]` 单条**：**UTF-8 字节**上限（与 **`posts.rs`** **`str::len()`** 一致；非 JS `string.length`）。
 */
export const COMMUNITY_FEED_TAG_QUERY_MAX_LEN = 64;

/** trim 后非空且 UTF-8 字节数不超过 {@link COMMUNITY_FEED_TAG_QUERY_MAX_LEN}（与后端 `tag` / 发帖 `tags[]` 项一致）。 */
export function communityPostTagWithinServerUtf8Limit(raw: string): boolean {
  const t = raw.trim();
  return t.length > 0 && utf8ByteLength(t) <= COMMUNITY_FEED_TAG_QUERY_MAX_LEN;
}

/** trim 后非空且 UTF-8 字节数 **超过** {@link COMMUNITY_FEED_TAG_QUERY_MAX_LEN}（与超长话题条、搜索 Enter 预检同源）。 */
export function communityPostTagExceedsServerUtf8Limit(raw: string): boolean {
  const t = raw.trim();
  return t.length > 0 && utf8ByteLength(t) > COMMUNITY_FEED_TAG_QUERY_MAX_LEN;
}

/** trim 后 **`tag`** 的 UTF-8 字节数（与 **`community_topic_tag_exceeds_api_limit_notice`** 的 **`{{len}}`**、Rust **`str::len()`** 同源）。 */
export function communityPostTagUtf8ByteLenTrimmed(raw: string): number {
  return utf8ByteLength(raw.trim());
}

/** **`POST …/community/posts`** **`tags[]`**：trim、去重后的最大条数（与 **`crates/api/src/routes/community/posts/types.rs`** **`COMMUNITY_POST_TAGS_MAX_COUNT`** 同源）。 */
export const COMMUNITY_POST_TAGS_MAX_COUNT = 16;

export function clampCommunityFeedListQueryLimit(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  return Math.min(COMMUNITY_FEED_LIST_API_MAX, n);
}

/** 与 **`common::COMMENT_THREAD_FETCH_CAP`** / **`comments_sql_limit_for_sort`** 的 **`1..=cap`** 钳位同源。 */
export const COMMUNITY_COMMENT_LIST_API_MAX = 500;

/** 与 **`crates/api/src/routes/community/common/limits.rs`** **`COMMENT_CHRONO_ROOT_PAGE_MAX`**（**80**）同源：**`chronological` + `cursor`** 每页根评上限。 */
export const COMMUNITY_COMMENT_CHRONO_ROOT_PAGE_MAX = 80;

export function clampCommunityCommentListQueryLimit(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  const n = Math.floor(raw);
  if (n < 1) return 1;
  return Math.min(COMMUNITY_COMMENT_LIST_API_MAX, n);
}

/** 与 `get_me_community_reports` **`lim > 100` → 100** 钳位一致（04 §三、①②③ 同参）。 */
export const COMMUNITY_ME_REPORTS_LIST_API_MAX = 100;
