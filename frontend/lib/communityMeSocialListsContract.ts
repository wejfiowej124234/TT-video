/**
 * 社区关系读路径：`getMeFollowing` / `getMeFollowers` / `getFriendsList` / 好友申请 / `getMeCollects`
 * 在 HTTP 200 下对应列表字段须为数组，否则不得冒充空列表或 0（与 `/community/me` 统计条同源策略）。
 */
export type CommunityMeSocialListKey = "following" | "followers" | "friends";

export function countCommunityMeSocialList(
  data: unknown,
  key: CommunityMeSocialListKey
): { kind: "ok"; n: number } | { kind: "invalid" } {
  if (data == null || typeof data !== "object" || Array.isArray(data)) return { kind: "invalid" };
  const arr = (data as Record<string, unknown>)[key];
  if (!Array.isArray(arr)) return { kind: "invalid" };
  return { kind: "ok", n: arr.length };
}

/** `GET …/friends/requests` 与 `…/requests/sent`：`requests` 须为数组。 */
export function countCommunityRequestsEnvelope(
  data: unknown
): { kind: "ok"; items: unknown[] } | { kind: "invalid" } {
  if (data == null || typeof data !== "object" || Array.isArray(data)) return { kind: "invalid" };
  const r = (data as Record<string, unknown>).requests;
  if (!Array.isArray(r)) return { kind: "invalid" };
  return { kind: "ok", items: r };
}

/** `GET …/me/collects`：`collects` 须为数组。 */
export function countCommunityCollectsEnvelope(
  data: unknown
): { kind: "ok"; items: unknown[] } | { kind: "invalid" } {
  if (data == null || typeof data !== "object" || Array.isArray(data)) return { kind: "invalid" };
  const c = (data as Record<string, unknown>).collects;
  if (!Array.isArray(c)) return { kind: "invalid" };
  return { kind: "ok", items: c };
}
