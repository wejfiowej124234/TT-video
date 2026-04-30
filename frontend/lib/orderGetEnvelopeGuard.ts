/**
 * `GET /api/v1/orders/:id` 成功体常为 `{ status, order, itinerary? }`。
 * 防止畸形/错单响应被合并进当前 UI（与 `parseGuideDetailForRoute` 同源策略）。
 */
export function parseApiOrderId(apiOrder: unknown): string | null {
  if (typeof apiOrder !== "object" || apiOrder === null || Array.isArray(apiOrder)) return null;
  const o = apiOrder as Record<string, unknown>;
  const raw = o.order_id ?? o.id;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s || null;
}

export function apiOrderSliceMatchesRoute(apiOrder: unknown, expectedOrderId: string): boolean {
  const exp = expectedOrderId.trim();
  if (!exp) return false;
  const rid = parseApiOrderId(apiOrder);
  return rid != null && rid === exp;
}
