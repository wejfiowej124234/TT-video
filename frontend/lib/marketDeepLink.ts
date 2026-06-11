/**
 * `/market` 深链 query 键：与 `useMarketPage` URL 同步一致；`guide_id` 仍保留给自定义行程预填（与抽屉详情 `guideId` 区分）。
 */
export const MARKET_ORDER_DETAIL_QUERY = "orderId";
export const MARKET_GUIDE_DETAIL_QUERY = "guideId";
/** Escrow 草稿：向导视图 + 绑定向导（`/market?view=guides&bindGuideToOrder=`） */
export const MARKET_BIND_GUIDE_ORDER_QUERY = "bindGuideToOrder";
/** 自定义行程创作台草稿深链（`/market?…`、 `/itinerary/new?…`） */
export const MARKET_ITINERARY_DRAFT_QUERY = "itinerary_draft_id";
/** 打开自由市场「创建行程」弹窗（`/market?create_itinerary=1`） */
export const MARKET_CREATE_ITINERARY_QUERY = "create_itinerary";
/** 无 pathname 时剥离草稿 query 后的回退路径 */
export const ITINERARY_NEW_FALLBACK_PATH = "/itinerary/new";

/** 订单列表/空态 → 市场自定义行程弹窗（itinerary-first 主链 SSOT） */
export function buildMarketCreateItineraryHref(): string {
  const q = new URLSearchParams();
  q.set(MARKET_CREATE_ITINERARY_QUERY, "1");
  return `/market?${q.toString()}`;
}

export function isMarketCreateItineraryDeepLink(raw: string | null | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** 从 URL 移除 `itinerary_draft_id`，保留其余 query（hydrate 完成后 `router.replace` 用）。 */
export function buildPathStrippingItineraryDraftQuery(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const path = pathname.trim() || ITINERARY_NEW_FALLBACK_PATH;
  const next = new URLSearchParams(searchParams);
  next.delete(MARKET_ITINERARY_DRAFT_QUERY);
  const q = next.toString();
  return q ? `${path}?${q}` : path;
}
