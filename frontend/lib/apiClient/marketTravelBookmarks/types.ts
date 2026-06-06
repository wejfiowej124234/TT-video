/** `GET …/me/market-bookmarks`：`order_ids` / `guide_ids` 若出现则须为 string[]（勿将 null/对象静默当空）。 */
export const TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID =
  "TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID";

export type MarketTravelBookmarksPayload = {
  status: string;
  order_ids?: string[];
  guide_ids?: string[];
  reason?: string;
};
