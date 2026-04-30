/**
 * `/community/me` 抽屉列表：防止 `{ status: "ok" }` 但缺少 `likes` / `collects` / `posts` 时被当成「真实空列表」（IA 误表）。
 */

export type DrawerListParseOk<T> = { kind: "ok"; value: T };
export type DrawerListParseInvalid = { kind: "invalid"; reason: "not_object" | "bad_status" | "bad_shape" };

export const TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID = "TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID";

function envelopeBase(data: unknown): { kind: "ok"; o: Record<string, unknown> } | DrawerListParseInvalid {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { kind: "invalid", reason: "not_object" };
  }
  const o = data as Record<string, unknown>;
  if (o.status !== "ok" && o.status !== "degraded") {
    return { kind: "invalid", reason: "bad_status" };
  }
  return { kind: "ok", o };
}

/** `GET …/me/likes`：须含数组 `likes`（可为空）。 */
export function parseMeLikesListEnvelope(data: unknown): DrawerListParseInvalid | DrawerListParseOk<string[]> {
  const b = envelopeBase(data);
  if (b.kind === "invalid") return b;
  const { likes } = b.o;
  if (!Array.isArray(likes)) {
    return { kind: "invalid", reason: "bad_shape" };
  }
  const ids = likes
    .map((row) => (row != null && typeof row === "object" && !Array.isArray(row) ? (row as { post_id?: unknown }).post_id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return { kind: "ok", value: ids };
}

/** `GET …/me/collects`：须含数组 `collects`（可为空）。 */
export function parseMeCollectsListEnvelope(data: unknown): DrawerListParseInvalid | DrawerListParseOk<string[]> {
  const b = envelopeBase(data);
  if (b.kind === "invalid") return b;
  const { collects } = b.o;
  if (!Array.isArray(collects)) {
    return { kind: "invalid", reason: "bad_shape" };
  }
  const ids = collects
    .map((row) => (row != null && typeof row === "object" && !Array.isArray(row) ? (row as { post_id?: unknown }).post_id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return { kind: "ok", value: ids };
}

/**
 * `GET …/me/posts` 与 **`GET …/users/:id/posts`** 单页体一致：须含数组 `posts`（可为空）；
 * `status` 为 `ok` | `degraded`；`next_cursor` 仅允许 string。
 */
export function parseMyPostsPageEnvelope(data: unknown): DrawerListParseInvalid | DrawerListParseOk<{ posts: unknown[]; next_cursor: string }> {
  const b = envelopeBase(data);
  if (b.kind === "invalid") return b;
  const { posts, next_cursor } = b.o;
  if (!Array.isArray(posts)) {
    return { kind: "invalid", reason: "bad_shape" };
  }
  let next = "";
  if (next_cursor != null) {
    if (typeof next_cursor !== "string") {
      return { kind: "invalid", reason: "bad_shape" };
    }
    next = next_cursor.trim();
  }
  return { kind: "ok", value: { posts, next_cursor: next } };
}
