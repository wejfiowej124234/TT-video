/**
 * `GET /api/v1/disputes/:id` 成功体为 `{ status, dispute }`；校验 `dispute.id` 与路由一致，防畸形合并。
 */
export function parseApiDisputeId(dispute: unknown): string | null {
  if (typeof dispute !== "object" || dispute === null || Array.isArray(dispute)) return null;
  const o = dispute as Record<string, unknown>;
  const raw = o.id;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s || null;
}

export function apiDisputeSliceMatchesRoute(dispute: unknown, expectedDisputeId: string): boolean {
  const exp = expectedDisputeId.trim();
  if (!exp) return false;
  const rid = parseApiDisputeId(dispute);
  return rid != null && rid === exp;
}
