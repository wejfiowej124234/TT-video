const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLoopbackHostname(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase());
}

/** 开发态 canonical 站点 origin（`NEXT_PUBLIC_SITE_URL` 或 127.0.0.1:3012）。 */
export function devCanonicalSiteOrigin(): string | null {
  if (typeof process === "undefined" || process.env.NODE_ENV === "production") return null;
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    } catch {
      /* ignore */
    }
  }
  const port = (process.env.TRAVELTRUST_FRONTEND_PORT || process.env.FRONTEND_PORT || "3012").trim();
  return `http://127.0.0.1:${port}`;
}

/**
 * 统一 localhost ↔ 127.0.0.1，避免 IDE iframe / 书签混用 host 触发跨源与子资源失败。
 * 仅在开发态、当前与 canonical 同为 loopback 且仅 host 不同时 `replace` 一次。
 */
export function resolveDevLoopbackOriginRedirect(href: string): string | null {
  if (typeof process === "undefined" || process.env.NODE_ENV === "production") return null;
  const canonical = devCanonicalSiteOrigin();
  if (!canonical) return null;
  let cur: URL;
  let want: URL;
  try {
    cur = new URL(href);
    want = new URL(canonical);
  } catch {
    return null;
  }
  if (!isLoopbackHostname(cur.hostname) || !isLoopbackHostname(want.hostname)) return null;
  if (cur.origin === want.origin) return null;
  if (cur.protocol !== want.protocol) return null;
  return `${want.origin}${cur.pathname}${cur.search}${cur.hash}`;
}
