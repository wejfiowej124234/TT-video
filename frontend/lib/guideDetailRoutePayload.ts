/**
 * 向导详情页：校验 `GET /guides/:id` 返回体，避免畸形 JSON 被当作有效向导渲染（IA / 空字段掩盖）。
 */
export function parseGuideDetailForRoute(raw: unknown, expectedId: string): Record<string, unknown> | null {
  const idTrim = expectedId.trim();
  if (!idTrim) return null;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const rid = String(o.id ?? "").trim();
  if (!rid || rid !== idTrim) return null;
  return o;
}
