/**
 * `GET …/community/feedback`：`ok` 时 `items` 须为数组（可为空）；
 * `degraded` 时 `items` 可缺省或非数组，按空列表处理。
 */

export type CommunityFeedbackListParsed =
  | { kind: "ok"; items: unknown[] }
  | { kind: "degraded"; items: unknown[]; envelope: unknown }
  | { kind: "invalid" };

export function parseCommunityFeedbackListEnvelope(data: unknown): CommunityFeedbackListParsed {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { kind: "invalid" };
  }
  const o = data as Record<string, unknown>;
  const st = o.status;
  if (st === "ok") {
    const raw = o.items;
    if (!Array.isArray(raw)) {
      return { kind: "invalid" };
    }
    return { kind: "ok", items: raw };
  }
  if (st === "degraded") {
    const raw = o.items;
    const items = Array.isArray(raw) ? raw : [];
    return { kind: "degraded", items, envelope: data };
  }
  return { kind: "invalid" };
}
