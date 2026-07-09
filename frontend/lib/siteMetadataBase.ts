/** Brand canonical origin when `NEXT_PUBLIC_SITE_URL` is unset (avoids loopback OG leaks in PER walks). */
const METADATA_BASE_FALLBACK = "https://traveltrust.app";

/**
 * Canonical site origin for Next.js `metadataBase` / OG URL resolution.
 * Set **NEXT_PUBLIC_SITE_URL** in deploy (e.g. `https://app.example.com`).
 */
export function getSiteMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return new URL(METADATA_BASE_FALLBACK);
      }
      return u;
    } catch {
      /* invalid env */
    }
  }
  return new URL(METADATA_BASE_FALLBACK);
}
