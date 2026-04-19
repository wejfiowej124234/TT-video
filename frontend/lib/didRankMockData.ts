/**
 * DID 排行榜：与 API 对齐的 TypeScript 类型；`page` 仅消费 `getDidRank*` 响应，不再注入本地示例排名。
 */

export interface TravelerRankItem {
  id: string;
  rank: number;
  nickname: string;
  /** 登录且与当前会话用户 id 一致时由 API 置 true */
  is_me?: boolean;
  avatar_url?: string | null;
  /** 窗口内已完成订单数（`GET …/did-rank/travelers`；chain_off / DB 同源） */
  completed_orders?: number;
  totalSpentUsdt: number;
  countriesCount: number;
  citiesCount: number;
  /** 战绩：去过的国家（前若干） */
  countries?: string[];
  /** 战绩：去过的城市（前若干） */
  cities?: string[];
}

export interface GuideRankItem {
  id: string;
  rank: number;
  nickname: string;
  /** 登录且与当前会话用户 id 一致时由 API 置 true */
  is_me?: boolean;
  avatar_url?: string | null;
  city?: string;
  totalAmountUsdt: number;
  receptionCount: number;
  /** `GET …/did-rank/guides`：窗口内已完成订单上、评价对象为向导用户的条数（04 附录 §2 / §3.1 Partial） */
  receivedReviewCount?: number;
  /** 上列评价的算术均分；无评价时 API 可能显式 `null` */
  avgReceivedReviewScore?: number | null;
}

/** 行程排行榜项：按使用次数、评价等多指标综合排名，前 10 奖励创作者治理币 */
export interface ItineraryRankItem {
  id: string;
  rank: number;
  title: string;
  /** 登录且为关联订单的旅行者时由 API 置 true */
  is_me?: boolean;
  creatorName: string;
  creatorType: "traveler" | "guide";
  useCount: number;
  rating: number;
  reviewCount: number;
  coverImage?: string | null;
  /** 目的地摘要，如 "北京·上海·西安" */
  destination?: string;
  /** 与 `community/user/[id]` 对齐的创作者用户 UUID；有值且通过 `isDidRankCommunityProfileId` 时行程卡展示档案链 */
  creatorCommunityUserId?: string | null;
}

const TRAVELER_NAMES = [
  "云游四海", "行者无疆", "背包客小林", "环游世界", "旅行达人", "足迹天涯", "漫游者", "探索者", "远方的风", "在路上",
  "看世界", "走遍天下", "旅人志", "环球客", "自由行", "山河故人", "远方", "旅途", "星辰大海", "一路向南",
  "北纬三十度", "东经一二零", "南半球的风", "西行记", "东方既白", "南国红豆", "西窗剪烛", "北国风光", "中州客", "江南雨",
  "塞北雪", "岭南人", "东海渔", "西域驼", "高原蓝", "海岛梦", "古镇游", "都市客", "山林隐", "草原马",
  "沙漠舟", "雨林蛙", "冰川行", "火山口", "峡谷深", "湖光山色", "江枫渔火", "雪山飞狐", "海滨假日", "田园牧歌",
  "古城墙", "现代城", "小镇情", "乡村路", "胡同里", "巷子深", "码头风", "机场夜", "车站情", "驿站客",
  "背包十年", "护照满页", "签证达人", "机票收藏家", "酒店控", "民宿爱好者", "青旅常客", "沙发客", "露营者", "房车族",
  "骑行天下", "徒步者", "登山客", "潜水员", "滑雪板", "帆船手", "热气球", "跳伞人", "滑翔翼", "自驾游",
  "火车迷", "飞机控", "轮船客", "巴士行", "地铁通", "单车族", "摩托党", "电驴子", "独轮车", "滑板少年",
];

const GUIDE_NAMES = [
  "京都小张", "东京李导", "大阪王姐", "奈良阿明", "北海道雪", "冲绳海风", "福冈小陈", "名古屋周", "札幌冬", "镰仓夏",
  "北京老刘", "上海陈导", "杭州西湖妹", "成都熊猫哥", "西安兵马姐", "厦门鼓浪屿", "青岛啤酒叔", "南京秦淮", "苏州园林", "丽江纳西",
  "大理风花", "桂林山水", "三亚椰林", "哈尔滨冰", "拉萨布达拉", "乌鲁木齐", "昆明春城", "重庆火锅", "武汉黄鹤", "长沙湘江",
  "沈阳故宫", "长春影城", "济南泉城", "郑州中原", "合肥包公", "福州榕城", "南昌滕王", "石家庄冀", "太原晋商", "南宁绿城",
  "贵阳山城", "兰州拉面", "西宁青海", "银川塞上", "海口椰风", "呼和浩特", "拉萨藏", "乌鲁木齐疆", "南宁桂", "昆明滇",
  "京都枫", "首尔金", "曼谷萨瓦", "新加坡林", "吉隆坡马", "巴厘岛岛", "悉尼澳", "巴黎法", "伦敦英", "罗马意",
  "纽约美", "洛杉矶星", "柏林德", "阿姆斯特丹荷", "马德里西", "莫斯科俄", "开罗埃", "迪拜阿", "伊斯坦布尔土", "孟买印",
];

const AVATAR_TRAVELER = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&q=80",
];

const AVATAR_GUIDE = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dabcad3?w=120&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80",
];

/** 与产品期 geoOptions 十国顺序一致，重复铺长以满足 slice 抽样 */
const COUNTRIES_POOL = [
  "中国",
  "日本",
  "韩国",
  "新加坡",
  "泰国",
  "阿联酋",
  "美国",
  "澳大利亚",
  "法国",
  "西班牙",
  "中国",
  "日本",
  "韩国",
  "新加坡",
  "泰国",
  "阿联酋",
  "美国",
  "澳大利亚",
  "法国",
  "西班牙",
];
const CITIES_POOL = ["东京", "大阪", "京都", "曼谷", "新加坡", "北京", "上海", "首尔", "巴黎", "伦敦", "纽约", "悉尼", "台北", "香港", "吉隆坡", "巴厘岛", "清迈", "普吉", "墨尔本", "洛杉矶", "罗马", "柏林", "阿姆斯特丹", "马德里", "里斯本", "维也纳", "布拉格", "伊斯坦布尔", "迪拜", "开罗"];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

/** 生成 100 名旅行者排名（按 totalSpentUsdt 降序） */
export function buildTravelerRank(): TravelerRankItem[] {
  const items: TravelerRankItem[] = [];
  let baseUsdt = 128000;
  for (let i = 0; i < 100; i++) {
    const usdt = Math.max(800, baseUsdt - i * 920 - Math.floor(Math.random() * 400));
    const countriesCount = Math.min(20, Math.floor(usdt / 5000) + 1 + (i % 5));
    const citiesCount = Math.min(50, countriesCount * 2 + (i % 8));
    const countries = COUNTRIES_POOL.slice(0, countriesCount);
    const cities = CITIES_POOL.slice(0, Math.min(citiesCount, CITIES_POOL.length));
    items.push({
      id: `traveler-${i + 1}`,
      rank: i + 1,
      nickname: pick(TRAVELER_NAMES, i),
      avatar_url: pick(AVATAR_TRAVELER, i),
      totalSpentUsdt: usdt,
      countriesCount,
      citiesCount,
      countries,
      cities,
    });
  }
  return items.sort((a, b) => b.totalSpentUsdt - a.totalSpentUsdt).map((t, idx) => ({ ...t, rank: idx + 1 }));
}

/** 生成 100 名向导排名（按 totalAmountUsdt 降序） */
export function buildGuideRank(): GuideRankItem[] {
  const items: GuideRankItem[] = [];
  let baseUsdt = 256000;
  for (let i = 0; i < 100; i++) {
    const usdt = Math.max(1200, baseUsdt - i * 2100 - Math.floor(Math.random() * 800));
    const receptionCount = Math.floor(usdt / 800) + (i % 15);
    items.push({
      id: `guide-${i + 1}`,
      rank: i + 1,
      nickname: pick(GUIDE_NAMES, i),
      avatar_url: pick(AVATAR_GUIDE, i),
      city: pick(["北京", "上海", "东京", "大阪", "曼谷", "新加坡", "首尔", "杭州", "成都", "京都", "奈良", "厦门", "西安", "青岛", "丽江"], i),
      totalAmountUsdt: usdt,
      receptionCount,
    });
  }
  return items.sort((a, b) => b.totalAmountUsdt - a.totalAmountUsdt).map((g, idx) => ({ ...g, rank: idx + 1 }));
}

const ITINERARY_TITLES = [
  "中国·北京上海杭州西安 7 日经典",
  "日本关西京都大阪奈良 5 日",
  "泰国曼谷清迈 6 日休闲",
  "新加坡+巴厘岛 8 日海岛",
  "欧洲法意瑞 12 日精华",
  "云南大理丽江香格里拉 9 日",
  "川西稻城亚丁 6 日",
  "新疆北疆环线 10 日",
  "东京箱根镰仓 5 日",
  "土耳其伊斯坦布尔卡帕 8 日",
];

/** 生成行程排行榜 mock（按使用次数+评分综合，前 10 展示） */
function buildItineraryRank(): ItineraryRankItem[] {
  const items: ItineraryRankItem[] = [];
  for (let i = 0; i < 10; i++) {
    const useCount = 3200 - i * 280 - Math.floor(Math.random() * 150);
    const rating = 4.9 - i * 0.03 - Math.random() * 0.05;
    const reviewCount = 180 - i * 12 + Math.floor(Math.random() * 20);
    const isGuide = i % 3 === 0;
    /** 与 `isDidRankCommunityProfileId` 一致的可链 UUID，排序后仍保留字段供 UI 抽检 */
    const creatorCommunityUserId =
      i === 0
        ? "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        : i === 2
          ? "a1b2c3d4-e5f6-4132-b789-0123456789ab"
          : undefined;
    items.push({
      id: `itinerary-${i + 1}`,
      rank: i + 1,
      title: pick(ITINERARY_TITLES, i),
      creatorName: isGuide ? pick(GUIDE_NAMES, i) : pick(TRAVELER_NAMES, i),
      creatorType: isGuide ? "guide" : "traveler",
      useCount: Math.max(100, useCount),
      rating: Math.max(4.0, Math.min(5, Math.round(rating * 10) / 10)),
      reviewCount: Math.max(10, reviewCount),
      coverImage: null,
      destination: pick(CITIES_POOL, i) + "·" + pick(CITIES_POOL, i + 5) + "·" + pick(CITIES_POOL, i + 10),
      creatorCommunityUserId,
    });
  }
  return items.sort((a, b) => {
    const scoreA = a.useCount * 0.4 + a.rating * 800 + a.reviewCount * 2;
    const scoreB = b.useCount * 0.4 + b.rating * 800 + b.reviewCount * 2;
    return scoreB - scoreA;
  }).map((it, idx) => ({ ...it, rank: idx + 1 }));
}

export const MOCK_TRAVELER_RANK = buildTravelerRank();
export const MOCK_GUIDE_RANK = buildGuideRank();
export const MOCK_ITINERARY_RANK = buildItineraryRank();
