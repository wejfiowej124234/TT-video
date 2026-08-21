/**
 * Official www announcement filter chips — controlled live overlay.
 *
 * Git pin `daa5ae87` committed 4 chips: 全部 / 产品 / 治理 / 协议.
 * Live image `2026-08-16T15:15:49Z` painted 5 chips including 活动.
 * Owner 2026-08-19: keep the fifth campaign chip on bake; do not drop it
 * by checking out the clean pin tree. Layout/list chrome stay pin.
 *
 * Pulse ticker copy remains CMS/API (not this overlay).
 */
export const OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS = [
  "all",
  "product",
  "campaign",
  "governance",
  "protocol_status",
] as const;

export type OfficialWwwAnnouncementFilterChip =
  (typeof OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS)[number];

export const OFFICIAL_WWW_ANNOUNCEMENT_CAMPAIGN_CHIP: OfficialWwwAnnouncementFilterChip =
  "campaign";
