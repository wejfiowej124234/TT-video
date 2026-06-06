import { isAllowedProductZhCountryName } from "@/lib/productCountries";

/**
 * Phase B · 每国自托管 loop 文件名（`public/media/landing/{slug}.mp4`）。
 * Phase A 不读取；仅文档与后续接线。
 */
export const LANDING_AMBIENT_COUNTRY_SLUG: Record<string, string> = {
  中国: "china",
  日本: "japan",
  韩国: "korea",
  新加坡: "singapore",
  泰国: "thailand",
  阿联酋: "uae",
  美国: "usa",
  澳大利亚: "australia",
  法国: "france",
  西班牙: "spain",
};

export function landingAmbientCountrySlug(countryZh: string): string | null {
  const key = countryZh.trim();
  if (!key || !isAllowedProductZhCountryName(key)) return null;
  return LANDING_AMBIENT_COUNTRY_SLUG[key] ?? null;
}

/**
 * Phase B：返回可播放的自托管 MP4 URL；Phase A 默认 `null`（仅 Ken Burns 静图）。
 * 启用：`NEXT_PUBLIC_LANDING_HOME_AMBIENT_USE_LOCAL_VIDEO=1` 或单条 `NEXT_PUBLIC_LANDING_HOME_AMBIENT_VIDEO`。
 */
export function landingAmbientVideoUrlForCountry(countryZh: string): string | null {
  const single = process.env.NEXT_PUBLIC_LANDING_HOME_AMBIENT_VIDEO?.trim();
  if (single) return single;
  if (process.env.NEXT_PUBLIC_LANDING_HOME_AMBIENT_USE_LOCAL_VIDEO !== "1") return null;
  const slug = landingAmbientCountrySlug(countryZh);
  return slug ? `/media/landing/${slug}.mp4` : null;
}
