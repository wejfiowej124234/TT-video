/** `GET …/provider|acquisition/listings`：`status:ok` 但缺少或非数组 `items` 时勿冒充空目录。 */
export const TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID =
  "TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID";

/** `POST …/listings` 成功体（与 `market_subsite/catalog_publish.rs` JSON 对齐） */
export type MarketListingPublishResult = {
  status?: string;
  listing_id?: string;
};

export type MarketSubsiteListingsResult = {
  items: unknown[];
  meta?: Record<string, unknown>;
  /** 保留字段：历史 **`status: degraded`** 目录已移除；成功体仅 **`ok` + postgres_catalog** */
  degradedReason?: string;
  /** `true` 仅当服务端仍返回 **`meta.source`** 含 **`placeholder`**（当前成功目录恒为 **`false`**） */
  isPlaceholderCatalog: boolean;
};

export type MarketListingDraftPostResult = {
  draft_id: string;
  saved_at: string;
};

export type MarketListingDraftGetResult = {
  draft_id: string;
  saved_at: string;
  payload: Record<string, unknown>;
  meta: { variant: string; source: string };
};
