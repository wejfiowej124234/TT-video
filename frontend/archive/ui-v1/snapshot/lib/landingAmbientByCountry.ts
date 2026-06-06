import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { AMBIENT_BG_HOME } from "@/lib/ambientBackgrounds";

/**
 * Web3 旅行体验层首页全屏底图：随「产品期国家」中文名切换。
 * 自由市场页使用 `MarketAmbientBackdrop`（与 TravelTrust 页同暖色场域类），不按国家切换。
 * 选图取向：青绿水体 / 金橙天色 / 深青剪影，便于叠 `bg-experience-landing-vignette` 与 ref 色 UI（征途 / Tropical jade）。
 * Unsplash License；`w=3840` 供高分屏，`auto=format` 由 CDN 择优编码。
 */
const U = (photoRest: string) =>
  `https://images.unsplash.com/photo-${photoRest}?auto=format&fit=max&w=3840&q=90`;

/**
 * 各国主视觉（photo- 后的 slug，不含前缀）
 * 注释为便于审计的意象，非严格地理唯一性保证。
 */
export const LANDING_AMBIENT_BY_COUNTRY_ZH: Record<string, string> = {
  /** 长城 · 山势与晨光（地标意象，高清 w=3840） */
  中国: U("1508804185872-d7badad00f7d"),
  /** 富士山 · 经典日本意象 */
  日本: U("1490806843957-31f4c9a91c65"),
  /** 首尔都市天际 · 青金暮色 */
  韩国: U("1517154421773-0529f29ea451"),
  /** 滨海都市天际 · 狮城水岸意象（slug 已 HEAD 200） */
  新加坡: U("1533050487297-09b450131914"),
  /** 热带海岸 · turquoise */
  泰国: U("1528181304800-259b08848526"),
  /** 现代沙漠都市夜景 · 迪拜/海湾天际意象 */
  阿联酋: U("1582672060674-bc2bd808a8b5"),
  /** 曼哈顿天际 · 美国都市地标意象 */
  美国: U("1514565131-fce0801e5785"),
  /** 海港歌剧院 · 青蓝水面 */
  澳大利亚: U("1506973035872-a4ec16b8e8d9"),
  /** 巴黎暮色 · 暖金灯光 */
  法国: U("1502602898657-3e91760cbb34"),
  /** 高迪园区 · 青绿马赛克与天色 */
  西班牙: U("1583422409516-2895a77efded"),
};

export function landingAmbientImageUrl(countryZh: string): string {
  const key = countryZh.trim();
  if (!key) return AMBIENT_BG_HOME;
  if (!isAllowedProductZhCountryName(key)) return AMBIENT_BG_HOME;
  return LANDING_AMBIENT_BY_COUNTRY_ZH[key] ?? AMBIENT_BG_HOME;
}
