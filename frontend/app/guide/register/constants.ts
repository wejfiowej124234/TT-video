import { PRODUCT_COUNTRIES } from "@/lib/productCountries";

/**
 * 向导申请：ISO 3166-1 alpha-2；与 `lib/productCountries` 同序（CN→ES）。
 */
export const COUNTRY_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "", labelKey: "guideRegister_pleaseSelect" },
  ...PRODUCT_COUNTRIES.map((c) => ({
    value: c.iso,
    labelKey: c.guideRegisterLabelKey,
  })),
];

export const MAX_FILE_SIZE = 800 * 1024; // 800KB
export const ACCEPT_ID = "image/jpeg,image/png,image/webp,application/pdf";
export const ACCEPT_LANG = "image/jpeg,image/png,image/webp,application/pdf";
