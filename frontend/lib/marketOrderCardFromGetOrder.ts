import type { OrderCardItem, MarketOrderItinerary } from "@/lib/marketTypes";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { isAssignedGuideId, isOrderEligibleForDiscoverMarketState } from "@/lib/isAssignedGuideId";

/** 与 chain_off `derive_route_label_from_days` 对齐（discover 卡片展示） */
export function deriveRouteLabelFromDailyItinerary(days: UnifiedDayRow[] | undefined): string | undefined {
  if (!days?.length) return undefined;
  const cities: string[] = [];
  for (const d of days) {
    const c = d.city?.trim();
    if (!c) continue;
    if (cities.length === 0 || cities[cities.length - 1] !== c) cities.push(c);
  }
  if (!cities.length) return undefined;
  return cities.join("、");
}

type GetOrderShape = {
  order?: Record<string, unknown>;
  itinerary?: MarketOrderItinerary & {
    daily_itinerary?: UnifiedDayRow[];
    amount_breakdown?: MarketOrderItinerary["amount_breakdown"];
  };
};

/** `GET /api/v1/orders/:id` → 市场左栏卡片（Escrow 绑定向导深链时 discover 未命中则回填） */
export function orderGetResponseToMarketCard(data: unknown): OrderCardItem | null {
  if (!data || typeof data !== "object") return null;
  const root = data as GetOrderShape;
  const order = root.order;
  if (!order || typeof order !== "object") return null;
  const id = String(order.id ?? "").trim();
  if (!id) return null;

  const itinerary = root.itinerary;
  const daily = itinerary?.daily_itinerary;
  const routeLabel = deriveRouteLabelFromDailyItinerary(daily);
  const bundleCity =
    (daily?.[0]?.city?.trim() || routeLabel?.split("、")[0]?.trim() || undefined) as string | undefined;
  const dest =
    typeof order.destination === "string" && order.destination.trim()
      ? order.destination.trim()
      : bundleCity
        ? `中国 · ${bundleCity}`
        : undefined;

  const stateRaw = String(order.state ?? order.status ?? "draft").toLowerCase();
  const guideId = order.guide_id != null ? String(order.guide_id) : undefined;
  if (!isOrderEligibleForDiscoverMarketState(stateRaw) || isAssignedGuideId(guideId)) return null;
  const days =
    typeof order.days === "number"
      ? order.days
      : daily?.length
        ? daily.length
        : undefined;

  return {
    id,
    order_id: id,
    tourist_id: order.tourist_id != null ? String(order.tourist_id) : undefined,
    traveler_id: order.traveler_id != null ? String(order.traveler_id) : order.tourist_id != null ? String(order.tourist_id) : undefined,
    guide_id: guideId,
    amount: order.amount != null ? String(order.amount) : undefined,
    currency: order.currency != null ? String(order.currency) : undefined,
    status: stateRaw,
    state: stateRaw,
    sub_status: order.sub_status != null ? String(order.sub_status) : undefined,
    destination: dest,
    country: dest?.split("·")[0]?.trim() ?? dest,
    route_label: routeLabel,
    city: bundleCity,
    days,
    version: itinerary?.version,
    itinerary: itinerary ?? null,
    created_at: order.created_at != null ? String(order.created_at) : undefined,
  };
}
