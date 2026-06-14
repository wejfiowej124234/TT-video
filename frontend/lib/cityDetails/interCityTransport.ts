import type { TransportType } from "@/components/market/CustomItineraryModal/types";
import { CITY_TO_REGION } from "./constants";

/** 同城或空城市：不展示跨城交通 */
export function needsInterCityTransport(fromCity: string, toCity: string): boolean {
  const from = fromCity?.trim();
  const to = toCity?.trim();
  return Boolean(from && to && from !== to);
}

function pairKey(from: string, to: string): string {
  return `${from.trim()}::${to.trim()}`;
}

function regionForPair(fromCity: string, toCity: string): string | undefined {
  return CITY_TO_REGION[fromCity.trim()] ?? CITY_TO_REGION[toCity.trim()];
}

/** 日本新干线黄金圈：实务以铁路为主 */
const JAPAN_RAIL_ONLY = new Set([
  "东京::大阪",
  "大阪::东京",
  "东京::京都",
  "京都::东京",
  "大阪::京都",
  "京都::大阪",
  "东京::福冈",
  "福冈::东京",
]);

/** 本州 ↔ 北海道等：无新干线，仅航空 */
const JAPAN_FLIGHT_ONLY = new Set([
  "东京::札幌",
  "札幌::东京",
  "大阪::札幌",
  "札幌::大阪",
  "京都::札幌",
  "札幌::京都",
  "福冈::札幌",
  "札幌::福冈",
]);

/** 中国短途高铁圈 */
const CHINA_RAIL_ONLY = new Set(["上海::杭州", "杭州::上海"]);

/** 韩国 KTX 圈 / 首都圈 */
const KOREA_RAIL_ONLY = new Set([
  "首尔::釜山",
  "釜山::首尔",
  "首尔::仁川",
  "仁川::首尔",
]);

const KOREA_FLIGHT_ONLY = new Set([
  "首尔::济州",
  "济州::首尔",
  "釜山::济州",
  "济州::釜山",
  "仁川::济州",
  "济州::仁川",
]);

/** 泰国城际：慢火车不面向游客，以航班为主 */
const THAILAND_FLIGHT_ONLY = new Set([
  "曼谷::清迈",
  "清迈::曼谷",
  "曼谷::普吉",
  "普吉::曼谷",
  "清迈::普吉",
  "普吉::清迈",
]);

/** 阿联酋无高铁；城际以包车/巴士为主（UI 仍用 rail 枚举值承载） */
const UAE_GROUND_ONLY = new Set([
  "迪拜::阿布扎比",
  "阿布扎比::迪拜",
  "迪拜::沙迦",
  "沙迦::迪拜",
  "阿布扎比::沙迦",
  "沙迦::阿布扎比",
]);

/** 美国跨州长线：以航班为主 */
const US_FLIGHT_ONLY = new Set([
  "纽约::洛杉矶",
  "洛杉矶::纽约",
  "纽约::旧金山",
  "旧金山::纽约",
  "纽约::拉斯维加斯",
  "拉斯维加斯::纽约",
  "洛杉矶::拉斯维加斯",
  "拉斯维加斯::洛杉矶",
  "洛杉矶::旧金山",
  "旧金山::洛杉矶",
]);

/** 欧洲短途高铁 */
const EUROPE_RAIL_ONLY = new Set([
  "罗马::佛罗伦萨",
  "佛罗伦萨::罗马",
  "佛罗伦萨::米兰",
  "米兰::佛罗伦萨",
  "马德里::塞维利亚",
  "塞维利亚::马德里",
  "巴黎::里昂",
  "里昂::巴黎",
]);

/**
 * 按起止城市返回可用的跨城交通方式（真实性优先）。
 * 注：`rail` 在阿联酋表示城际包车/巴士；在美国部分线路表示长途铁路（Amtrak）。
 */
export function getInterCityTransportModes(fromCity: string, toCity: string): TransportType[] {
  if (!needsInterCityTransport(fromCity, toCity)) return [];

  const key = pairKey(fromCity, toCity);
  const region = regionForPair(fromCity, toCity);

  if (region === "日本") {
    if (JAPAN_FLIGHT_ONLY.has(key)) return ["flight"];
    if (JAPAN_RAIL_ONLY.has(key)) return ["rail"];
    return ["rail", "flight"];
  }

  if (region === "中国") {
    if (CHINA_RAIL_ONLY.has(key)) return ["rail"];
    return ["rail", "flight"];
  }

  if (region === "韩国") {
    if (KOREA_FLIGHT_ONLY.has(key)) return ["flight"];
    if (KOREA_RAIL_ONLY.has(key)) return ["rail"];
    return ["rail", "flight"];
  }

  if (region === "泰国") {
    if (THAILAND_FLIGHT_ONLY.has(key)) return ["flight"];
    return ["rail", "flight"];
  }

  if (region === "阿联酋") {
    if (UAE_GROUND_ONLY.has(key)) return ["rail"];
    return ["rail", "flight"];
  }

  if (region === "美国") {
    if (US_FLIGHT_ONLY.has(key)) return ["flight"];
    return ["rail", "flight"];
  }

  if (region === "澳大利亚") {
    if (key === "悉尼::墨尔本" || key === "墨尔本::悉尼") return ["rail", "flight"];
    return ["flight"];
  }

  if (region === "法国") {
    if (EUROPE_RAIL_ONLY.has(key)) return ["rail"];
    if (key === "巴黎::尼斯" || key === "尼斯::巴黎") return ["rail", "flight"];
    return ["rail", "flight"];
  }

  if (region === "意大利") {
    if (EUROPE_RAIL_ONLY.has(key)) return ["rail"];
    return ["rail", "flight"];
  }

  if (region === "西班牙") {
    if (EUROPE_RAIL_ONLY.has(key)) return ["rail"];
    if (key === "马德里::巴塞罗那" || key === "巴塞罗那::马德里") return ["rail", "flight"];
    return ["rail", "flight"];
  }

  if (region === "新加坡") return [];

  return ["rail", "flight"];
}

/** 当前选项不可用时回落到首选 */
export function normalizeInterCityTransport(
  fromCity: string,
  toCity: string,
  current?: TransportType
): TransportType | undefined {
  const modes = getInterCityTransportModes(fromCity, toCity);
  if (modes.length === 0) return undefined;
  if (current && modes.includes(current)) return current;
  return modes[0];
}

/** 跨城铁路选项文案：按国家/地区显示新干线、KTX、包车等 */
export function getInterCityRailLabelKey(fromCity: string, toCity: string): string {
  const region = regionForPair(fromCity, toCity);
  if (region === "日本") return "market_transportShinkansen";
  if (region === "韩国") return "market_transportRailKtx";
  if (region === "阿联酋") return "market_transportIntercityGround";
  if (region === "美国" || region === "澳大利亚") return "market_transportRailLongDistance";
  return "market_transportRail";
}

export function getInterCityTransportLabelKey(
  mode: TransportType,
  fromCity: string,
  toCity: string
): string {
  if (mode === "flight") return "market_transportFlight";
  return getInterCityRailLabelKey(fromCity, toCity);
}
