/** CMS product roadmap types — independent from announcements / Pulse */

export type RoadmapOpsStatus = "planned" | "in_progress" | "completed";

export type CmsRoadmapSectionPublic = {
  anchor_id: string;
  period_label: string;
  kicker_zh: string;
  kicker_en: string;
  title_zh: string;
  title_en: string;
  subtitle_zh: string;
  subtitle_en: string;
  disclaimer_zh: string;
  disclaimer_en: string;
  published_at: string | null;
  updated_at: string;
};

export type CmsRoadmapSectionAdmin = CmsRoadmapSectionPublic & {
  id: string;
  singleton_key: string;
  publish_status: string;
  version: number;
};

export type CmsRoadmapMilestonePublic = {
  id: string;
  slug: string;
  kind: string;
  content_tier: string;
  pinned: boolean;
  sort_order: number;
  title_zh: string;
  title_en: string;
  summary_zh: string;
  summary_en: string;
  body_zh: string | null;
  body_en: string | null;
  target_at: string | null;
  cta_kind: string | null;
  cta_href: string | null;
  network_scope: string;
  message_key: string | null;
  ops_status: RoadmapOpsStatus | null;
  published_at: string | null;
  updated_at: string;
};

export type CmsRoadmapMilestoneAdmin = CmsRoadmapMilestonePublic & {
  publish_status: string;
  version: number;
};

export const CMS_ROADMAP_OPS_STATUSES: readonly RoadmapOpsStatus[] = [
  "planned",
  "in_progress",
  "completed",
];

export const CMS_ROADMAP_KINDS = ["product", "trust", "community", "campaign"] as const;

export const TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR = "product-roadmap";

/** @deprecated use TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR */
export const TRAVELTRUST_ROADMAP_2026_ANCHOR = TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR;
