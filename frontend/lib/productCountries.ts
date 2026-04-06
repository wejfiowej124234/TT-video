/**
 * 产品期允许国家（十国）— 与 `traveltrust_core::product_countries`、`GET /meta.product_countries` 同序锁死。
 * 变更须同步改 core、geoOptions、向导注册、文档 44/54。
 */
export const PRODUCT_COUNTRIES = [
  { iso: "CN", nameZh: "中国", guideRegisterLabelKey: "community_region_cn" as const },
  { iso: "JP", nameZh: "日本", guideRegisterLabelKey: "community_region_jp" as const },
  { iso: "KR", nameZh: "韩国", guideRegisterLabelKey: "guideRegister_region_KR" as const },
  { iso: "SG", nameZh: "新加坡", guideRegisterLabelKey: "guideRegister_region_SG" as const },
  { iso: "TH", nameZh: "泰国", guideRegisterLabelKey: "guideRegister_region_TH" as const },
  { iso: "AE", nameZh: "阿联酋", guideRegisterLabelKey: "guideRegister_region_AE" as const },
  { iso: "US", nameZh: "美国", guideRegisterLabelKey: "guideRegister_region_US" as const },
  { iso: "AU", nameZh: "澳大利亚", guideRegisterLabelKey: "guideRegister_region_AU" as const },
  { iso: "FR", nameZh: "法国", guideRegisterLabelKey: "guideRegister_region_FR" as const },
  { iso: "ES", nameZh: "西班牙", guideRegisterLabelKey: "guideRegister_region_ES" as const },
] as const;

export type ProductCountryIso = (typeof PRODUCT_COUNTRIES)[number]["iso"];

const ISO_SET = new Set<string>(PRODUCT_COUNTRIES.map((c) => c.iso));
const ZH_SET = new Set<string>(PRODUCT_COUNTRIES.map((c) => c.nameZh));

export function isAllowedProductIso3166(code: string): boolean {
  return ISO_SET.has(code.trim().toUpperCase());
}

/** 与 POST /itineraries/custom 的 `country`（中文国家名）校验一致 */
export function isAllowedProductZhCountryName(name: string): boolean {
  return ZH_SET.has(name.trim());
}
