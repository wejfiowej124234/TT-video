import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import {
  readCmsAnnouncementsCache,
  writeCmsAnnouncementsCache,
} from "@/lib/cmsAnnouncementsSharedCache";
import type { CmsPublicAnnouncementRow } from "@/lib/cmsPublicAnnouncementsTypes";
import type { TravelTrustAnnouncementLane } from "./traveltrustAnnouncementCatalog";
import type {
  TravelTrustAnnouncement,
  TravelTrustAnnouncementCtaKind,
  TravelTrustAnnouncementKind,
  TravelTrustContentTier,
} from "./traveltrustNetworkAnnouncements";
import { traveltrustSafeAnnouncementHref } from "./traveltrustSafeHref";

export type TravelTrustCmsCopy = {
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  bodyZh?: string | null;
  bodyEn?: string | null;
};

export type TravelTrustAnnouncementDisplay = TravelTrustAnnouncement & {
  cmsCopy?: TravelTrustCmsCopy;
  cmsSource?: boolean;
};

const CMS_OPS_LANES = new Set(["product", "governance", "protocol_status"]);

/** Internal / UAT slugs must never render on public marketing surfaces. */
export function isInternalCmsAnnouncementSlug(slug: string): boolean {
  return slug.startsWith("cms-ops-") || slug.startsWith("cms-uat-") || slug.startsWith("roadmap-uat-");
}

function filterPublicCmsRows(rows: CmsPublicAnnouncementRow[]): CmsPublicAnnouncementRow[] {
  return rows.filter((row) => !isInternalCmsAnnouncementSlug(row.slug));
}

function asKind(v: string): TravelTrustAnnouncementKind {
  if (v === "trust" || v === "community" || v === "campaign") return v;
  return "product";
}

function asTier(v: string): TravelTrustContentTier {
  if (v === "live" || v === "roadmap") return v;
  return "upcoming";
}

function asLane(v: string): TravelTrustAnnouncementLane | null {
  if (v === "governance" || v === "protocol_status" || v === "product") return v;
  return null;
}

function asCtaKind(v: string | null | undefined): TravelTrustAnnouncementCtaKind | undefined {
  if (v === "book_now" || v === "learn_more" || v === "vote_now" || v === "join_now") return v;
  return undefined;
}

export function mapCmsRowToTraveltrustAnnouncement(row: CmsPublicAnnouncementRow): TravelTrustAnnouncementDisplay | null {
  const lane = asLane(row.lane);
  if (!lane) return null;
  const safeHref = traveltrustSafeAnnouncementHref(row.cta_href);
  return {
    id: row.slug,
    lane,
    kind: asKind(row.kind),
    contentTier: asTier(row.content_tier),
    messageKey: row.message_key ?? `cms:${row.slug}`,
    releaseAt: row.release_at ?? undefined,
    effectiveAt: row.effective_at ?? undefined,
    targetAt: row.target_at ?? undefined,
    href: safeHref,
    ctaHref: safeHref,
    ctaKind: asCtaKind(row.cta_kind),
    pinned: row.pinned,
    networkScope: row.network_scope === "mainnet" ? "mainnet" : row.network_scope === "testnet" ? "testnet" : row.network_scope === "all" ? "all" : "none",
    cmsSource: true,
    cmsCopy: {
      titleZh: row.title_zh,
      titleEn: row.title_en,
      summaryZh: row.summary_zh,
      summaryEn: row.summary_en,
      bodyZh: row.body_zh,
      bodyEn: row.body_en,
    },
  };
}

async function fetchCmsJson(path: string): Promise<CmsPublicAnnouncementRow[]> {
  try {
    const res = await fetch(apiUrl(path), { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: CmsPublicAnnouncementRow[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchTraveltrustCmsAnnouncements(opts?: {
  lane?: string;
  pulse?: boolean;
}): Promise<TravelTrustAnnouncementDisplay[]> {
  if (opts?.pulse) {
    const cached = readCmsAnnouncementsCache();
    if (cached?.pulse.length) {
      return cached.pulse
        .map(mapCmsRowToTraveltrustAnnouncement)
        .filter(Boolean) as TravelTrustAnnouncementDisplay[];
    }
    const rows = filterPublicCmsRows(await fetchCmsJson(`${routes.publicAnnouncementsPulse}?limit=6`));
    writeCmsAnnouncementsCache({ pulse: rows });
    return rows.map(mapCmsRowToTraveltrustAnnouncement).filter(Boolean) as TravelTrustAnnouncementDisplay[];
  }

  const cacheKey = opts?.lane ?? "all";
  const cached = readCmsAnnouncementsCache();
  if (cached?.items.length && cacheKey === "all") {
    return cached.items
      .map(mapCmsRowToTraveltrustAnnouncement)
      .filter(Boolean) as TravelTrustAnnouncementDisplay[];
  }

  const q = opts?.lane ? `?lane=${encodeURIComponent(opts.lane)}` : "";
  const rows = filterPublicCmsRows(await fetchCmsJson(`${routes.publicAnnouncements}${q}`));
  if (!opts?.lane) writeCmsAnnouncementsCache({ items: rows });
  return rows.map(mapCmsRowToTraveltrustAnnouncement).filter(Boolean) as TravelTrustAnnouncementDisplay[];
}

export function traveltrustAnnouncementListText(
  item: TravelTrustAnnouncementDisplay,
  locale: string | undefined,
): string {
  if (item.cmsCopy) {
    const zh = locale?.startsWith("zh");
    const primary = zh ? item.cmsCopy.summaryZh || item.cmsCopy.titleZh : item.cmsCopy.summaryEn || item.cmsCopy.titleEn;
    const fallback = zh ? item.cmsCopy.summaryEn || item.cmsCopy.titleEn : item.cmsCopy.summaryZh || item.cmsCopy.titleZh;
    return primary || fallback || "";
  }
  return "";
}

export function traveltrustAnnouncementTitleText(
  item: TravelTrustAnnouncementDisplay,
  locale: string | undefined,
): string | null {
  if (!item.cmsCopy) return null;
  const zh = locale?.startsWith("zh");
  const primary = zh ? item.cmsCopy.titleZh : item.cmsCopy.titleEn;
  const fallback = zh ? item.cmsCopy.titleEn : item.cmsCopy.titleZh;
  return primary || fallback || null;
}

export function traveltrustAnnouncementBodyText(
  item: TravelTrustAnnouncementDisplay,
  locale: string | undefined,
): string | null {
  if (!item.cmsCopy) return null;
  const zh = locale?.startsWith("zh");
  const primary = zh ? item.cmsCopy.bodyZh : item.cmsCopy.bodyEn;
  const fallback = zh ? item.cmsCopy.bodyEn : item.cmsCopy.bodyZh;
  return (primary || fallback || "").trim() || null;
}

/** CMS is SSOT when lane has published rows; static catalog is emergency fallback only. */
export function mergeTraveltrustAnnouncementsByLane(
  staticItems: TravelTrustAnnouncement[],
  cmsItems: TravelTrustAnnouncementDisplay[],
  lane: TravelTrustAnnouncementLane,
): TravelTrustAnnouncementDisplay[] {
  const cmsLane = cmsItems.filter((i) => i.lane === lane);
  if (cmsLane.length > 0) {
    return cmsLane;
  }
  return staticItems.filter((i) => i.lane === lane);
}

export function mergeTraveltrustPulseAnnouncements(
  staticPulse: TravelTrustAnnouncement[],
  cmsPulse: TravelTrustAnnouncementDisplay[],
  max = 6,
): TravelTrustAnnouncementDisplay[] {
  if (cmsPulse.length > 0) {
    return cmsPulse.slice(0, max);
  }
  return staticPulse.slice(0, max);
}

export function isCmsOpsLane(lane: string): boolean {
  return CMS_OPS_LANES.has(lane);
}
