/** User-facing datetime (L5 · avoids raw ISO in product UI). */
export function formatUserFacingDateTime(
  iso: string | null | undefined,
  locale?: string,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
}
