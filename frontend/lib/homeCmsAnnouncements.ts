/**
 * Homepage Announcement · CMS-only consumer.
 * Never merges traveltrustNetworkAnnouncements / static catalog.
 */
import { getPublicCmsAnnouncements } from "@/lib/apiClient";
import type { CmsPublicAnnouncementRow } from "@/lib/cmsPublicAnnouncementsTypes";
import { registerHomeCmsAnnouncementsInvalidate } from "@/lib/cmsAnnouncementsSharedCache";

export type HomeCmsAnnouncementFetchResult = {
  items: CmsPublicAnnouncementRow[];
  source: string;
};

type HomeCache = { at: number; items: CmsPublicAnnouncementRow[]; source: string };
let homeCache: HomeCache | null = null;
const TTL_MS = 30_000;

registerHomeCmsAnnouncementsInvalidate(() => {
  homeCache = null;
});

export function pickHomeCmsAnnouncementText(
  row: CmsPublicAnnouncementRow,
  locale: string | undefined,
): { title: string; summary: string } {
  const zh = !locale || locale.startsWith("zh");
  const title = (zh ? row.title_zh : row.title_en) || row.title_en || row.title_zh || "";
  const summary =
    (zh ? row.summary_zh : row.summary_en) || row.summary_en || row.summary_zh || "";
  return { title, summary };
}

export async function fetchHomeCmsAnnouncements(opts?: {
  limit?: number;
  bypassCache?: boolean;
}): Promise<HomeCmsAnnouncementFetchResult> {
  if (!opts?.bypassCache && homeCache && Date.now() - homeCache.at <= TTL_MS) {
    return { items: homeCache.items, source: homeCache.source };
  }

  const res = await getPublicCmsAnnouncements({
    for_home: true,
    limit: opts?.limit ?? 3,
  });

  const items = res.items ?? [];
  const source =
    res.source === "cms" || res.source === "cms_empty" ? res.source : "unavailable";
  homeCache = { at: Date.now(), items, source };
  return { items, source };
}

export function invalidateHomeCmsAnnouncementsCache(): void {
  homeCache = null;
}
