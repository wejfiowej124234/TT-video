/**
 * `GET /api/v1/community/me/likes-received` 响应契约：成功包络下须含可解析的非负 `likes_received`。
 * 避免将缺失/畸形字段静默当成 0（生产 IA：不得冒充「真实获赞为零」）。
 */
export const communityMeLikesReceivedQueryKey = ["community", "meLikesReceived"] as const;

export type MeLikesReceivedParse =
  | { kind: "ok"; n: number }
  | { kind: "invalid"; reason: "not_object" | "bad_status" | "missing" | "bad_type" | "not_finite" | "negative" };

export function parseCommunityMeLikesReceivedResponse(data: unknown): MeLikesReceivedParse {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { kind: "invalid", reason: "not_object" };
  }
  const o = data as Record<string, unknown>;
  if (o.status !== "ok" && o.status !== "degraded") {
    return { kind: "invalid", reason: "bad_status" };
  }
  if (!("likes_received" in o)) {
    return { kind: "invalid", reason: "missing" };
  }
  const raw = o.likes_received;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw)
        : NaN;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return { kind: "invalid", reason: "bad_type" };
  }
  if (n < 0) {
    return { kind: "invalid", reason: "negative" };
  }
  return { kind: "ok", n: Math.max(0, Math.floor(n)) };
}
