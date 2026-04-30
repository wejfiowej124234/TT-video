/**
 * `GET …/stats/posts-by-tag`（`getPublicPostsByTagCount`）：`ok` 时 `post_count` 须为有限 number；
 * `degraded` 时 `post_count` 可缺省或非数字，按 `null`（UI 不冒充精确总数）。
 */

export const TRAVELTRUST_COMMUNITY_TAG_COUNT_CONTRACT_INVALID = "TRAVELTRUST_COMMUNITY_TAG_COUNT_CONTRACT_INVALID";

export type PublicPostsByTagCountParsed =
  | { kind: "ok"; postCount: number }
  | { kind: "degraded"; postCount: number | null }
  | { kind: "invalid" };

export function parsePublicPostsByTagCountEnvelope(data: unknown): PublicPostsByTagCountParsed {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { kind: "invalid" };
  }
  const o = data as Record<string, unknown>;
  const st = o.status;
  if (st === "ok") {
    const n = o.post_count;
    if (typeof n !== "number" || !Number.isFinite(n)) {
      return { kind: "invalid" };
    }
    return { kind: "ok", postCount: n };
  }
  if (st === "degraded") {
    const n = o.post_count;
    if (typeof n === "number" && Number.isFinite(n)) {
      return { kind: "degraded", postCount: n };
    }
    return { kind: "degraded", postCount: null };
  }
  return { kind: "invalid" };
}

/** React Query 用：契约无效抛错；`degraded` 且无可用 `post_count` 时单独标记（与「从未返回」区分）。 */
export type CommunityTagPostStatsPayload =
  | { kind: "count"; postCount: number }
  | { kind: "degraded_unknown" };

export function communityTagPostStatsFromEnvelope(data: unknown): CommunityTagPostStatsPayload {
  const p = parsePublicPostsByTagCountEnvelope(data);
  if (p.kind === "invalid") {
    throw new Error(TRAVELTRUST_COMMUNITY_TAG_COUNT_CONTRACT_INVALID);
  }
  if (p.kind === "ok") {
    return { kind: "count", postCount: p.postCount };
  }
  if (p.postCount != null) {
    return { kind: "count", postCount: p.postCount };
  }
  return { kind: "degraded_unknown" };
}
