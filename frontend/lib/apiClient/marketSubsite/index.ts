/**
 * 自由市场子站（94）：列表/详情 HTTP 契约与 `crates/api/src/routes/market_subsite/` 对齐。
 * 与 **`GET /discover/orders`** 不同：子站 **listing** 强依赖 **PG 目录**，**无 chain_off/无池** 时常 **503**，**不**返回 Discover 式空目录 **200**。
 * GET …/listings：有 chain_off + PG 池时 200 status ok + items（meta.source=postgres_catalog）；否则 503 chain_off_unavailable 或 database_required（parseResponse 抛错）。
 * GET …/listings/:id：有池且命中则 200；未命中 404；无 chain_off 或无池时 503（不再冒充 404）。
 * POST …/listings：须登录 + PG，写入 market_listings。
 * POST …/drafts：须登录（`writeRequestHeaders`）+ chain_off + `ensure_durable_writes_available` + PG 池，写入 **`market_listing_drafts.owner_user_id`**；请求 JSON 须含 **`payload`** 对象（本模块将入参 **`body`** 序列化为 **`{ payload: body }`**，与 `market_listing_draft_payload_from_body` 一致）。
 * GET …/drafts/:id：须登录（`getAuthHeaders`）；仅当草稿 **`owner_user_id`** 与当前会话一致时 **200**（否则 **404** **`listing_draft_not_found`**）。
 */

export {
  TRAVELTRUST_MARKET_SUBSITE_LISTINGS_CONTRACT_INVALID,
  type MarketListingPublishResult,
  type MarketSubsiteListingsResult,
  type MarketListingDraftPostResult,
  type MarketListingDraftGetResult,
} from "./types";
export {
  getMarketProviderListings,
  getMarketAcquisitionListings,
  getMarketProviderListing,
  getMarketAcquisitionListing,
  getMarketProviderListingDraft,
  getMarketAcquisitionListingDraft,
  postMarketProviderListingDraft,
  postMarketAcquisitionListingDraft,
  postMarketProviderListing,
  postMarketAcquisitionListing,
  postMarketProviderListingOrder,
  postMarketAcquisitionListingOrder,
} from "./http";
