import type { OrderListItem } from "@/lib/apiClient";
import type { OrderDetailItem } from "@/components/market/OrderDetailDrawer";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

/** 本地静态资源，避免生产依赖第三方图床与隐私/可用性风险 */
export const ORDER_PLACEHOLDER_IMAGE = "/market-backdrop-travel-guilin-sunset.png";

/** Landing Hero（3840）缩为列表卡片宽，减轻 Unsplash 直连与 dev 优化器超时。 */
export function shrinkUnsplashHeroForListCover(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const u = new URL(url);
    if (u.searchParams.get("w") === "3840") {
      u.searchParams.set("w", "640");
      u.searchParams.set("h", "400");
      u.searchParams.set("q", "75");
    }
    return u.toString();
  } catch {
    return url.replace("w=3840&h=2160&q=92", "w=640&h=400&q=75");
  }
}

/** 订单列表封面：规范化路径 + 外链 Hero 缩图；无 cover 时用本地占位。 */
export function resolveOrderListCoverUrl(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return ORDER_PLACEHOLDER_IMAGE;
  return shrinkUnsplashHeroForListCover(communityMediaAbsoluteUrlForRender(trimmed));
}

export const ORDERS_PAGE_SIZE = 30;

export type BookGuideResolve =
  | "idle"
  | "checking"
  | "valid"
  | "invalid_not_found"
  | "invalid_load"
  /** `book_guide` 非 UUID：不发起无意义请求 */
  | "invalid_book_guide_id";

/** 列表项 → 市场行程抽屉（`GET /api/v1/orders` 与 `GET /api/v1/discover/orders` 同形字段；OrderDetailDrawer 有 embedded itinerary 则跳过 getOrder） */
export function orderListItemToDetailDrawer(item: OrderListItem): OrderDetailItem {
  return {
    id: String(item.id),
    amount: item.amount,
    currency: item.currency,
    state: item.state,
    status: item.status,
    sub_status: item.sub_status,
    display_status: item.display_status,
    projection_terminal: item.projection_terminal,
    destination: item.destination,
    country: item.country,
    city: item.city,
    days: item.days,
    image: item.image ?? null,
    escrow_address: item.escrow_address ?? null,
    breakdown: item.breakdown ?? null,
    itinerary: item.itinerary ?? null,
  };
}
