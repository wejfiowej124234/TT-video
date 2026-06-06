import type { Locale } from "@/lib/i18n";
import type { ProductCountryIso } from "@/lib/productCountries";

export type L10n = { zh: string; en: string };

export type MerchantCategorySlug = "hotel" | "dining" | "attraction" | "experience";
export type AcquisitionCategorySlug = "luxury" | "sneakers" | "electronics" | "health" | "accessories";

export function pickL10n(s: L10n, locale: Locale): string {
  return s[locale];
}

export type DemoMerchantListing = {
  id: string;
  /** 与 `PRODUCT_COUNTRIES` 一致，供列表国家筛选 */
  countryIso: ProductCountryIso;
  categorySlug: MerchantCategorySlug;
  /** 越新越大，用于 `sort=recent` */
  sortKey: number;
  title: L10n;
  subtitle: L10n;
  city: L10n;
  category: L10n;
  shopName: L10n;
  imageSrc: string;
  priceUsdc: number;
  /** 详情富文本段落 */
  story: L10n[];
  highlights: L10n[];
};

export type DemoAcquisitionListing = {
  id: string;
  /** 交割/需求方主标国（十国），供国家筛选 */
  destinationCountryIso: ProductCountryIso;
  categorySlug: AcquisitionCategorySlug;
  sortKey: number;
  title: L10n;
  summary: L10n;
  route: L10n;
  bountyMinUsdc: number;
  bountyMaxUsdc: number;
  deadlineNote: L10n;
  imageSrc: string;
  inspectionStandard: L10n;
  authenticity: L10n;
  condition: L10n;
  rejections: L10n;
  handoff: L10n;
  story: L10n[];
};
