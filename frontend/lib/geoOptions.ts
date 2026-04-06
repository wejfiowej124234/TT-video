/** 国家/城市选项，与首页表单、自由市场筛选、`POST /api/v1/itineraries` 共用；城市清单与 `traveltrust_core::preset_cities` 锁死 */

import { PRODUCT_COUNTRIES } from "./productCountries";

/**
 * 国家选项（产品期）：由 `productCountries.ts` 派生，顺序 CN→ES（54-S10：前三位中国、日本、韩国）。
 */
export const COUNTRY_OPTIONS: { value: string; label: string }[] = PRODUCT_COUNTRIES.map((c) => ({
  value: c.nameZh,
  label: c.nameZh,
}));

export const CITIES_BY_COUNTRY: Record<string, { value: string; label: string }[]> = {
  中国: [
    { value: "北京", label: "北京" },
    { value: "上海", label: "上海" },
    { value: "杭州", label: "杭州" },
    { value: "西安", label: "西安" },
    { value: "成都", label: "成都" },
    { value: "广州", label: "广州" },
    { value: "厦门", label: "厦门" },
    { value: "大理", label: "大理" },
    { value: "青岛", label: "青岛" },
  ],
  日本: [
    { value: "东京", label: "东京" },
    { value: "大阪", label: "大阪" },
    { value: "京都", label: "京都" },
    { value: "札幌", label: "札幌" },
    { value: "福冈", label: "福冈" },
  ],
  韩国: [
    { value: "首尔", label: "首尔" },
    { value: "釜山", label: "釜山" },
    { value: "济州", label: "济州" },
    { value: "仁川", label: "仁川" },
  ],
  新加坡: [{ value: "新加坡", label: "新加坡" }],
  泰国: [
    { value: "曼谷", label: "曼谷" },
    { value: "清迈", label: "清迈" },
    { value: "普吉", label: "普吉" },
  ],
  阿联酋: [
    { value: "迪拜", label: "迪拜" },
    { value: "阿布扎比", label: "阿布扎比" },
    { value: "沙迦", label: "沙迦" },
  ],
  美国: [
    { value: "纽约", label: "纽约" },
    { value: "洛杉矶", label: "洛杉矶" },
    { value: "旧金山", label: "旧金山" },
    { value: "拉斯维加斯", label: "拉斯维加斯" },
  ],
  澳大利亚: [
    { value: "悉尼", label: "悉尼" },
    { value: "墨尔本", label: "墨尔本" },
    { value: "黄金海岸", label: "黄金海岸" },
  ],
  法国: [
    { value: "巴黎", label: "巴黎" },
    { value: "里昂", label: "里昂" },
    { value: "尼斯", label: "尼斯" },
  ],
  西班牙: [
    { value: "马德里", label: "马德里" },
    { value: "巴塞罗那", label: "巴塞罗那" },
    { value: "塞维利亚", label: "塞维利亚" },
  ],
};

/** 按 `CITIES_BY_COUNTRY` 反查国家中文名（产品期城市清单）；预填 `/itinerary/new` 等。无匹配返回 null。 */
export function productCountryZhForCityName(city: string): string | null {
  const t = city.trim();
  if (!t) return null;
  for (const country of Object.keys(CITIES_BY_COUNTRY)) {
    const list = CITIES_BY_COUNTRY[country];
    if (list?.some((c) => c.value === t)) return country;
  }
  return null;
}

/** 语言选项（自由市场筛选与首页一致用 pill） */
export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "中文", label: "中文" },
  { value: "英语", label: "英语" },
  { value: "日语", label: "日语" },
  { value: "闽南语", label: "闽南语" },
  { value: "法语", label: "法语" },
  { value: "西班牙语", label: "西班牙语" },
];

/** 按国家展示的语言选项（用于筛选向导：选中国→中文+英语，选日本→日语+英语等） */
export const LANGUAGES_BY_COUNTRY: Record<string, { value: string; label: string }[]> = {
  中国: [{ value: "中文", label: "中文" }, { value: "英语", label: "英语" }],
  日本: [{ value: "英语", label: "英语" }, { value: "日语", label: "日语" }],
  韩国: [{ value: "韩语", label: "韩语" }, { value: "英语", label: "英语" }],
  新加坡: [{ value: "中文", label: "中文" }, { value: "英语", label: "英语" }],
  泰国: [{ value: "泰语", label: "泰语" }, { value: "英语", label: "英语" }],
  阿联酋: [{ value: "阿拉伯语", label: "阿拉伯语" }, { value: "英语", label: "英语" }],
  美国: [{ value: "英语", label: "英语" }],
  澳大利亚: [{ value: "英语", label: "英语" }],
  法国: [{ value: "法语", label: "法语" }, { value: "英语", label: "英语" }],
  西班牙: [{ value: "西班牙语", label: "西班牙语" }, { value: "英语", label: "英语" }],
};

/** 服务类型选项（自由市场筛选向导用，多选：向导服务、陪玩服务、摄影服务、司机服务） */
export const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "向导服务", label: "向导服务" },
  { value: "陪玩服务", label: "陪玩服务" },
  { value: "摄影服务", label: "摄影服务" },
  { value: "司机服务", label: "司机服务" },
];
