/** 入驻队列列表页 URL `?status=` 同步（provider / steward）。 */

export function parseAdminQueueStatusQuery(
  sp: URLSearchParams,
  defaultStatus: string,
): string {
  if (!sp.has("status")) return defaultStatus;
  return (sp.get("status") ?? "").trim();
}

export function buildAdminQueueListPath(basePath: string, status: string): string {
  const sp = new URLSearchParams();
  const st = status.trim();
  if (st) sp.set("status", st);
  const q = sp.toString();
  return q ? `${basePath}?${q}` : basePath;
}
