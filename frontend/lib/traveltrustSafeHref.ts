/** Safe href for CMS CTA — relative `/path` or `https://` only (mirrors Rust validate_cms_cta_href). */
export function traveltrustSafeAnnouncementHref(href: string | undefined | null): string | undefined {
  if (!href?.trim()) return undefined;
  const h = href.trim();
  const lower = h.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("data:")) return undefined;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (h.startsWith("https://") && !h.startsWith("https:////")) return h;
  return undefined;
}
