import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import type {
  CmsRoadmapMilestoneAdmin,
  CmsRoadmapMilestonePublic,
  CmsRoadmapSectionAdmin,
  CmsRoadmapSectionPublic,
  RoadmapOpsStatus,
} from "@/lib/cmsRoadmapTypes";
import type {
  TravelTrustAnnouncementCtaKind,
  TravelTrustAnnouncementKind,
} from "./traveltrustNetworkAnnouncements";
import {
  TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR,
  listTraveltrustRoadmap2026Milestones,
  type TravelTrustRoadmapMilestone,
  type TravelTrustRoadmapOpsStatus,
} from "./traveltrustRoadmap2026";
import { traveltrustSafeAnnouncementHref } from "./traveltrustSafeHref";

export type TravelTrustRoadmapSectionDisplay = {
  anchorId: string;
  periodLabel: string;
  kickerZh: string;
  kickerEn: string;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  disclaimerZh: string;
  disclaimerEn: string;
};

export type TravelTrustRoadmapMilestoneDisplay = TravelTrustRoadmapMilestone & {
  cmsCopy?: {
    titleZh: string;
    titleEn: string;
    summaryZh: string;
    summaryEn: string;
  };
};

export type TravelTrustRoadmapBundle = {
  section: TravelTrustRoadmapSectionDisplay | null;
  milestones: TravelTrustRoadmapMilestoneDisplay[];
  source: "cms" | "cms_empty" | "static_fallback" | "unavailable";
};

function asKind(v: string): TravelTrustAnnouncementKind {
  if (v === "trust" || v === "community" || v === "campaign") return v;
  return "product";
}

function asOpsStatus(v: string | null | undefined): TravelTrustRoadmapOpsStatus {
  if (v === "in_progress" || v === "completed") return v;
  return "planned";
}

function asCtaKind(v: string | null | undefined): TravelTrustAnnouncementCtaKind | undefined {
  if (v === "book_now" || v === "learn_more" || v === "vote_now" || v === "join_now") return v;
  return undefined;
}

function mapSection(row: CmsRoadmapSectionPublic): TravelTrustRoadmapSectionDisplay {
  return {
    anchorId: row.anchor_id,
    periodLabel: row.period_label,
    kickerZh: row.kicker_zh,
    kickerEn: row.kicker_en,
    titleZh: row.title_zh,
    titleEn: row.title_en,
    subtitleZh: row.subtitle_zh,
    subtitleEn: row.subtitle_en,
    disclaimerZh: row.disclaimer_zh,
    disclaimerEn: row.disclaimer_en,
  };
}

export function mapCmsRoadmapMilestone(row: CmsRoadmapMilestonePublic): TravelTrustRoadmapMilestoneDisplay {
  const safeHref = traveltrustSafeAnnouncementHref(row.cta_href);
  return {
    id: row.slug,
    sortOrder: row.sort_order,
    status: asOpsStatus(row.ops_status),
    contentTier: "roadmap",
    kind: asKind(row.kind),
    messageKey: row.message_key ?? `cms:roadmap:${row.slug}`,
    benefitKey: row.message_key ? `${row.message_key}_benefit` : `cms:roadmap:${row.slug}:benefit`,
    targetAt: row.target_at ?? undefined,
    href: safeHref,
    ctaKind: asCtaKind(row.cta_kind),
    cmsCopy: {
      titleZh: row.title_zh,
      titleEn: row.title_en,
      summaryZh: row.summary_zh,
      summaryEn: row.summary_en,
    },
  };
}

function staticFallbackBundle(): TravelTrustRoadmapBundle {
  return {
    section: null,
    milestones: listTraveltrustRoadmap2026Milestones(),
    source: "static_fallback",
  };
}

export async function fetchTraveltrustRoadmapBundle(limit = 20): Promise<TravelTrustRoadmapBundle> {
  try {
    const res = await fetch(apiUrl(`${routes.publicRoadmap}?limit=${limit}`), { cache: "no-store" });
    if (!res.ok) return staticFallbackBundle();
    const data = (await res.json()) as {
      section?: CmsRoadmapSectionPublic | null;
      items?: CmsRoadmapMilestonePublic[];
      source?: string;
    };
    const section = data.section ? mapSection(data.section) : null;
    const milestones = (data.items ?? []).map(mapCmsRoadmapMilestone);
    if (!section && milestones.length === 0) {
      return staticFallbackBundle();
    }
    return {
      section,
      milestones: milestones.length ? milestones : listTraveltrustRoadmap2026Milestones(),
      source: milestones.length || section ? "cms" : "static_fallback",
    };
  } catch {
    return staticFallbackBundle();
  }
}

export function resolveRoadmapSectionCopy(
  section: TravelTrustRoadmapSectionDisplay | null,
  localeIsZh: boolean,
  t: (key: string) => string,
): {
  anchorId: string;
  kicker: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  periodLabel: string;
} {
  if (section) {
    return {
      anchorId: section.anchorId || TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR,
      kicker: localeIsZh ? section.kickerZh : section.kickerEn,
      title: localeIsZh ? section.titleZh : section.titleEn,
      subtitle: localeIsZh ? section.subtitleZh : section.subtitleEn,
      disclaimer: localeIsZh ? section.disclaimerZh : section.disclaimerEn,
      periodLabel: section.periodLabel,
    };
  }
  return {
    anchorId: TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR,
    kicker: t("traveltrust_roadmap_kicker"),
    title: t("traveltrust_roadmap_title"),
    subtitle: t("traveltrust_roadmap_subtitle"),
    disclaimer: t("traveltrust_roadmap_disclaimer"),
    periodLabel: "2026",
  };
}

export function resolveRoadmapMilestoneTargetLabel(
  item: TravelTrustRoadmapMilestoneDisplay,
  periodLabel: string,
  t: (key: string) => string,
): string {
  if (item.targetAt) {
    return `${t("traveltrust_roadmap_target_prefix")} · ${item.targetAt}`;
  }
  if (periodLabel) {
    return `${periodLabel} ${t("traveltrust_roadmap_milestone_suffix")}`;
  }
  return t("traveltrust_roadmap_target_tbd");
}

export type { CmsRoadmapSectionAdmin, CmsRoadmapMilestoneAdmin, RoadmapOpsStatus };
