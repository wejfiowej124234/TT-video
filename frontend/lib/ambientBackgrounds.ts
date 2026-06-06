/**
 * 全屏氛围底图：Unsplash（hotlink）或 `public/` 静态资源。
 * 选图原则：对齐 design tokens — ref-cyan / ref-teal、ref-coral·ref-sun；
 * 上叠 `bg-experience-landing-vignette`（首页）或 自由市场底图 + 半透明 `bg-market-atmosphere` 保证玻璃 UI 可读。
 *
 * Unsplash 许可：https://unsplash.com/license ；本地底图见 `public/` 内文件名注释。
 */
const q = "auto=format&fit=max&w=3840&q=90";

/**
 * 体验层首页默认：云海雪山 · 金色暮光（大气景区意象；避免过曝沙滩天空）
 * Unsplash: Simon Berger — https://unsplash.com/photos/snow-covered-mountain-1506905925346
 */
export const AMBIENT_BG_HOME = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?${q}`;

/**
 * 自由市场 `/market`：纯 CSS `MarketAmbientBackdrop`（暖场三叠层 + **弱** podium/赛博渐变/vignette，**88 §1.1**；无全屏摄影）。
 * 以下 URL 仅作存档 / 其它页面实验参考。
 */
/** 编号 1：东京夜景 · 都市霓虹（路口光轨） */
export const AMBIENT_BG_MARKET_1 = `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?${q}`;
/** 编号 2：芝加哥夜景 · 摩天灯火 */
export const AMBIENT_BG_MARKET_2 = `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?${q}`;
/** 编号 3：巴黎黄昏 · 暖色天际 */
export const AMBIENT_BG_MARKET_3 = `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?${q}`;
/** 曾用本地过渡底：`public/market-backdrop-travel-guilin-sunset.png` */
export const AMBIENT_BG_MARKET_TRANSITION = "/market-backdrop-travel-guilin-sunset.png";
/** Unsplash：新加坡滨海湾夜景 */
export const AMBIENT_BG_MARKET_TRANSITION_MARINA = `https://images.unsplash.com/photo-1565967511849-76a60a516170?${q}`;

/** 占位：市场页不再读取；保留 string 以免旧 import 字面量比较报错 */
export const AMBIENT_BG_MARKET: string = "";
