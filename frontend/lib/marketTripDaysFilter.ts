import type { OrderCardItem } from "@/lib/marketTypes";



/** 英雄区「快捷天数」与 URL `?days=` 同源（仅筛选订单列表，不打开创作台） */

export const MARKET_HERO_TRIP_DAY_PRESETS = [1, 3, 5, 7] as const;



export type MarketHeroTripDayPreset = (typeof MARKET_HERO_TRIP_DAY_PRESETS)[number];



export function parseMarketTripDaysParam(raw: string | null | undefined): number | null {

  const s = (raw ?? "").trim();

  if (!s) return null;

  const n = Number.parseInt(s, 10);

  if (!Number.isFinite(n) || n < 1 || n > 30) return null;

  return n;

}



/** API / 示意卡 `days` 统一为整数，避免 `"3"` 与 `3` 筛选漏网 */

export function normalizeOrderTripDays(raw: unknown): number | null {

  if (raw == null || raw === "") return null;

  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);

  if (!Number.isFinite(n) || n < 1 || n > 30) return null;

  return n;

}



export function orderMatchesTripDaysFilter(orderDays: unknown, filterDays: number | null): boolean {

  if (filterDays == null) return true;

  return normalizeOrderTripDays(orderDays) === filterDays;

}



/** 列表终态：严格按天数过滤（用于 append 示意卡之后二次收口） */

export function applyMarketTripDaysFilterToOrders(
  orders: OrderCardItem[],
  filterDays: number | null,
  /** Escrow `bindGuideToOrder`：天数筛选不得隐藏旅客本单 */
  pinOrderId?: string | null,
  /** 旅客「我的订单」已发布待选向导：天数筛选不得隐藏（与 geo 筛选同源） */
  alwaysShowOrderIds?: ReadonlySet<string>,
): OrderCardItem[] {
  if (filterDays == null) return orders;
  const pin = pinOrderId?.trim() ?? "";
  return orders.filter((o) => {
    const id = String(o.id);
    if (pin && id === pin) return true;
    if (alwaysShowOrderIds?.has(id)) return true;
    return orderMatchesTripDaysFilter(o.days, filterDays);
  });
}


