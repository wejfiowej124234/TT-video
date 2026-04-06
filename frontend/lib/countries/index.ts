/**
 * 按国家独立定价模块：各国房价、用车、城际交通、住宿、向导价不同。
 * 与 geoOptions 的 COUNTRY_OPTIONS 国家名一致；未知国家回退到中国配置。
 * 企业级：BY_COUNTRY 与各国 config 深冻结，防止运行时篡改（44 §8.1/§9.2-4）。
 */
import type { CountryPricingConfig } from "./types";
import { pricingCN } from "./cn";
import { pricingJP } from "./jp";
import { pricingTH } from "./th";
import { pricingSG } from "./sg";
import { pricingFR } from "./fr";
import { pricingIT } from "./it";
import { pricingES } from "./es";
import { pricingUS } from "./us";
import { pricingUK } from "./uk";
import { pricingAU } from "./au";
import { pricingKR } from "./kr";
import { pricingAE } from "./ae";

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze((obj as Record<string, unknown>)[key]);
  }
  return obj;
}

/** 与 `lib/geoOptions` COUNTRY_OPTIONS 顺序、国家名一致（产品期十国；意大利/英国定价文件保留导出供扩展，不在此表） */
const BY_COUNTRY: Record<string, CountryPricingConfig> = {
  中国: pricingCN,
  日本: pricingJP,
  韩国: pricingKR,
  新加坡: pricingSG,
  泰国: pricingTH,
  阿联酋: pricingAE,
  美国: pricingUS,
  澳大利亚: pricingAU,
  法国: pricingFR,
  西班牙: pricingES,
};

// 企业级：只读，防止运行时篡改
for (const k of Object.keys(BY_COUNTRY)) {
  deepFreeze(BY_COUNTRY[k]);
}
Object.freeze(BY_COUNTRY);

/** 默认国家（与 BY_COUNTRY 键、geoOptions 一致）；供行程弹窗等 fallback 使用 */
export const DEFAULT_COUNTRY = "中国";

/** 按国家名取定价配置，未知国家返回中国配置 */
export function getPricingForCountry(country: string): CountryPricingConfig {
  const key = (country || "").trim();
  return BY_COUNTRY[key] ?? BY_COUNTRY[DEFAULT_COUNTRY];
}

/** 返回已配置定价的国家名列表，供单测与 geoOptions–countries 一致性校验使用 */
export function getPricingCountryKeys(): string[] {
  return Object.keys(BY_COUNTRY);
}

export type { CountryPricingConfig, CityTransportType, TransportType, GuideLevel } from "./types";
export {
  pricingCN,
  pricingJP,
  pricingKR,
  pricingTH,
  pricingSG,
  pricingAE,
  pricingFR,
  pricingIT,
  pricingES,
  pricingUS,
  pricingUK,
  pricingAU,
};
