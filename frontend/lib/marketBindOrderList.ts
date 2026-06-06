import type { OrderCardItem } from "@/lib/marketTypes";
import type { OrderListItem } from "@/lib/apiClient";
import { applyMarketTripDaysFilterToOrders } from "@/lib/marketTripDaysFilter";
import { isAssignedGuideId, isOrderPublishedToDiscover } from "@/lib/isAssignedGuideId";
import { isDraftOrderListState } from "@/lib/isDraftOrderListState";
import { deriveRouteLabelFromDailyItinerary } from "@/lib/marketOrderCardFromGetOrder";

/** @deprecated 使用 `isAssignedGuideId` */
export function marketOrderHasAssignedGuide(item: Pick<OrderCardItem, "guide_id">): boolean {
  return isAssignedGuideId(item.guide_id);
}

/**
 * 自由市场左栏可展示：已发布（`created`）、未指派向导；与 `/orders` 列表一致，不含 Draft/open 市集草稿。
 */
export function isDiscoverMarketPublishedListing(
  item: Pick<OrderCardItem, "status" | "state" | "guide_id">,
): boolean {
  const statusRaw = (item.status ?? item.state ?? "").toLowerCase();
  return (
    isOrderPublishedToDiscover(statusRaw) &&
    !isDraftOrderListState(statusRaw) &&
    !marketOrderHasAssignedGuide(item)
  );
}

/** 旅客已发布、尚未选向导的本单（左栏「我的订单」；与 `/orders` 已发布态对拍） */
export function isOwnPublishedOpenListing(
  item: Pick<OrderCardItem, "id" | "traveler_id" | "tourist_id" | "status" | "state" | "guide_id">,
  ownUserId: string,
): boolean {
  const ownId = ownUserId.trim();
  if (!ownId) return false;
  const tid = item.traveler_id ?? item.tourist_id;
  if (!tid || String(tid) !== ownId) return false;
  return isDiscoverMarketPublishedListing(item);
}

/** `GET /orders` 列表项 → 市场左栏卡片（eligible discover 且未指派向导） */
export function orderListItemToMarketCard(item: OrderListItem): OrderCardItem | null {
  const id = String(item.id ?? "").trim();
  if (!id) return null;
  const stateRaw = (item.state ?? item.status ?? "").toLowerCase();
  if (!isDiscoverMarketPublishedListing({ status: stateRaw, state: stateRaw, guide_id: item.guide_id })) {
    return null;
  }
  const daily = item.itinerary?.daily_itinerary;
  const routeLabel = deriveRouteLabelFromDailyItinerary(daily);
  return {
    id,
    order_id: id,
    tourist_id: item.tourist_id,
    traveler_id: item.traveler_id ?? item.tourist_id,
    guide_id: item.guide_id,
    amount: item.amount,
    currency: item.currency,
    status: stateRaw,
    state: stateRaw,
    sub_status: item.sub_status,
    destination: item.destination,
    country: normalizeMarketOrderCountry(item),
    city: item.city,
    route_label: routeLabel,
    days: item.days,
    image: item.image ?? undefined,
    escrow_address: item.escrow_address ?? undefined,
    breakdown: item.breakdown ?? undefined,
    itinerary: item.itinerary ?? null,
    travel_date: item.travel_date ?? undefined,
    created_at: item.created_at,
  };
}

/** 订单卡片展示用国家（与筛选条 `COUNTRY_OPTIONS` 值对齐） */
export function normalizeMarketOrderCountry(
  item: Pick<OrderCardItem, "country" | "destination">,
): string {
  const raw = (item.country?.trim() || item.destination?.trim() || "");
  if (!raw) return "";
  return raw.split(/[·,，]/)[0]?.trim() ?? raw;
}
export function applyDiscoverGeoFiltersKeepingPin(
  orders: OrderCardItem[],
  filters: { country: string; city: string; tripDaysFilter: number | null },
  pinOrderId: string,
  alwaysShowOrderIds?: ReadonlySet<string>,
): OrderCardItem[] {
  const pin = pinOrderId.trim();
  let list = orders;
  if (filters.country) {
    const countryNeedle = filters.country.trim();
    list = list.filter(
      (o) =>
        String(o.id) === pin ||
        alwaysShowOrderIds?.has(String(o.id)) ||
        normalizeMarketOrderCountry(o) === countryNeedle,
    );
  }
  if (filters.city) {
    const cityNeedle = filters.city.trim();
    list = list.filter((o) => {
      const id = String(o.id);
      if (id === pin || alwaysShowOrderIds?.has(id)) return true;
      if ((o.city ?? "").trim() === cityNeedle) return true;
      const route = o.route_label ?? "";
      return route.includes(cityNeedle);
    });
  }
  return applyMarketTripDaysFilterToOrders(list, filters.tripDaysFilter, pin, alwaysShowOrderIds);
}

export function pinOrderInDiscoverList(
  filtered: OrderCardItem[],
  pool: OrderCardItem[],
  pinOrderId: string,
): OrderCardItem[] {
  const pin = pinOrderId.trim();
  if (!pin) return filtered;
  if (filtered.some((o) => String(o.id) === pin)) return filtered;
  const card = pool.find((o) => String(o.id) === pin);
  return card ? [card, ...filtered] : filtered;
}

export function bindingOrderVisibleInList(
  orders: OrderCardItem[],
  bindOrderId: string,
): boolean {
  const id = bindOrderId.trim();
  if (!id) return false;
  return orders.some((o) => String(o.id) === id);
}
