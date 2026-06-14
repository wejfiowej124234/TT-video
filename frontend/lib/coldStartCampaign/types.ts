/** E2E-A-01 · Cold Start Campaign consumer surfaces (O-S4 · 144/150 SSOT) */

export const COLD_START_SURFACE_HOME_HERO = "home_hero" as const;
export const COLD_START_SURFACE_MARKET_FEED = "market_feed" as const;
export const COLD_START_SURFACE_COMMUNITY_FEED = "community_feed" as const;

export type ColdStartSurfaceId =
  | typeof COLD_START_SURFACE_HOME_HERO
  | typeof COLD_START_SURFACE_MARKET_FEED
  | typeof COLD_START_SURFACE_COMMUNITY_FEED;

export type ColdStartResolvedOfficialAccount = {
  id: string;
  display_label: string;
  account_kind: string;
  linked_guide_id?: string | null;
};

export type ColdStartResolvedItineraryTemplate = {
  id: string;
  title: string;
  country_iso?: string | null;
  cover_image_url?: string | null;
  author_account_id?: string | null;
};

export type ColdStartResolvedGuidePost = {
  id: string;
  title: string;
  destination?: string | null;
  cover_url?: string | null;
  community_post_id?: string | null;
  tags?: string[];
};

export type ColdStartCampaignItem = {
  id: string;
  item_type: string;
  sort_order: number;
  payload: Record<string, unknown>;
  resolved:
    | ColdStartResolvedOfficialAccount
    | ColdStartResolvedItineraryTemplate
    | ColdStartResolvedGuidePost
    | Record<string, unknown>;
};

export type ColdStartCampaignPayload = {
  id: string;
  name: string;
  surfaces: string[];
  deployed_at: string;
  items: ColdStartCampaignItem[];
};

export type ColdStartSurfaceResponse = {
  status: "ok";
  surface: string;
  campaign: ColdStartCampaignPayload | null;
};
