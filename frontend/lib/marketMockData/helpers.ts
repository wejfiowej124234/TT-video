/**
 * P29 自由市场 mock：行程/订单构造与封面图映射（供 `mockOrders` / `showcaseOrders` 复用）
 */

import type { OrderCardItem, OrderBreakdown, TransportLeg } from "@/lib/marketTypes";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { AVATARS, TRAVEL_IMAGES_POOL, pick } from "@/lib/communityMockData/constants";

/** 向导卡片封面：与社区常量池同源，提高可用性；w640 便于 object-cover 裁切。 */
export function guideCardAvatarUrl(avatarIndex: number): string {
  const u = AVATARS[avatarIndex % AVATARS.length];
  return u.replace("w=120", "w=640").replace("q=80", "q=82");
}

type ShowcaseDayLine = string | { city: string; description: string };

export function showcaseDailyFrom(defaultCity: string, lines: ShowcaseDayLine[]): UnifiedDayRow[] {
  return lines.map((row, idx) => {
    if (typeof row === "string") {
      return { day_index: idx + 1, city: defaultCity, description: row };
    }
    return { day_index: idx + 1, city: row.city, description: row.description };
  });
}

export function showcaseOrder(args: {
  id: string;
  destination: string;
  country: string;
  city: string;
  days: number;
  amount: string;
  image: string;
  lines: ShowcaseDayLine[];
  breakdown: OrderBreakdown;
  highlights?: string[];
  transportLegs?: TransportLeg[];
}): OrderCardItem {
  const { hotel = 0, food = 0, tickets = 0, guideFee = 0, carFee = 0, misc = 0 } = args.breakdown;
  const total = hotel + food + tickets + guideFee + carFee + misc;
  const amountBreakdown = {
    hotel: hotel || undefined,
    catering: food || undefined,
    tickets: tickets || undefined,
    guide_fee: guideFee || undefined,
    vehicle: carFee || undefined,
    platform_fee: misc || undefined,
    total_budget: total,
  };
  return {
    id: args.id,
    destination: args.destination,
    country: args.country,
    city: args.city,
    days: args.days,
    version: 1,
    headcount: 2,
    amount: args.amount,
    currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    status: "draft",
    image: args.image,
    breakdown: args.breakdown,
    highlights: args.highlights ?? null,
    transportLegs: args.transportLegs,
    itinerary: {
      version: 1,
      snapshot_hash: null,
      daily_itinerary: showcaseDailyFrom(args.city, args.lines),
      amount_breakdown: amountBreakdown,
    },
  };
}

/** 行程封面：与 `TRAVEL_IMAGES_POOL` 同源轮询，降低单图失效导致灰块 */
export const ORDER_IMAGES: Record<string, string> = {
  "mock-order-1": pick(TRAVEL_IMAGES_POOL, 0),
  "mock-order-2": pick(TRAVEL_IMAGES_POOL, 1),
  "mock-order-3": pick(TRAVEL_IMAGES_POOL, 2),
  "mock-order-4": pick(TRAVEL_IMAGES_POOL, 3),
  "mock-order-5": pick(TRAVEL_IMAGES_POOL, 4),
  "mock-order-6": pick(TRAVEL_IMAGES_POOL, 5),
  "mock-order-7": pick(TRAVEL_IMAGES_POOL, 6),
  "mock-order-8": pick(TRAVEL_IMAGES_POOL, 7),
  "mock-showcase-it": pick(TRAVEL_IMAGES_POOL, 8),
  "mock-showcase-is": pick(TRAVEL_IMAGES_POOL, 0),
  "mock-showcase-th": pick(TRAVEL_IMAGES_POOL, 2),
  "mock-showcase-fr": pick(TRAVEL_IMAGES_POOL, 4),
  /** 新西兰南岛湖光：与社区 Feed 演示池一致 */
  "mock-showcase-nz": pick(TRAVEL_IMAGES_POOL, 5),
};
