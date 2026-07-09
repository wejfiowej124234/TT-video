import type { CmsPublicAnnouncementRow } from "@/lib/server/cmsPublicAnnouncementsDb";

type CacheEntry = { at: number; items: CmsPublicAnnouncementRow[]; pulse: CmsPublicAnnouncementRow[] };

let cache: CacheEntry | null = null;
const TTL_MS = 30_000;

export function readCmsAnnouncementsCache(): CacheEntry | null {
  if (!cache) return null;
  if (Date.now() - cache.at > TTL_MS) {
    cache = null;
    return null;
  }
  return cache;
}

export function writeCmsAnnouncementsCache(partial: {
  items?: CmsPublicAnnouncementRow[];
  pulse?: CmsPublicAnnouncementRow[];
}): void {
  const prev = cache ?? { at: 0, items: [], pulse: [] };
  cache = {
    at: Date.now(),
    items: partial.items ?? prev.items,
    pulse: partial.pulse ?? prev.pulse,
  };
}

export function invalidateCmsAnnouncementsCache(): void {
  cache = null;
}
