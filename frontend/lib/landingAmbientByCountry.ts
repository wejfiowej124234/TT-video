import { isAllowedProductZhCountryName } from "@/lib/productCountries";
import { AMBIENT_BG_HOME } from "@/lib/ambientBackgrounds";

/**
 * Web3 旅行体验层首页全屏底图：随「产品期国家」中文名切换（每国 1 张 HD 图）。
 * 渲染层（Phase A）：`LandingHomeAmbientBackdrop` + `.tt-home-ambient-ken-burns`（缩放+平移）。
 * Phase B 视频：`lib/landingHomeAmbientVideo.ts` + `public/media/landing/{slug}.mp4`（后补）。
 * 自由市场页使用 `MarketAmbientBackdrop`，不按国家切换。
 *
 * 选图：地标可识别、中低明度天空、便于叠 `bg-experience-landing-vignette`。
 * Unsplash License；`w=3840&h=2160&fit=crop&q=92` 供高分屏 Hero。
 */
const q = "auto=format&fit=crop&w=3840&h=2160&q=92";

const U = (photoRest: string) =>
  `https://images.unsplash.com/photo-${photoRest}?${q}`;

/**
 * 各国主视觉（`photo-` 后 slug）与地标说明 — 变更时须 HEAD 200 且目视与国家一致。
 * @see `landingAmbientByCountry.test.ts`
 */
export const LANDING_AMBIENT_BY_COUNTRY_ZH: Record<string, string> = {
  /** 中国 · 长城秋色（Unsplash 高下载；山脊蜿蜒、暖色 foliage）· 仅选中「中国」时 */
  中国: U("1547150492-da7ff1742941"),
  /** 日本 · 富士山 · 河口湖镜面倒影（Gaku Suyama · 渐变天色） */
  日本: U("1741935505561-d5a83195f08e"),
  /** 韩国 · 景福宫 · 秋意门楼（金红落叶框景） */
  韩国: U("1748835600895-8ff48c51c37f"),
  /** 新加坡 · 滨海湾金沙 · 蓝调（Blue Hour · 高对比；勿用灰雾日间仰拍） */
  新加坡: U("1562505415-018c3726c372"),
  /** 泰国 · 玛雅湾 · 皮皮岛（无人机俯拍 · 碧蓝泻湖） */
  泰国: U("1534008897995-27a23e859048"),
  /** 阿联酋 · 哈利法塔 · 蓝调夜景（高对比；勿用灰雾日间片） */
  阿联酋: U("1512453979798-5ea266f8880c"),
  /** 美国 · 纽约曼哈顿天际 */
  美国: U("1514565131-fce0801e5785"),
  /** 澳大利亚 · 悉尼歌剧院 · 晴日港湾（广角 · 蓝天高对比；勿用灰雾片） */
  澳大利亚: U("1748243262890-bffad63a7807"),
  /** 法国 · 巴黎埃菲尔铁塔暮色 */
  法国: U("1502602898657-3e91760cbb34"),
  /** 西班牙 · 巴塞罗那奎尔公园马赛克与天际 */
  西班牙: U("1583422409516-2895a77efded"),
};

/** 审计用：国家 → 地标短标签（与上表同步） */
export const LANDING_AMBIENT_LANDMARK_ZH: Record<keyof typeof LANDING_AMBIENT_BY_COUNTRY_ZH, string> = {
  中国: "长城·秋色",
  日本: "富士山·河口湖",
  韩国: "景福宫·秋意",
  新加坡: "滨海湾金沙·蓝调",
  泰国: "玛雅湾·皮皮岛",
  阿联酋: "哈利法塔·蓝调",
  美国: "纽约曼哈顿",
  澳大利亚: "悉尼歌剧院·晴日",
  法国: "埃菲尔铁塔",
  西班牙: "奎尔公园",
};

export function landingAmbientImageUrl(countryZh: string): string {
  const key = countryZh.trim();
  if (!key) return AMBIENT_BG_HOME;
  if (!isAllowedProductZhCountryName(key)) return AMBIENT_BG_HOME;
  return LANDING_AMBIENT_BY_COUNTRY_ZH[key] ?? AMBIENT_BG_HOME;
}
