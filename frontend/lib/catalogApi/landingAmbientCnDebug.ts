/**
 * CN ambient · 专用调试/探针（P0 wiring · 不扩 CMS 架构）
 */
import { AMBIENT_BG_HOME } from "@/lib/ambientBackgrounds";
import { COUNTRY_OPTIONS } from "@/lib/geoOptions";
import { LANDING_AMBIENT_BY_COUNTRY_ZH } from "@/lib/landingAmbientByCountry";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { countryNameZhToIso } from "./catalogGeoAdapter";

export const CN_AMBIENT_COUNTRY_ZH = "中国" as const;
export const CN_AMBIENT_COUNTRY_ISO = "CN" as const;

export type LandingAmbientCnRuntimeProbe = {
  selectedCountry: string;
  tsUrl: string;
  runtimeUrl: string;
  shownSrc: string;
  imgCurrentSrc: string;
};

export type LandingAmbientCnKeyAuditRow = {
  surface: string;
  key: string;
  value: string;
  matchesCatalogIso: boolean;
};

/** 静态 key 对拍：中国 / CN / catalog 消费链 */
export function auditLandingAmbientCnCountryKeys(): LandingAmbientCnKeyAuditRow[] {
  const product = PRODUCT_COUNTRIES.find((c) => c.iso === CN_AMBIENT_COUNTRY_ISO);
  const geo = COUNTRY_OPTIONS.find((c) => c.value === CN_AMBIENT_COUNTRY_ZH);
  const tsAmbientKey = CN_AMBIENT_COUNTRY_ZH in LANDING_AMBIENT_BY_COUNTRY_ZH;
  const isoFromZh = countryNameZhToIso(CN_AMBIENT_COUNTRY_ZH);

  return [
    {
      surface: "productCountries.nameZh",
      key: "CN",
      value: product?.nameZh ?? "(missing)",
      matchesCatalogIso: product?.nameZh === CN_AMBIENT_COUNTRY_ZH,
    },
    {
      surface: "geoOptions.COUNTRY_OPTIONS",
      key: "value",
      value: geo?.value ?? "(missing)",
      matchesCatalogIso: geo?.value === CN_AMBIENT_COUNTRY_ZH,
    },
    {
      surface: "geoOptions.COUNTRY_OPTIONS",
      key: "label",
      value: geo?.label ?? "(missing)",
      matchesCatalogIso: geo?.label === CN_AMBIENT_COUNTRY_ZH,
    },
    {
      surface: "countryNameZhToIso(中国)",
      key: "iso",
      value: isoFromZh ?? "(undefined)",
      matchesCatalogIso: isoFromZh === CN_AMBIENT_COUNTRY_ISO,
    },
    {
      surface: "landingAmbientByCountry",
      key: CN_AMBIENT_COUNTRY_ZH,
      value: tsAmbientKey ? "present" : "(missing)",
      matchesCatalogIso: tsAmbientKey,
    },
    {
      surface: "ambientBackgrounds.AMBIENT_BG_HOME",
      key: "empty-country-only",
      value: AMBIENT_BG_HOME.slice(0, 48),
      matchesCatalogIso: true,
    },
  ];
}

export function logLandingAmbientCnRuntimeProbe(probe: LandingAmbientCnRuntimeProbe): void {
  if (typeof window === "undefined") return;
  if (probe.selectedCountry.trim() !== CN_AMBIENT_COUNTRY_ZH) return;
  console.info("[TT_CN_AMBIENT_RUNTIME]", probe);
}

export function landingAmbientCnRuntimeDataAttrs(probe: LandingAmbientCnRuntimeProbe): Record<string, string> {
  if (probe.selectedCountry.trim() !== CN_AMBIENT_COUNTRY_ZH) return {};
  return {
    "data-tt-home-ambient-cn-probe": "1",
    "data-tt-home-ambient-selected-country": probe.selectedCountry,
    "data-tt-home-ambient-ts-url": probe.tsUrl,
    "data-tt-home-ambient-runtime-url": probe.runtimeUrl,
    "data-tt-home-ambient-shown-src": probe.shownSrc,
    "data-tt-home-ambient-img-current-src": probe.imgCurrentSrc,
  };
}
