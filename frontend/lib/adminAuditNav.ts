/** Deep-link to admin audit log list with exact `action` filter (matches API `GET …/audit-logs?action=`). */
export function adminAuditListPathForAction(action: string, limit = 50): string {
  const lim = Math.min(200, Math.max(1, Math.floor(limit)));
  const sp = new URLSearchParams();
  sp.set("limit", String(lim));
  sp.set("action", action);
  return `/admin/audit?${sp.toString()}`;
}
