import type { CommunityComment } from "@/lib/communityMockData";

/**
 * `GET …/comments` **`chronological` + cursor** 追加页：按 **`id`** 去重拼接，与 **`useCommunityDrawerCommentsQuery.loadMoreComments`** 行为同源（①②③）。
 */
export function mergeCommunityCommentPages(
  existing: readonly CommunityComment[],
  chunk: readonly CommunityComment[]
): CommunityComment[] {
  const seen = new Set(existing.map((c) => c.id));
  const merged = [...existing];
  for (const c of chunk) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      merged.push(c);
    }
  }
  return merged;
}

/**
 * 主 Feed 评论抽屉：**`GET …/comments`** 顺序在前，**乐观本地行**（尚未出现在 GET 结果中的 `id`）附在末尾；同 **`id`** 以 API 行为准（与 **`useCommunityFeed` `commentsForPost` / `commentsForDetail`** 同源，①②③）。
 */
export function mergeApiCommentsWithLocalOptimistic(
  api: readonly CommunityComment[],
  local: readonly CommunityComment[]
): CommunityComment[] {
  const locals = local.filter((l) => !api.some((a) => a.id === l.id));
  return [...api, ...locals];
}
