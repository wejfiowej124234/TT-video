/** Unified Campaign Center · SSOT-CAMPAIGN (F-OO-14～19) */

export const PUBLIC_OPS_CAMPAIGN_KINDS = [
  { id: "homepage", featureId: "F-OO-14", labelKey: "admin_public_operations_campaign_kind_homepage" },
  { id: "market", featureId: "F-OO-15", labelKey: "admin_public_operations_campaign_kind_market" },
  { id: "community", featureId: "F-OO-16", labelKey: "admin_public_operations_campaign_kind_community" },
  { id: "festival", featureId: "F-OO-17", labelKey: "admin_public_operations_campaign_kind_festival" },
  { id: "holiday", featureId: "F-OO-18", labelKey: "admin_public_operations_campaign_kind_holiday" },
  { id: "regional", featureId: "F-OO-19", labelKey: "admin_public_operations_campaign_kind_regional" },
] as const;

export type PublicOpsCampaignKindId = (typeof PUBLIC_OPS_CAMPAIGN_KINDS)[number]["id"];

export const PUBLIC_OPS_CAMPAIGN_ENTITY_ITEM_TYPES = [
  "guide",
  "order",
  "market_listing",
  "community_post",
] as const;

export type PublicOpsCampaignEntityItemType = (typeof PUBLIC_OPS_CAMPAIGN_ENTITY_ITEM_TYPES)[number];

export const PUBLIC_OPS_CAMPAIGN_DEFAULT_SURFACES: Record<PublicOpsCampaignKindId, string[]> = {
  homepage: ["home_hero"],
  market: ["market_feed"],
  community: ["community_feed"],
  festival: ["landing_promo"],
  holiday: ["landing_promo"],
  regional: ["home_hero", "market_feed"],
};
