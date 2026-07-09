/** CMS public announcement row — shared client/server shape (matches Rust PublicCmsAnnouncementRow). */
export type CmsPublicAnnouncementRow = {
  id: string;
  slug: string;
  lane: string;
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
  effective_at: string | null;
  release_at: string | null;
  target_at: string | null;
  cta_kind: string | null;
  cta_href: string | null;
  network_scope: string;
  message_key: string | null;
  published_at: string | null;
  updated_at: string;
};

export type CmsAnnouncementAdminRow = CmsPublicAnnouncementRow & {
  publish_status: string;
  version: number;
};

export const CMS_OPS_LANES = ["product", "governance", "protocol_status"] as const;
export type CmsOpsLane = (typeof CMS_OPS_LANES)[number];

export const CMS_CONTENT_TIERS = ["live", "upcoming", "roadmap"] as const;
export const CMS_KINDS = ["product", "trust", "community", "campaign"] as const;
