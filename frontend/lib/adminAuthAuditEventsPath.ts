export type AdminAuthAuditListQuery = {
  limit: number;
  event_type: string;
  reason: string;
  user_id: string;
};

export function clampAdminAuthAuditLimit(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

export function parseAdminAuthAuditListQuery(sp: URLSearchParams): AdminAuthAuditListQuery {
  return {
    limit: clampAdminAuthAuditLimit(Number.parseInt(sp.get("limit") ?? "50", 10)),
    event_type: (sp.get("event_type") ?? "").trim(),
    reason: (sp.get("reason") ?? "").trim(),
    user_id: (sp.get("user_id") ?? "").trim(),
  };
}

export function buildAdminAuthAuditEventsPath(q: AdminAuthAuditListQuery): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.event_type) sp.set("event_type", q.event_type);
  if (q.reason) sp.set("reason", q.reason);
  if (q.user_id) sp.set("user_id", q.user_id);
  return `/admin/auth-audit-events?${sp.toString()}`;
}
