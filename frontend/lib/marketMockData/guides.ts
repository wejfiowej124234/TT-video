/**
 * P29：模拟向导库与 mock id 判定（`GuideDetailDrawer` 等）
 */

import type { GuideCardItem } from "@/lib/marketTypes";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import { guideCardAvatarUrl } from "./helpers";

/** 向导头像：与社区 `AVATARS` 同源（仅尺寸上调），避免孤立外链 403/404 */
export const GUIDE_AVATARS: Record<string, string> = Object.fromEntries(
  [
    "mock-guide-1",
    "mock-guide-2",
    "mock-guide-3",
    "mock-guide-4",
    "mock-guide-5",
    "mock-guide-6",
    "mock-guide-7",
    "mock-guide-8",
    "mock-guide-9",
    "mock-guide-10",
    "mock-guide-11",
    "mock-guide-12",
    "mock-guide-13",
    "mock-guide-14",
  ].map((key, i) => [key, guideCardAvatarUrl(i)])
);

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
  {
    id: "mock-guide-9",
    user_id: "u-guangzhou-1",
    city: "广州",
    country_code: "CN",
    languages: ["中文", "粤语", "英语"],
    service_types: ["向导服务", "美食向导"],
    bio: "老城骑楼与早茶动线：陈家祠、沙面、珠江夜游；可代订米其林粤菜与顺德一日美食专线。",
    stake_amount: "620",
    hourly_rate: "46",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-9"],
    status: "active",
    created_at: "2024-03-08T09:30:00Z",
  },
  {
    id: "mock-guide-10",
    user_id: "u-nanjing-1",
    city: "南京",
    country_code: "CN",
    languages: ["中文", "英语"],
    service_types: ["向导服务", "摄影服务"],
    bio: "民国建筑与秦淮河夜游；中山陵错峰、博物院特展讲解。适合亲子与银发慢游节奏。",
    stake_amount: "540",
    hourly_rate: "44",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-10"],
    status: "active",
    created_at: "2024-02-22T13:15:00Z",
  },
  {
    id: "mock-guide-11",
    user_id: "u-chongqing-1",
    city: "重庆",
    country_code: "CN",
    languages: ["中文", "英语"],
    service_types: ["向导服务", "陪玩服务", "司机服务"],
    bio: "8D 魔幻山城：长江索道、洪崖洞夜景、武隆天坑三日；火锅与小面地图可按辣度定制。",
    stake_amount: "580",
    hourly_rate: "43",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-11"],
    status: "active",
    created_at: "2024-01-30T11:00:00Z",
  },
  {
    id: "mock-guide-12",
    user_id: "u-suzhou-1",
    city: "苏州",
    country_code: "CN",
    languages: ["中文", "英语", "日本語"],
    service_types: ["向导服务", "摄影服务"],
    bio: "园林深度线：拙政园清晨场、平江路手摇船、苏博本馆与西馆；可衔接周庄/同里水乡当日往返。",
    stake_amount: "510",
    hourly_rate: "45",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-12"],
    status: "active",
    created_at: "2024-04-02T08:45:00Z",
  },
  {
    id: "mock-guide-13",
    user_id: "u-sanya-1",
    city: "三亚",
    country_code: "CN",
    languages: ["中文", "英语"],
    service_types: ["向导服务", "陪玩服务", "摄影服务"],
    bio: "亚龙湾潜水与后海冲浪体验、热带雨林公园、免税城动线规划；酒店与车队可一站式衔接。",
    stake_amount: "660",
    hourly_rate: "52",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-13"],
    status: "active",
    created_at: "2024-03-18T10:20:00Z",
  },
  {
    id: "mock-guide-14",
    user_id: "u-harbin-1",
    city: "哈尔滨",
    country_code: "CN",
    languages: ["中文", "英语"],
    service_types: ["向导服务", "摄影服务"],
    bio: "冰雪大世界与中央大街夜景、伏尔加庄园俄式风情；暖屋装备清单与防滑鞋建议随团发放。",
    stake_amount: "490",
    hourly_rate: "41",
    hourly_currency: DEFAULT_SETTLEMENT_CURRENCY_CODE,
    avatar_url: GUIDE_AVATARS["mock-guide-14"],
    status: "active",
    created_at: "2024-01-12T15:40:00Z",
  },
];

/** `GuideDetailDrawer`：演示向导不调 `getGuide`（含自由市场国际示例条） */
export function isMarketGuideMockShowcaseId(id: string): boolean {
  const s = String(id ?? "").trim();
  return /^mock-guide-\d+$/.test(s) || /^tt-showcase-guide-/.test(s);
}
