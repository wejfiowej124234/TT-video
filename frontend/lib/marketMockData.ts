/**
 * P29 自由市场：模拟订单与向导数据，用于无后端/空数据时展示真实效果
 */

import type { OrderCardItem, GuideCardItem } from "@/lib/marketTypes";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";

/** 行程封面图（Unsplash，与目的地匹配） */
const ORDER_IMAGES: Record<string, string> = {
  "mock-order-1": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80",
  "mock-order-2": "https://images.unsplash.com/photo-1547970814-9c2b36b2a8e2?w=600&q=80",
  "mock-order-3": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "mock-order-4": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80",
  "mock-order-5": "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=600&q=80",
  "mock-order-6": "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80",
  "mock-order-7": "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&q=80",
  "mock-order-8": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&q=80",
};

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

/** 向导头像（Unsplash 人物，仅演示用） */
const GUIDE_AVATARS: Record<string, string> = {
  "mock-guide-1": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
  "mock-guide-2": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  "mock-guide-3": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  "mock-guide-4": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "mock-guide-5": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  "mock-guide-6": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "mock-guide-7": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80",
  "mock-guide-8": "https://images.unsplash.com/photo-1599566150163-29194dabcad3?w=400&q=80",
};

/** 模拟向导库（服务类型为：向导服务、陪玩服务、摄影服务、司机服务，用于多选筛选） */
export const MOCK_GUIDES: GuideCardItem[] = [
  { id: "mock-guide-1", user_id: "u-beijing-1", city: "北京", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务", "摄影服务"], bio: "5 年北京地接经验，专注故宫、长城与胡同文化。持有向导证，可中英双语讲解。", stake_amount: "500", hourly_rate: "45", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-1"], status: "active", created_at: "2024-01-15T08:00:00Z" },
  { id: "mock-guide-2", user_id: "u-shanghai-1", city: "上海", country_code: "CN", languages: ["中文", "英语", "日语"], service_types: ["向导服务", "陪玩服务"], bio: "上海本地人，熟悉外滩、豫园与法租界。擅长美食与城市故事讲解。", stake_amount: "800", hourly_rate: "55", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-2"], status: "active", created_at: "2024-02-01T10:00:00Z" },
  { id: "mock-guide-3", user_id: "u-hangzhou-1", city: "杭州", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务", "摄影服务"], bio: "西湖与龙井茶区常驻向导，可安排茶园体验与灵隐寺讲解。", stake_amount: "600", hourly_rate: "42", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-3"], status: "active", created_at: "2024-01-20T12:00:00Z" },
  { id: "mock-guide-4", user_id: "u-chengdu-1", city: "成都", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务", "陪玩服务"], bio: "川味与熊猫基地专家，可带您吃遍正宗火锅与小吃，并安排熊猫基地深度游。", stake_amount: "550", hourly_rate: "48", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-4"], status: "active", created_at: "2024-02-10T09:00:00Z" },
  { id: "mock-guide-5", user_id: "u-xian-1", city: "西安", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务"], bio: "历史专业背景，专注兵马俑、大雁塔与城墙讲解，中英双语。", stake_amount: "700", hourly_rate: "50", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-5"], status: "active", created_at: "2024-01-08T14:00:00Z" },
  { id: "mock-guide-6", user_id: "u-xiamen-1", city: "厦门", country_code: "CN", languages: ["中文", "闽南语", "英语"], service_types: ["向导服务", "摄影服务"], bio: "鼓浪屿与南普陀常驻，熟悉闽南文化与海滨路线，适合家庭与情侣。", stake_amount: "450", hourly_rate: "38", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-6"], status: "active", created_at: "2024-02-20T11:00:00Z" },
  { id: "mock-guide-7", user_id: "u-dali-1", city: "大理", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务", "司机服务"], bio: "大理与丽江线路资深向导，洱海、古城、雪山路线均可安排。", stake_amount: "900", hourly_rate: "52", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-7"], status: "active", created_at: "2024-01-25T08:30:00Z" },
  { id: "mock-guide-8", user_id: "u-qingdao-1", city: "青岛", country_code: "CN", languages: ["中文", "英语"], service_types: ["向导服务", "陪玩服务", "摄影服务"], bio: "青岛本地向导，熟悉栈桥、八大关与啤酒文化，可安排海鲜与啤酒节行程。", stake_amount: "400", hourly_rate: "40", hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE, avatar_url: GUIDE_AVATARS["mock-guide-8"], status: "active", created_at: "2024-02-05T16:00:00Z" },
];

/** 分文件实现 · 与 `lib/marketMockData/index.ts` 同源（避免仅解析到本文件时缺导出） */
export { MARKET_TRAVEL_SHOWCASE_ORDERS } from "./marketMockData/showcaseOrders";
export { MARKET_GUIDE_SHOWCASE } from "./marketMockData/showcaseGuides";
export { isMarketGuideMockShowcaseId } from "./marketMockData/guides";
