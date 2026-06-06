/**
 * ① 本地联调可选示意卡：`NEXT_PUBLIC_MARKET_DEV_VARIETY=1` 时注入；默认仅真实 discover 数据。
 */

import type { OrderCardItem } from "@/lib/marketTypes";
import { MARKET_HERO_TRIP_DAY_PRESETS, normalizeOrderTripDays } from "@/lib/marketTripDaysFilter";

const DEV_VARIETY: OrderCardItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    destination: "中国 · 北京",
    country: "中国",
    city: "北京",
    days: 1,
    amount: "1000.00",
    currency: "USD",
    status: "draft",
    state: "draft",
    highlights: ["草稿订单 · 一日快闪示意"],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    destination: "中国 · 北京",
    country: "中国",
    city: "北京",
    days: 3,
    amount: "2800.00",
    currency: "USD",
    status: "draft",
    state: "draft",
    highlights: ["故宫 · 长城 · 胡同深度三日"],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    destination: "中国 · 北京",
    country: "中国",
    city: "北京",
    days: 5,
    amount: "4500.00",
    currency: "USD",
    status: "draft",
    state: "draft",
    highlights: ["五日文化线 · 博物馆与京郊"],
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    destination: "中国 · 北京",
    country: "中国",
    city: "北京",
    days: 7,
    amount: "6200.00",
    currency: "USD",
    status: "draft",
    state: "draft",
    highlights: ["七日环线 · 经典景点 + 京郊延伸"],
  },
];

const DEV_VARIETY_BY_DAYS: Partial<Record<number, OrderCardItem>> = Object.fromEntries(
  DEV_VARIETY.map((o) => [normalizeOrderTripDays(o.days) ?? 0, o] as const),
);

export type AppendMarketDevVarietyOptions = {
  tripDaysFilter?: number | null;
};

export function isMarketDevVarietyEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_MARKET_DEV_VARIETY === "1";
}

export function appendMarketDevVarietyOrders(
  orders: OrderCardItem[],
  options?: AppendMarketDevVarietyOptions,
): OrderCardItem[] {
  if (!isMarketDevVarietyEnabled()) return orders;

  const filter = options?.tripDaysFilter ?? null;

  if (filter != null) {
    if (!MARKET_HERO_TRIP_DAY_PRESETS.includes(filter as (typeof MARKET_HERO_TRIP_DAY_PRESETS)[number])) {
      return orders;
    }
    if (orders.some((o) => normalizeOrderTripDays(o.days) === filter)) return orders;
    const demo = DEV_VARIETY_BY_DAYS[filter];
    return demo ? [...orders, demo] : orders;
  }

  if (orders.some((o) => (normalizeOrderTripDays(o.days) ?? 0) >= 3)) return orders;

  const extras = DEV_VARIETY.filter((o) => {
    const d = normalizeOrderTripDays(o.days);
    return d === 3 || d === 5;
  });
  return [...orders, ...extras];
}

export function findMarketDevVarietyOrderById(id: string): OrderCardItem | null {
  if (!isMarketDevVarietyEnabled()) return null;
  return DEV_VARIETY.find((o) => o.id === id) ?? null;
}

export function isMarketDevVarietyOrderId(id: string): boolean {
  if (!isMarketDevVarietyEnabled()) return false;
  return DEV_VARIETY.some((o) => o.id === id);
}
