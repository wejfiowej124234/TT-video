import type { OrderCardItem } from "@/components/market/OrderCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import { findMarketDevVarietyOrderById } from "@/lib/marketDevVarietyOrders";
import { isMarketMockDetailFallbackEnabled } from "@/lib/marketMockDetailFallback";
import { MARKET_GUIDE_SHOWCASE, MARKET_TRAVEL_SHOWCASE_ORDERS, MOCK_GUIDES } from "@/lib/marketMockData";

export type MarketSortBy = "latest" | "priceDesc" | "priceAsc";

export interface MarketContentProps {
  view: "split" | "orders" | "guides";
  /** P29 `ViewSwitcher`：点击时同步写 URL `view=`（与 `replaceMarketViewQueryParam` 同源）。 */
  setP29View: (v: "split" | "orders" | "guides") => void;
  sortBy: MarketSortBy;
  setSortBy: (v: MarketSortBy) => void;
  loadingOrders: boolean;
  loadingGuides: boolean;
  /** 非 null 表示对应列表拉取失败（已为本地化全文） */
  apiErrorOrders: string | null;
  apiErrorGuides: string | null;
  apiErrorDismissed: boolean;
  setApiErrorDismissed: (v: boolean) => void;
  loadOrders: () => void;
  loadMoreOrders: () => void;
  ordersHasMore: boolean;
  loadingMoreOrders: boolean;
  loadGuides: () => void;
  loadMoreGuides: () => void;
  guidesHasMore: boolean;
  loadingMoreGuides: boolean;
  filteredOrders: OrderCardItem[];
  guides: GuideCardItem[];
  orders: OrderCardItem[];
  hasFilters: boolean;
  showOrders: boolean;
  showGuides: boolean;
  favoritedOrderIds: Set<string>;
  favoritedGuideIds: Set<string>;
  toggleOrderFavorite: (id: string) => void;
  toggleGuideFavorite: (id: string) => void;
  setDetailOrder: (o: OrderCardItem | null) => void;
  setDetailGuide: (g: GuideCardItem | null) => void;
  setBookGuideId: (id: string | null) => void;
  setBookGuideName: (name: string | null) => void;
  resetFilters: () => void;
}

export function resolveMarketOrderForDetail(orders: OrderCardItem[], id: string): OrderCardItem | null {
  const fromList = orders.find((x) => x.id === id);
  if (fromList) return fromList;
  if (!isMarketMockDetailFallbackEnabled()) {
    return findMarketDevVarietyOrderById(id);
  }
  return (
    MARKET_TRAVEL_SHOWCASE_ORDERS?.find((x) => x.id === id) ??
    findMarketDevVarietyOrderById(id) ??
    null
  );
}

export function resolveMarketGuideForDetail(guides: GuideCardItem[], id: string): GuideCardItem | null {
  const fromList = guides.find((x) => x.id === id);
  if (fromList) return fromList;
  if (!isMarketMockDetailFallbackEnabled()) return null;
  return MOCK_GUIDES.find((x) => x.id === id) ?? MARKET_GUIDE_SHOWCASE.find((x) => x.id === id) ?? null;
}
