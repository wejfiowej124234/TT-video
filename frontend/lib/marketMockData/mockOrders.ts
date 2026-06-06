/**
 * P29：模拟待撮合订单（国内热门目的地演示）
 */

import type { OrderCardItem } from "@/lib/marketTypes";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { ORDER_IMAGES } from "./helpers";

/** 模拟待撮合订单（真实感：国内热门目的地 + 天数 + 预算 + 行程照片；country 用于国家+城市筛选） */
export const MOCK_ORDERS: OrderCardItem[] = [
  {
    id: "mock-order-1",
    destination: "北京 · 故宫与长城",
    country: "中国",
    city: "北京",
    days: 3,
    version: 1,
    amount: "1280",
    currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    status: "draft",
    image: ORDER_IMAGES["mock-order-1"],
    breakdown: { hotel: 420, food: 260, tickets: 200, guideFee: 400 },
    itinerary: {
      version: 1,
      snapshot_hash: null,
      daily_itinerary: [
        { day_index: 1, city: "北京", description: "天安门广场 · 故宫 · 景山" },
        { day_index: 2, city: "北京", description: "八达岭长城" },
        { day_index: 3, city: "北京", description: "颐和园 · 送站" },
      ],
      amount_breakdown: { hotel: 420, catering: 260, tickets: 200, guide_fee: 400, total_budget: 1280 },
    },
  },
  { id: "mock-order-2", destination: "上海 · 外滩与豫园", country: "中国", city: "上海", days: 2, version: 1, amount: "880", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-2"] },
  { id: "mock-order-3", destination: "杭州 · 西湖与灵隐", country: "中国", city: "杭州", days: 4, version: 1, amount: "1680", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-3"] },
  { id: "mock-order-4", destination: "成都 · 熊猫基地与宽窄巷子", country: "中国", city: "成都", days: 5, version: 1, amount: "2200", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-4"] },
  { id: "mock-order-5", destination: "西安 · 兵马俑与城墙", country: "中国", city: "西安", days: 4, version: 1, amount: "1580", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-5"] },
  { id: "mock-order-6", destination: "厦门 · 鼓浪屿与南普陀", country: "中国", city: "厦门", days: 3, version: 1, amount: "980", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-6"] },
  { id: "mock-order-7", destination: "云南 · 大理与丽江", country: "中国", city: "大理", days: 6, version: 1, amount: "3200", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-7"] },
  { id: "mock-order-8", destination: "青岛 · 海滨与啤酒节", country: "中国", city: "青岛", days: 2, version: 1, amount: "720", currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, status: "draft", image: ORDER_IMAGES["mock-order-8"] },
];
