/**
 * `GET /api/v1/community/feed` 单页体：`ok` 时 `posts` 须为数组（可为空），`next_cursor` 仅允许 string | null | 缺省；
 * `degraded` 时 `posts` 可缺省或非数组，按空列表处理（与壳层降级 banner 一致），不得冒充「ok 空 feed」。
 */

export type CommunityFeedPageParsed =
  | { kind: "ok"; posts: unknown[]; nextCursor: string | null }
  | { kind: "degraded"; posts: unknown[]; envelope: unknown }
  | { kind: "invalid" };

export function parseCommunityFeedPageEnvelope(data: unknown): CommunityFeedPageParsed {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { kind: "invalid" };
  }
  const o = data as Record<string, unknown>;
  const st = o.status;
  if (st === "ok") {
    const rawPosts = o.posts;
    if (!Array.isArray(rawPosts)) {
      return { kind: "invalid" };
    }
    const rawNext = o.next_cursor;
    if (rawNext != null && typeof rawNext !== "string") {
      return { kind: "invalid" };
    }
    const next =
      rawNext == null ? null : rawNext.trim() === "" ? null : rawNext.trim();
    return { kind: "ok", posts: rawPosts, nextCursor: next };
  }
  if (st === "degraded") {
    const rawPosts = o.posts;
    const posts = Array.isArray(rawPosts) ? rawPosts : [];
    return { kind: "degraded", posts, envelope: data };
  }
  return { kind: "invalid" };
}
