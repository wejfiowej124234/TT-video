/** Human absolute timestamp for Admin lists (① · Batch-9). Avoid raw ISO in ops UI. */
export function formatAdminAbsoluteTime(iso: string | undefined): string {
  if (!iso?.trim()) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
