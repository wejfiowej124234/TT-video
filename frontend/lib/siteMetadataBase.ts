/**
 * Canonical site origin for Next.js `metadataBase` / OG URL resolution.
 * Set **NEXT_PUBLIC_SITE_URL** in deploy (e.g. `https://app.example.com`); local dev falls back to **127.0.0.1:3012** (see `package.json` dev port).
 */
export function getSiteMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return new URL("http://127.0.0.1:3012");
      }
      return u;
    } catch {
      /* invalid env */
    }
  }
  return new URL("http://127.0.0.1:3012");
}
