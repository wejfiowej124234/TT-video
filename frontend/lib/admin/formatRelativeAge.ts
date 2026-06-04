/** 列表「等待多久」展示（① 相对时间，非全库 SLA）。 */
export function formatRelativeAge(iso: string | undefined, nowMs = Date.now()): string {
  if (!iso?.trim()) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const mins = Math.max(0, Math.floor((nowMs - t) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
