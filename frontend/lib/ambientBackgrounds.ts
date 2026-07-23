/**
 * 全屏氛围底图：首页默认走 Catalog/COS Destination Ambient；市场页实验 URL 仍可能引用 Unsplash（非 `/` Hero）。
 * 选图原则：对齐 design tokens — ref-cyan / ref-teal、ref-coral·ref-sun；
 * 上叠 `bg-experience-landing-vignette`（首页）或 自由市场底图 + 半透明 `bg-market-atmosphere` 保证玻璃 UI 可读。
 *
 * 首页 Hero：**禁止** Unsplash 静默回退（W2 `no_unsplash_silent_fallback`）。
 */
const q = "auto=format&fit=max&w=3840&q=90";

/**
 * 体验层首页默认：品牌旅行氛围底（非十国地标 · HU-005）
 * 十国 Destination Ambient 仅在选中国家后切换。
 */
export const AMBIENT_BG_HOME = "/media/landing/brand-ambient-default.jpg";

/** Catalog/COS · 中国 Destination Ambient（选「中国」时 · 非空国家默认） */
export const AMBIENT_BG_CN_HOME =
  "https://traveltrust-community-media.fly.storage.tigris.dev/official-cold-start/v1/da-hero-cn-home-v1.runtime.webp";

/**
 * 自由市场 `/market`：纯 CSS `MarketAmbientBackdrop`（暖场三叠层 + **弱** podium/赛博渐变/vignette，**88 §1.1**；无全屏摄影）。
 * 以下 URL 仅作存档 / 其它页面实验参考。
 */
/** 编号 1–3：市场页实验存档已退役 · 指向站内占位（禁止 Unsplash） */
export const AMBIENT_BG_MARKET_1 = "/images/market-cover-placeholder.svg?v=m1";
/** 编号 2 */
export const AMBIENT_BG_MARKET_2 = "/images/market-cover-placeholder.svg?v=m2";
/** 编号 3 */
export const AMBIENT_BG_MARKET_3 = "/images/market-cover-placeholder.svg?v=m3";
/** 曾用本地过渡底：`public/market-backdrop-travel-guilin-sunset.png` */
export const AMBIENT_BG_MARKET_TRANSITION = "/market-backdrop-travel-guilin-sunset.png";
/** 滨海湾实验底：站内占位 */
export const AMBIENT_BG_MARKET_TRANSITION_MARINA = "/images/market-cover-placeholder.svg?v=marina";

/** 占位：市场页不再读取；保留 string 以免旧 import 字面量比较报错 */
export const AMBIENT_BG_MARKET: string = "";
