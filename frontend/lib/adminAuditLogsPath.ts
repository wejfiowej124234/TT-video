/** Query params for `GET …/audit-logs` list UI (`/admin/audit`). */
export function clampAdminAuditLimit(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

export function buildAdminAuditLogsPath(q: {
  limit: number;
  actor_id: string;
  action: string;
  resource_type: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampAdminAuditLimit(q.limit)));
  if (q.actor_id.trim()) sp.set("actor_id", q.actor_id.trim());
  if (q.action.trim()) sp.set("action", q.action.trim());
  if (q.resource_type.trim()) sp.set("resource_type", q.resource_type.trim());
  return `/admin/audit?${sp.toString()}`;
}

/** Isolated list URL from audit log detail fields (single filter + default limit). */
export type AdminAuditDetailLinkField = "action" | "actor_id" | "resource_type";

export function adminAuditLogDetailFieldListHref(
  field: AdminAuditDetailLinkField,
  value: unknown,
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const v = value.trim();
  if (field === "action")
    return buildAdminAuditLogsPath({ limit: 50, actor_id: "", action: v, resource_type: "" });
  if (field === "actor_id")
    return buildAdminAuditLogsPath({ limit: 50, actor_id: v, action: "", resource_type: "" });
  return buildAdminAuditLogsPath({ limit: 50, actor_id: "", action: "", resource_type: v });
}
