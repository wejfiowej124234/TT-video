/**
 * ① 本地联调：API 返回不足 10 条时注入稳定预览榜（领奖台 + 11～22 列表），便于验收 L5 版式。
 * 生产构建默认不注入（见 `didRankDevPreviewGate.ts`）。
 */

import type { GuideRankItem, TravelerRankItem } from "@/lib/didRankTypes";

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
] as const;

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
] as const;

const COUNTRIES = ["中国", "日本", "韩国", "新加坡", "泰国", "阿联酋", "美国", "澳大利亚", "法国", "西班牙"] as const;
const CITIES = ["东京", "大阪", "京都", "曼谷", "新加坡", "北京", "上海", "首尔", "巴黎", "伦敦", "纽约", "悉尼"] as const;

/** 行业常见：Top10 主榜 + 11～22 供「完整榜」区预览 */
const TRAVELER_PREVIEW_ROWS: ReadonlyArray<{
  nickname: string;
  completed_orders: number;
  totalSpentUsdt: number;
  countriesCount: number;
  citiesCount: number;
}> = [
  { nickname: "云游四海", completed_orders: 48, totalSpentUsdt: 128400, countriesCount: 12, citiesCount: 28 },
  { nickname: "行者无疆", completed_orders: 41, totalSpentUsdt: 112200, countriesCount: 11, citiesCount: 24 },
  { nickname: "背包客小林", completed_orders: 36, totalSpentUsdt: 98600, countriesCount: 10, citiesCount: 22 },
  { nickname: "环游世界", completed_orders: 31, totalSpentUsdt: 87400, countriesCount: 9, citiesCount: 19 },
  { nickname: "旅行达人", completed_orders: 28, totalSpentUsdt: 76200, countriesCount: 8, citiesCount: 17 },
  { nickname: "足迹天涯", completed_orders: 24, totalSpentUsdt: 65800, countriesCount: 8, citiesCount: 15 },
  { nickname: "漫游者", completed_orders: 21, totalSpentUsdt: 54100, countriesCount: 7, citiesCount: 14 },
  { nickname: "探索者", completed_orders: 18, totalSpentUsdt: 47200, countriesCount: 6, citiesCount: 12 },
  { nickname: "远方的风", completed_orders: 15, totalSpentUsdt: 39800, countriesCount: 6, citiesCount: 11 },
  { nickname: "在路上", completed_orders: 12, totalSpentUsdt: 32100, countriesCount: 5, citiesCount: 10 },
  { nickname: "看世界", completed_orders: 9, totalSpentUsdt: 28400, countriesCount: 5, citiesCount: 9 },
  { nickname: "走遍天下", completed_orders: 8, totalSpentUsdt: 24600, countriesCount: 4, citiesCount: 8 },
  { nickname: "旅人志", completed_orders: 7, totalSpentUsdt: 21800, countriesCount: 4, citiesCount: 8 },
  { nickname: "环球客", completed_orders: 6, totalSpentUsdt: 19200, countriesCount: 4, citiesCount: 7 },
  { nickname: "自由行", completed_orders: 5, totalSpentUsdt: 16800, countriesCount: 3, citiesCount: 7 },
  { nickname: "山河故人", completed_orders: 5, totalSpentUsdt: 15400, countriesCount: 3, citiesCount: 6 },
  { nickname: "远方", completed_orders: 4, totalSpentUsdt: 13200, countriesCount: 3, citiesCount: 6 },
  { nickname: "旅途", completed_orders: 4, totalSpentUsdt: 11800, countriesCount: 3, citiesCount: 5 },
  { nickname: "星辰大海", completed_orders: 3, totalSpentUsdt: 9800, countriesCount: 2, citiesCount: 5 },
  { nickname: "一路向南", completed_orders: 3, totalSpentUsdt: 8600, countriesCount: 2, citiesCount: 4 },
  { nickname: "测试游客", completed_orders: 2, totalSpentUsdt: 4200, countriesCount: 1, citiesCount: 2 },
  { nickname: "北纬三十度", completed_orders: 1, totalSpentUsdt: 2100, countriesCount: 1, citiesCount: 1 },
] as const;

const GUIDE_PREVIEW_ROWS: ReadonlyArray<{
  nickname: string;
  city: string;
  receptionCount: number;
  totalAmountUsdt: number;
  avgReceivedReviewScore: number;
  receivedReviewCount: number;
}> = [
  { nickname: "京都小张", city: "京都", receptionCount: 86, totalAmountUsdt: 256800, avgReceivedReviewScore: 4.9, receivedReviewCount: 72 },
  { nickname: "东京李导", city: "东京", receptionCount: 78, totalAmountUsdt: 238400, avgReceivedReviewScore: 4.85, receivedReviewCount: 65 },
  { nickname: "大阪王姐", city: "大阪", receptionCount: 71, totalAmountUsdt: 221600, avgReceivedReviewScore: 4.82, receivedReviewCount: 58 },
  { nickname: "北京老刘", city: "北京", receptionCount: 64, totalAmountUsdt: 198200, avgReceivedReviewScore: 4.78, receivedReviewCount: 51 },
  { nickname: "上海陈导", city: "上海", receptionCount: 58, totalAmountUsdt: 176400, avgReceivedReviewScore: 4.75, receivedReviewCount: 47 },
  { nickname: "杭州西湖妹", city: "杭州", receptionCount: 52, totalAmountUsdt: 154800, avgReceivedReviewScore: 4.72, receivedReviewCount: 42 },
  { nickname: "成都熊猫哥", city: "成都", receptionCount: 47, totalAmountUsdt: 138600, avgReceivedReviewScore: 4.7, receivedReviewCount: 38 },
  { nickname: "西安兵马姐", city: "西安", receptionCount: 41, totalAmountUsdt: 121200, avgReceivedReviewScore: 4.68, receivedReviewCount: 34 },
  { nickname: "厦门鼓浪屿", city: "厦门", receptionCount: 36, totalAmountUsdt: 108400, avgReceivedReviewScore: 4.65, receivedReviewCount: 29 },
  { nickname: "丽江纳西", city: "丽江", receptionCount: 31, totalAmountUsdt: 94200, avgReceivedReviewScore: 4.62, receivedReviewCount: 25 },
  { nickname: "大理风花", city: "大理", receptionCount: 27, totalAmountUsdt: 82600, avgReceivedReviewScore: 4.6, receivedReviewCount: 22 },
  { nickname: "桂林山水", city: "桂林", receptionCount: 24, totalAmountUsdt: 71800, avgReceivedReviewScore: 4.58, receivedReviewCount: 19 },
  { nickname: "三亚椰林", city: "三亚", receptionCount: 21, totalAmountUsdt: 62400, avgReceivedReviewScore: 4.55, receivedReviewCount: 17 },
  { nickname: "重庆火锅", city: "重庆", receptionCount: 18, totalAmountUsdt: 54200, avgReceivedReviewScore: 4.52, receivedReviewCount: 15 },
  { nickname: "武汉黄鹤", city: "武汉", receptionCount: 16, totalAmountUsdt: 46800, avgReceivedReviewScore: 4.5, receivedReviewCount: 13 },
  { nickname: "南京秦淮", city: "南京", receptionCount: 14, totalAmountUsdt: 39600, avgReceivedReviewScore: 4.48, receivedReviewCount: 11 },
  { nickname: "苏州园林", city: "苏州", receptionCount: 12, totalAmountUsdt: 33400, avgReceivedReviewScore: 4.45, receivedReviewCount: 10 },
  { nickname: "青岛啤酒叔", city: "青岛", receptionCount: 10, totalAmountUsdt: 28200, avgReceivedReviewScore: 4.42, receivedReviewCount: 8 },
  { nickname: "测试向导", city: "杭州", receptionCount: 6, totalAmountUsdt: 12400, avgReceivedReviewScore: 4.2, receivedReviewCount: 4 },
  { nickname: "札幌冬", city: "札幌", receptionCount: 4, totalAmountUsdt: 8600, avgReceivedReviewScore: 4.1, receivedReviewCount: 3 },
  { nickname: "镰仓夏", city: "镰仓", receptionCount: 2, totalAmountUsdt: 4200, avgReceivedReviewScore: 4.0, receivedReviewCount: 2 },
  { nickname: "冲绳海风", city: "冲绳", receptionCount: 1, totalAmountUsdt: 1800, avgReceivedReviewScore: 4.0, receivedReviewCount: 1 },
] as const;

function previewId(slot: number): string {
  return `00000000-0000-4000-8000-${String(slot).padStart(12, "0")}`;
}

function sliceCountries(n: number): string[] {
  return COUNTRIES.slice(0, Math.min(n, COUNTRIES.length));
}

function sliceCities(n: number): string[] {
  return CITIES.slice(0, Math.min(n, CITIES.length));
}

/** ① 预览：部分名次带 ↑↓，便于验收徽章动效 */
function devPreviewRankDelta(rank: number): number | undefined {
  if (rank === 2) return 1;
  if (rank === 5) return 2;
  if (rank === 8) return -1;
  if (rank === 12) return -2;
  if (rank === 18) return 1;
  return undefined;
}

export function buildDidRankDevPreviewTravelers(): TravelerRankItem[] {
  return TRAVELER_PREVIEW_ROWS.map((row, i) => ({
    id: previewId(i + 1),
    rank: i + 1,
    ...(devPreviewRankDelta(i + 1) !== undefined ? { rank_delta: devPreviewRankDelta(i + 1) } : {}),
    nickname: row.nickname,
    avatar_url: AVATAR_TRAVELER[i % AVATAR_TRAVELER.length],
    completed_orders: row.completed_orders,
    totalSpentUsdt: row.totalSpentUsdt,
    countriesCount: row.countriesCount,
    citiesCount: row.citiesCount,
    countries: sliceCountries(row.countriesCount),
    cities: sliceCities(row.citiesCount),
  }));
}

export function buildDidRankDevPreviewGuides(): GuideRankItem[] {
  return GUIDE_PREVIEW_ROWS.map((row, i) => ({
    id: previewId(101 + i),
    rank: i + 1,
    ...(devPreviewRankDelta(i + 1) !== undefined ? { rank_delta: devPreviewRankDelta(i + 1) } : {}),
    nickname: row.nickname,
    avatar_url: AVATAR_GUIDE[i % AVATAR_GUIDE.length],
    city: row.city,
    totalAmountUsdt: row.totalAmountUsdt,
    receptionCount: row.receptionCount,
    receivedReviewCount: row.receivedReviewCount,
    avgReceivedReviewScore: row.avgReceivedReviewScore,
  }));
}

/** API 不足 10 条时用完整预览榜替换（保留 API≥10 时的真数据） */
export function applyDidRankDevPreviewTravelers(apiList: TravelerRankItem[]): TravelerRankItem[] {
  if (apiList.length >= 10) return apiList;
  return buildDidRankDevPreviewTravelers();
}

export function applyDidRankDevPreviewGuides(apiList: GuideRankItem[]): GuideRankItem[] {
  if (apiList.length >= 10) return apiList;
  return buildDidRankDevPreviewGuides();
}
