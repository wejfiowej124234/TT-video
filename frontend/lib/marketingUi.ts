/**
 * V2 · 全站 UI class token 真源（`/`、`/traveltrust`、Console、Market 深色玻璃）
 * **单入口**：`@/lib/uiSystem`（re-export 本文件 + 分区 helper）
 * V1 只读快照：`frontend/archive/ui-v1/` · 登记：`issues-phase1-ui-ux-traveltrust-v6.md` §V2
 */

import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

/** —— 顶栏（结构一致 · 浅/深/首页半透明） —— */

/** 全站 L0 顶栏内容最大宽（与 community `max-w-6xl`、market `max-w-5xl` 近邻；traveltrust 页内 7xl 为 L1） */
export const TT_MARKETING_HEADER_INNER_FRAME = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/** 页内 L2 粘性条贴在 L0 顶栏下（`Header` py-3 + 主行 ≈ 4.5rem + safe-area） */
export const TT_MARKETING_SITE_HEADER_STICKY_OFFSET_CLASS =
  "top-[calc(4.5rem+env(safe-area-inset-top,0px))]";

/** `/traveltrust` L1 fixed：小屏含 Header mobile 四链 rail（≈7.25rem）；sm+ 仅 L0 主行（4.5rem） */
export const TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS =
  "top-[calc(7.25rem+env(safe-area-inset-top,0px))] sm:top-[calc(4.5rem+env(safe-area-inset-top,0px))]";

/** `/community` L1 Tab 条（含 py-2.5 · 桌面粘滞叠层真高 ≈ 4.5rem） */
export const TT_MARKETING_COMMUNITY_L1_STICKY_BAND_CLASS =
  "min-h-[3.25rem]";

/** `/community` 桌面侧栏 sticky：仅 L0 顶栏（L1 Tab 随页滚动 · 不叠挡 Feed 顶区） */
export const TT_MARKETING_COMMUNITY_DESKTOP_STICKY_STACK_TOP =
  "calc(4.75rem + env(safe-area-inset-top, 0px))";

/** Feed 内「推荐/关注」条：仅移动端 sticky；桌面 static 避免压住筛选/空态 */
export const TT_MARKETING_COMMUNITY_FEED_TAB_STICKY_CLASS =
  "sticky z-[15] mb-2 flex items-end gap-1 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md -mx-1 px-1 max-[390px]:mb-2 max-[390px]:top-11 md:static md:z-auto md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none";

/** Feed 桌面栅格（224-D · 行1 Lead+侧栏顶对齐 · 行2 主列） */
export const TT_COMMUNITY_FEED_DESKTOP_GRID =
  "flex flex-col gap-4 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-3 lg:items-start lg:pb-10";

/** Feed 主列区块纵向节奏 */
export const TT_COMMUNITY_FEED_STACK = "flex flex-col gap-2.5";

export const TT_COMMUNITY_FEED_LEAD_GRID_CELL =
  "hidden md:block min-w-0 lg:col-start-1 lg:row-start-1";

export const TT_COMMUNITY_FEED_ASIDE_GRID_CELL =
  "hidden lg:block min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 self-start";

/** Feed 主列（移动居中 · 桌面栅格第 2 行左列） */
export const TT_COMMUNITY_FEED_MAIN_GRID_CELL =
  "min-w-0 w-full max-w-3xl mx-auto lg:max-w-none lg:mx-0 lg:col-start-1 lg:row-start-2 relative z-0";

/** @deprecated 用 TT_COMMUNITY_FEED_MAIN_GRID_CELL */
export const TT_COMMUNITY_FEED_MAIN_COLUMN = TT_COMMUNITY_FEED_MAIN_GRID_CELL;

/** 侧栏：粘顶锚定、随页滚（整页单滚动 · 无列内 max-h/overflow） */
export const TT_MARKETING_COMMUNITY_FEED_ASIDE_STICKY_CLASS =
  "hidden lg:block min-w-0 w-full z-0 self-start lg:sticky lg:top-[calc(4.75rem+env(safe-area-inset-top,0px))]";

/** `/market` 双栏 · 右列向导目录：粘顶 + 列内滚动（与 community aside 同源 · MARKET-UI-THAW） */
export const TT_MARKETING_MARKET_GUIDES_ASIDE_STICKY_CLASS =
  "min-w-0 w-full z-[1] self-start lg:sticky lg:top-[calc(4.75rem+env(safe-area-inset-top,0px))] lg:max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px))] lg:overflow-y-auto lg:overscroll-contain";

export const TT_MARKETING_HEADER_BAR_LIGHT =
  "relative sticky top-0 z-[300] border-b border-ref-sun/14 bg-[#faf8f6]/96 text-[#5c4528] backdrop-blur-sm pointer-events-auto";

export const TT_MARKETING_HEADER_BAR_DARK =
  "relative sticky top-0 z-[300] border-b border-white/10 bg-[#14100d]/88 text-slate-100 backdrop-blur-md pointer-events-auto";

/** marketDark premium · L0 顶栏（`/community` · `/market*` · `/did-rank` · 与首页 L0 右区同族） */
export const TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM =
  "relative sticky top-0 z-[300] border-b-0 bg-[#0a0a0a] text-slate-100 backdrop-blur-md pointer-events-auto";

/** `/community/*` premium · L0 顶栏（封口 · alias 至 DARK_ROUTE_PREMIUM） */
export const TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM = TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM;

/** `/market*` · `/did-rank` · L0 顶栏（V2 · 与 TT 社区 premium 同值） */
export const TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM = TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM;

/** `/traveltrust` 全页电影：暖墨实心顶栏（勿 backdrop-blur 混 WebGL 冷青） */
export const TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC =
  "relative sticky top-0 z-[300] border-b border-ref-sun/12 bg-[#0c0a09] text-slate-100 pointer-events-auto shadow-[0_2px_14px_-10px_rgba(0,0,0,0.45)]";

/** `/` 风景底：半透明深条，与 /traveltrust 品牌连续 */
export const TT_MARKETING_HEADER_BAR_HOME =
  "relative sticky top-0 z-[300] border-b border-white/12 bg-ink-950/88 text-slate-100 backdrop-blur-md pointer-events-auto";

export const TT_MARKETING_NAV_MOBILE_RAIL_INNER = "flex flex-wrap items-center gap-2 py-3";

export const TT_MARKETING_NAV_MOBILE_RAIL_LIGHT =
  "sm:hidden border-t border-ref-sun/12 bg-[#faf8f6]/98 px-4";
export const TT_MARKETING_NAV_MOBILE_RAIL_DARK = "sm:hidden border-t border-white/10 bg-[#14100d]/95 px-4";
export const TT_MARKETING_NAV_MOBILE_RAIL_DARK_ROUTE_PREMIUM =
  "sm:hidden border-t border-white/8 bg-[#0a0a0a] px-4";

export const TT_MARKETING_NAV_MOBILE_RAIL_COMMUNITY_PREMIUM = TT_MARKETING_NAV_MOBILE_RAIL_DARK_ROUTE_PREMIUM;

export const TT_MARKETING_NAV_MOBILE_RAIL_MARKET_DARK_PREMIUM = TT_MARKETING_NAV_MOBILE_RAIL_DARK_ROUTE_PREMIUM;
export const TT_MARKETING_NAV_MOBILE_RAIL_HOME = "sm:hidden border-t border-white/10 bg-ink-950/90 px-4";

/** L0 四链：字色 + 底指示条（与 L1 landing nav 同轨 · 无椭圆描边胶囊） */
const TT_MARKETING_NAV_LINK_BASE =
  "relative inline-flex min-h-[32px] items-center px-2.5 py-1 text-small font-medium motion-sub transition-colors";

const TT_MARKETING_NAV_ACTIVE_UNDERLINE_SUN =
  "after:pointer-events-none after:absolute after:inset-x-0.5 after:-bottom-px after:block after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-ref-sun/85 after:to-ref-coral/75 after:content-['']";

const TT_MARKETING_NAV_ACTIVE_UNDERLINE_WARM =
  "after:pointer-events-none after:absolute after:inset-x-0.5 after:-bottom-px after:block after:h-[2px] after:rounded-full after:bg-ref-sun/75 after:content-['']";

/** 深顶栏四链 SSOT：激活暖金 + 底条；未选中浅灰（`!` 压过 globals `a{color:inherit}`） */
export const TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED = `${TT_MARKETING_NAV_LINK_BASE} font-semibold !text-ref-sun ${TT_MARKETING_NAV_ACTIVE_UNDERLINE_SUN}`;
export const TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED = `${TT_MARKETING_NAV_LINK_BASE} !text-[#d4cec6] hover:!text-white`;

/** Console 浅顶栏：暖金棕（禁止 ink-900 继承） */
export const TT_MARKETING_NAV_LINK_ACTIVE_LIGHT = `${TT_MARKETING_NAV_LINK_BASE} font-semibold !text-[#9a5f18] ${TT_MARKETING_NAV_ACTIVE_UNDERLINE_WARM}`;
export const TT_MARKETING_NAV_LINK_INACTIVE_LIGHT = `${TT_MARKETING_NAV_LINK_BASE} !text-[#6b5a48] hover:!text-[#9a5f18]`;

/** @deprecated 用 ACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_ACTIVE_HOME = TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED;
/** @deprecated 用 INACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_INACTIVE_HOME = TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED;
/** @deprecated 用 ACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_ACTIVE_DARK = TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED;
/** @deprecated 用 INACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_INACTIVE_DARK = TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED;
/** @deprecated 用 ACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_ACTIVE_EXPERIENCE = TT_MARKETING_NAV_LINK_ACTIVE_UNIFIED;
/** @deprecated 用 INACTIVE_UNIFIED */
export const TT_MARKETING_NAV_LINK_INACTIVE_EXPERIENCE = TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED;

/** L0 品牌字标（非四链胶囊 · 全站 SSOT） */
export const TT_MARKETING_HEADER_BRAND_HOME =
  "text-small font-semibold tracking-tight text-white hover:text-ref-sun motion-sub";
export const TT_MARKETING_HEADER_BRAND_DARK =
  "text-small font-semibold tracking-tight text-slate-100 hover:text-ref-sun motion-sub";
export const TT_MARKETING_HEADER_BRAND_LIGHT =
  "text-small font-semibold tracking-tight text-[#5c4528] hover:text-[#9a5f18] motion-sub";

/** L0 登录链（与四链同场域色） */
export const TT_MARKETING_HEADER_LOGIN_HOME =
  "inline-flex min-h-[44px] shrink-0 items-center text-small font-medium text-slate-100/92 hover:text-white motion-sub";
export const TT_MARKETING_HEADER_LOGIN_DARK =
  "inline-flex min-h-[32px] items-center text-small font-medium text-slate-200/92 hover:text-white motion-sub";
export const TT_MARKETING_HEADER_LOGIN_LIGHT =
  "inline-flex min-h-[32px] items-center text-small font-medium text-slate-600 hover:text-[#9a5f18] motion-sub";

export const TT_MARKETING_REGISTER_PILL_LIGHT =
  "inline-flex min-h-[36px] items-center rounded-full px-4 py-1.5 text-small font-semibold border border-ref-sun/35 bg-gradient-to-r from-[#e8c96a] via-[#f0a878] to-[#e8c96a] text-[#0c0a09] shadow-[0_4px_18px_-6px_rgba(252,164,124,0.45)] hover:brightness-105 motion-sub";

/** 深色 / 首页 / traveltrust：暖金注册（与 Hero CTA 同族） */
export const TT_MARKETING_REGISTER_PILL_WARM =
  "inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 py-2 text-small font-semibold border border-ref-sun/35 bg-gradient-to-r from-[#e8c96a] via-[#f0a878] to-[#e8c96a] text-[#0c0a09] shadow-[0_4px_18px_-6px_rgba(252,164,124,0.45)] hover:brightness-105 motion-sub";

/** `/community/*` L0 注册 · 与首页 `REGISTER_PILL_WARM` 同形态（页内主 CTA 仍单独收口） */
export const TT_MARKETING_REGISTER_PILL_COMMUNITY = TT_MARKETING_REGISTER_PILL_WARM;

/** @deprecated 用 REGISTER_PILL_WARM */
export const TT_MARKETING_REGISTER_PILL_DARK = TT_MARKETING_REGISTER_PILL_WARM;

/**
 * 全站主题 V1 · 暖金 Action 真源（与 L0 `REGISTER_PILL_WARM` / 首页暖金主路径同族）。
 * marketDark 主 CTA、Hub/Tab 激活、周期 Tab **禁止**再用全局 `bg-cta-gradient`（蓝紫 `#3b82f6→#8b5cf6`）。见 runbook **§1.7**。
 */
export const TT_MARKETING_ACTION_GRADIENT_FILL =
  "bg-gradient-to-r from-[#e8c96a] via-[#f0a878] to-[#d4845f]";

export const TT_MARKETING_ACTION_GRADIENT_SHADOW =
  "shadow-[0_0_20px_-6px_rgba(252,164,124,0.32)]";

export const TT_MARKETING_ACTION_TITLE_GRADIENT =
  "bg-gradient-to-r from-ref-sun via-[#f0a878] to-ref-coral bg-clip-text text-transparent";

/** 统计数字 / 强调计数（社区 activity 等 · 与标题渐变同族） */
export const TT_MARKETING_ACTION_STAT_EMPHASIS = `font-bold tabular-nums ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

export const TT_MARKETING_ACTION_PERIOD_TAB_ACTIVE = `inline-flex min-h-[44px] items-center justify-center rounded-full border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} px-3 py-1 text-meta text-white font-semibold ${TT_MARKETING_ACTION_GRADIENT_SHADOW} motion-sub`;

export const TT_MARKETING_ACTION_PERIOD_TAB_IDLE =
  "rounded-full border border-slate-600/80 bg-slate-800/70 px-3 py-1 text-meta font-medium text-slate-300 hover:border-ref-sun/30 hover:text-slate-100 motion-sub";

/** `/did-rank` 时间范围 Tab（哑光 · 与 Hub/榜侧 Tab 同族 · PR-F） */
export const TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/22 bg-ref-sun/10 px-3 py-1 text-meta font-semibold text-ref-sun ring-0 shadow-none motion-sub";

export const TT_MARKETING_DID_RANK_PERIOD_TAB_IDLE =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/14 bg-ink-900/40 px-3 py-1 text-meta font-medium text-slate-300 hover:bg-ref-sun/8 hover:border-ref-sun/22 hover:text-slate-100 motion-sub";

/** marketDark 页身 `h1`（§1.7 · 与 `/` `TT_MARKETING_HOME_HERO_TITLE` 同族渐变） */
export const TT_MARKETING_DARK_ROUTE_PAGE_TITLE = `font-bold tracking-tight ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

export const TT_MARKETING_MARKET_PAGE_H1 =
  `text-h3 sm:text-h2 text-center drop-shadow-market-hero ${TT_MARKETING_DARK_ROUTE_PAGE_TITLE}`;

export const TT_MARKETING_MARKET_PAGE_H1_COMPACT =
  `text-h2 text-center drop-shadow-market-hero ${TT_MARKETING_DARK_ROUTE_PAGE_TITLE}`;

export const TT_MARKETING_DID_RANK_PAGE_H1 = `text-h2 ${TT_MARKETING_DARK_ROUTE_PAGE_TITLE}`;

/** did-rank · 榜区块 `h2`（§1.7 · 与首页标题渐变同族） */
export const TT_MARKETING_DID_RANK_SECTION_TITLE = `font-bold ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

/** marketDark · 筛选/排序 chip 激活（与周期 Tab 同族实心暖金） */
export const TT_MARKETING_ACTION_CHIP_TAB_ACTIVE = `border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} text-white font-semibold ${TT_MARKETING_ACTION_GRADIENT_SHADOW}`;

/** Console 浅顶栏语言切换（暖描边 · 非 ink-900） */
export const TT_MARKETING_HEADER_LANG_BTN_LIGHT =
  "flex min-h-[32px] items-center gap-1.5 rounded-full border border-ref-sun/20 bg-ref-sun/6 px-3 py-1.5 text-meta text-[#5c4528] hover:bg-ref-sun/10 hover:text-[#9a5f18]";

export const TT_MARKETING_HEADER_LANG_MENU_LIGHT =
  "absolute right-0 top-full z-50 mt-1 min-w-[8rem] rounded-[var(--radius-sm)] border border-ref-sun/16 bg-[#faf8f6] py-1 shadow-[0_12px_32px_-8px_rgba(92,69,40,0.18)]";

export const TT_MARKETING_HEADER_LANG_MENU_ITEM_LIGHT =
  "w-full px-3 py-2 text-left text-meta text-[#5c4528] hover:bg-ref-sun/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/45";

/** 顶栏浅底控件 focus（`ring-offset-white`；替代 `travelFocusRingCoreOffset2WhiteClasses`） */
export const TT_MARKETING_HEADER_FOCUS_RING_LIGHT =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** 顶栏深色/首页半透明条内联链 focus（替代深色 Header 上的 travel white-offset ring） */
export const TT_MARKETING_HEADER_FOCUS_RING_DARK =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

/** 深色顶栏语言切换（`/traveltrust` · `/` 半透明条） */
export const TT_MARKETING_HEADER_LANG_BTN_DARK =
  "flex min-h-[32px] items-center gap-1.5 rounded-full border border-white/14 bg-white/5 px-3 py-1.5 text-meta text-[#e8e4e0] hover:bg-white/10 hover:text-white";

/** `/auth/*` L5 · 暖金 utility 胶囊（与登录玻璃卡同温，非冷白描边） */
export const TT_MARKETING_HEADER_UTILITY_BTN_AUTH_L5 =
  "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-ref-sun/38 bg-ref-sun/[0.08] px-3 py-2 text-meta text-[#e8e4e0] hover:border-ref-sun/52 hover:bg-ref-sun/12 hover:text-ref-sun/95";

export const TT_MARKETING_HEADER_LANG_BTN_AUTH_L5 = TT_MARKETING_HEADER_UTILITY_BTN_AUTH_L5;
export const TT_MARKETING_HEADER_WALLET_BTN_AUTH_L5 = TT_MARKETING_HEADER_UTILITY_BTN_AUTH_L5;

export const TT_MARKETING_HEADER_LANG_MENU_AUTH_L5 =
  "absolute right-0 top-full mt-1 min-w-[8rem] rounded-[var(--radius-sm)] border border-ref-sun/22 bg-[#0c0a09]/98 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md z-50";

export const TT_MARKETING_HEADER_LANG_MENU_ITEM_AUTH_L5 =
  "w-full text-left px-3 py-2 text-meta text-slate-200 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50";

export const TT_MARKETING_HEADER_WALLET_CONNECTED_AUTH_L5 =
  "inline-flex min-h-[32px] max-w-[11rem] items-center gap-1.5 rounded-full border border-ref-sun/38 bg-ref-sun/[0.08] px-3 py-1 text-meta text-[#e8e4e0]";

export const TT_MARKETING_HEADER_WALLET_MENU_AUTH_L5 = TT_MARKETING_HEADER_LANG_MENU_AUTH_L5;
export const TT_MARKETING_HEADER_WALLET_MENU_ITEM_AUTH_L5 = TT_MARKETING_HEADER_LANG_MENU_ITEM_AUTH_L5;

/** `/community/*` L0 语言/钱包 · 与首页深顶栏 `LANG_BTN_DARK` 同形态 */
export const TT_MARKETING_HEADER_UTILITY_BTN_COMMUNITY = TT_MARKETING_HEADER_LANG_BTN_DARK;

export const TT_MARKETING_HEADER_LANG_MENU_DARK =
  "absolute right-0 top-full mt-1 min-w-[8rem] rounded-[var(--radius-sm)] border border-white/15 bg-ink-950/98 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md z-50";

export const TT_MARKETING_HEADER_LANG_MENU_ITEM_DARK =
  "w-full text-left px-3 py-2 text-meta text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50";

/** L0 钱包（与语言切换同形态胶囊） */
export const TT_MARKETING_HEADER_WALLET_BTN_DARK = TT_MARKETING_HEADER_LANG_BTN_DARK;
export const TT_MARKETING_HEADER_WALLET_BTN_COMMUNITY = TT_MARKETING_HEADER_UTILITY_BTN_COMMUNITY;
export const TT_MARKETING_HEADER_WALLET_BTN_LIGHT = TT_MARKETING_HEADER_LANG_BTN_LIGHT;
export const TT_MARKETING_HEADER_LANG_BTN_COMMUNITY = TT_MARKETING_HEADER_UTILITY_BTN_COMMUNITY;
export const TT_MARKETING_HEADER_WALLET_MENU_DARK = TT_MARKETING_HEADER_LANG_MENU_DARK;
export const TT_MARKETING_HEADER_WALLET_MENU_LIGHT = TT_MARKETING_HEADER_LANG_MENU_LIGHT;
export const TT_MARKETING_HEADER_WALLET_MENU_ITEM_DARK = TT_MARKETING_HEADER_LANG_MENU_ITEM_DARK;
export const TT_MARKETING_HEADER_WALLET_MENU_ITEM_LIGHT = TT_MARKETING_HEADER_LANG_MENU_ITEM_LIGHT;
export const TT_MARKETING_HEADER_WALLET_CONNECTED_DARK =
  "inline-flex min-h-[32px] max-w-[11rem] items-center gap-1.5 rounded-full border border-white/14 bg-white/5 px-3 py-1 text-meta text-[#e8e4e0]";

export const TT_MARKETING_HEADER_WALLET_CONNECTED_COMMUNITY = TT_MARKETING_HEADER_WALLET_CONNECTED_DARK;
export const TT_MARKETING_HEADER_WALLET_CONNECTED_LIGHT =
  "inline-flex min-h-[32px] max-w-[11rem] items-center gap-1.5 rounded-full border border-ref-sun/20 bg-ref-sun/6 px-3 py-1 text-meta text-[#5c4528]";

/** `/community/*` L1 壳（暖墨 · 与 L0 marketing 同族） */
export const TT_COMMUNITY_SHELL_L5 = {
  pageBgClass: "min-h-screen relative overflow-x-hidden bg-[#14100d]",
  headerBarClass:
    "sticky top-0 z-[110] border-b border-ref-sun/14 bg-[#14100d]/92 text-slate-100 backdrop-blur-md safe-area-inset-t",
  headerBarMobileClass:
    "md:hidden sticky top-0 z-[110] border-b border-ref-sun/14 bg-[#14100d]/92 backdrop-blur-md safe-area-inset-t",
  headerBarDesktopClass:
    "hidden md:block sticky top-0 z-[110] relative border-b border-ref-sun/14 bg-[#14100d]/92 backdrop-blur-md safe-area-inset-t",
  tabProgressClass: "absolute left-0 top-0 right-0 h-0.5 bg-ref-sun/75 z-[1]",
  tabBarClass:
    "flex items-stretch gap-1 rounded-lg p-1 bg-[#0c0a09]/75 ring-1 ring-inset ring-ref-sun/12",
  tabBarMobileClass:
    "flex items-stretch gap-0.5 rounded-lg p-1 bg-[#0c0a09]/75 ring-1 ring-inset ring-ref-sun/12",
  tabActiveClass: `relative flex-1 font-semibold rounded-[var(--radius-md)] border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} text-white ${TT_MARKETING_ACTION_GRADIENT_SHADOW} ring-1 ring-ref-sun/22`,
  tabIdleClass:
    "flex-1 text-slate-300 hover:text-slate-100 hover:bg-ink-700/60 border border-transparent",
  tabBaseClass:
    "relative text-center rounded-md px-2 py-2 sm:px-3 text-meta font-medium motion-sub min-h-[44px] flex items-center justify-center border border-transparent",
  titleLinkClass: "text-body font-semibold text-ref-sun/90 hover:text-ref-sun",
  metaLinkClass: "text-meta text-[#e8e4e0] hover:text-ref-sun/90 motion-sub underline-offset-2",
  supportRowClass: "border-t border-ref-sun/12 bg-[#0c0a09]/55 px-3 py-1.5",
  mobileBottomNavClass:
    "md:hidden fixed bottom-0 left-0 right-0 z-[110] relative border-t border-ref-sun/14 bg-[#14100d]/95 backdrop-blur-md safe-area-pb",
  tabDividerClass: "w-px shrink-0 self-stretch bg-ref-sun/15 my-1",
} as const;

/**
 * `/community/*` L2/L3 页身 chrome（暖金 · 与 `TT_COMMUNITY_SHELL_L5` 同族）。
 */
export const TT_COMMUNITY_PAGE_L5 = {
  pageHeader:
    "rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/60 backdrop-blur-md px-4 py-5 mb-4 text-slate-200",
  pageTitle: `text-h3 font-bold ${TT_MARKETING_ACTION_TITLE_GRADIENT}`,
  pageTitleH2: `text-h2 font-bold ${TT_MARKETING_ACTION_TITLE_GRADIENT}`,
  pageTitleH4: "text-h4 font-semibold text-ref-sun",
  panel:
    "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-800/70 backdrop-blur-md overflow-hidden shadow-scifi-panel",
  panelInset: "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 backdrop-blur-md overflow-hidden",
  panelLoose: "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-800/70 backdrop-blur-md p-4 mb-4",
  emptyDashed:
    "rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-900/45 px-5 py-10 text-center space-y-4",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/30 bg-ref-sun/10 text-ref-sun",
  pill:
    "rounded-full border border-ref-sun/40 bg-ref-sun/12 px-4 py-2 text-meta font-medium text-ref-sun hover:text-ref-coral hover:bg-ref-sun/18 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center",
  /** 页内主 CTA（空态「去发布/去发现」等 · 暖金实心 · 替代历史 fuchsia pill） */
  primaryCtaFilled: `inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2 text-meta font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-105 motion-sub`,
  primaryCtaFilledLg: `inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/45 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-6 py-3 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-sub`,
  pillCompact:
    "rounded-full border border-ref-sun/38 bg-ref-sun/12 px-3 py-1.5 text-meta text-ref-sun/90 hover:text-ref-sun hover:bg-ref-sun/18 motion-sub min-h-[44px] inline-flex items-center justify-center",
  innerTabActive: `rounded-[var(--radius-md)] border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} text-white font-semibold ${TT_MARKETING_ACTION_GRADIENT_SHADOW}`,
  innerTabIdle:
    "rounded-[var(--radius-md)] border border-transparent text-slate-300 hover:border-ref-sun/28 hover:text-slate-200 hover:bg-ink-700/50",
  avatarRing: "ring-2 ring-ref-sun/25",
  avatarPlaceholderBg: "bg-ref-sun/12 text-ref-sun",
  borderDivider: "border-ref-sun/22",
  composerBar: "border-t border-ref-sun/22 bg-ink-900/90",
  messageBubbleOut: "bg-ref-sun/22 text-ref-sun/95 border border-ref-sun/32",
  toast:
    "rounded-[var(--radius-md)] border border-ref-sun/35 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-ref-sun/90 shadow-[0_0_32px_-10px_rgba(252,164,124,0.2)]",
  ttCardFrame:
    "rounded-[var(--radius-xl)] bg-gradient-to-br from-ref-sun/45 via-ref-coral/35 to-ref-sun/40 p-[1px] shadow-[0_0_48px_-12px_rgba(252,164,124,0.22)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-scifi-hover-strong",
  ttCardTitle:
    "mb-2 bg-gradient-to-r from-ref-sun via-ref-coral to-ref-sun bg-clip-text text-h3 font-bold text-transparent sm:text-h2",
} as const;

/** `/community/me` 资料卡与子导航（暖金 · 与 `TT_COMMUNITY_PAGE_L5` 同族 · ①） */
export const TT_COMMUNITY_ME_PANEL_L5 = {
  profileCardShell: `${TT_COMMUNITY_PAGE_L5.panel} shadow-scifi-panel ring-1 ring-ref-sun/12 overflow-hidden`,
  notesNavShell:
    "mt-3 rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-950/55 p-0.5 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-ref-sun/10",
  guestNotesShell:
    "rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-950/50 backdrop-blur-md overflow-hidden shadow-scifi-panel ring-1 ring-ref-sun/10 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  eyebrowLabel:
    "px-2 pt-1.5 pb-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-ref-sun/85 sm:text-meta",
  pageEyebrow: "text-[0.65rem] sm:text-meta font-medium uppercase tracking-wide text-ref-sun/90",
  detailsSummary:
    "flex cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-1 py-2 text-meta font-medium text-slate-200 hover:bg-ink-800/50 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 min-h-[44px] [&::-webkit-details-marker]:hidden",
  detailsSummaryLoose:
    "flex cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-small font-medium text-slate-200 hover:bg-ink-800/50 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 min-h-[44px] [&::-webkit-details-marker]:hidden",
  detailsChevron:
    "h-4 w-4 shrink-0 text-ref-sun/90 transition-transform group-open:rotate-180 motion-reduce:transition-none",
  privacyCheckbox:
    "mt-0.5 h-4 w-4 shrink-0 rounded border-slate-500 text-ref-sun focus:ring-ref-sun/55 focus-visible:ring-ref-sun/55",
  authGateShell: `${TT_COMMUNITY_PAGE_L5.panel} px-4 py-6 text-center shadow-scifi-panel ring-1 ring-ref-sun/12`,
  authLoadingShell: `${TT_COMMUNITY_PAGE_L5.panel} px-4 py-4 shadow-scifi-panel ring-1 ring-white/5`,
  loadingPulse: `${TT_COMMUNITY_PAGE_L5.panel} px-4 py-6 animate-pulse shadow-scifi-panel ring-1 ring-ref-sun/10`,
  linkAccent: "text-meta text-ref-sun hover:text-ref-coral motion-sub underline underline-offset-2",
  roleLabel: "text-meta text-ref-sun/90 mt-0.5",
  avatarUploadHint: "mt-1.5 text-center text-meta font-medium text-ref-sun/95 max-w-[5.5rem] leading-tight",
  avatarInitial: "relative z-[1] text-h3 font-semibold text-ref-sun",
  /** 资料卡「赞过 | 收藏 | 订单 | 社区帖子」分段 · 活跃态（暖金 · 非 cyan-200 漂移） */
  segmentLinkActive:
    "bg-ref-sun/14 font-semibold text-ref-sun ring-1 ring-inset ring-ref-sun/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  segmentLinkInactive: "text-slate-400 hover:bg-slate-800/55 hover:text-slate-200",
  /** 资料卡内容预览行 ·「查看全部」链 */
  previewViewAllLink:
    "shrink-0 text-meta font-medium text-ref-sun hover:text-ref-coral motion-sub underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded-sm",
} as const;

/** 高级暗底 · focus 环偏移（与 `#0a0a0a` 页身一致） */
export const TT_COMMUNITY_FOCUS_RING_OFFSET =
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/** Feed 列表节奏（① premium · 波次 A） */
export const TT_COMMUNITY_FEED_LAYOUT = {
  desktopStack: "space-y-5",
  /** 关注/非推荐 · 移动双列 / sm+ 三列紧凑网格 */
  mobileGrid:
    "grid grid-cols-2 gap-2 max-[390px]:gap-1.5 sm:grid-cols-3 sm:gap-2.5",
  /** 推荐 / 关注 · 移动双列 / md+ 三列瀑布（美团式错落） */
  masonry:
    "columns-2 gap-1.5 space-y-1.5 max-[390px]:gap-1 max-[390px]:space-y-1 md:columns-3 md:gap-2.5 md:space-y-2.5",
  /** Feed 主栏宽度 · 瀑布可读区（超宽屏限宽提密度） */
  feedColumn: "min-w-0 flex-1 w-full max-w-[720px] mx-auto lg:mx-0 xl:max-w-[780px]",
} as const;

/** Feed 次要 chip / 排序激活（描边暖金 · 非实心渐变） */
const TT_COMMUNITY_FEED_CHIP_ACTIVE_MUTED =
  "border-ref-sun/45 bg-ref-sun/14 text-ref-sun font-semibold shadow-[0_0_12px_-4px_rgba(252,164,124,0.35)]";

/** `/community` Feed · L5 面板语法（与 `TT_COMMUNITY_PAGE_L5.panel` 同族 · 仅社区） */
export const TT_COMMUNITY_FEED_PANEL_L5 =
  "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-800/70 backdrop-blur-md shadow-[0_12px_40px_-28px_rgba(0,0,0,0.48)] ring-1 ring-ref-sun/12 overflow-hidden";

export const TT_COMMUNITY_FEED_PANEL_SOFT =
  "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-800/55 backdrop-blur-md";

/** `/community` Feed 瀑布 / promo / 移动热榜 · L5 微交互 SSOT（①） */
export const TT_COMMUNITY_FEED_L5 = {
  masonryShellFocus:
    "focus-within:ring-2 focus-within:ring-ref-sun/30 focus-within:ring-offset-2 focus-within:ring-offset-ink-950",
  masonryMediaReveal:
    "motion-safe:transition-opacity motion-safe:duration-300 opacity-0 data-[media-loaded=true]:opacity-100",
  masonryVideoAutoplayBadge:
    "pointer-events-none absolute right-1.5 bottom-1.5 z-[5] rounded-full bg-black/55 px-1.5 py-0.5 text-[0.55rem] text-white/90 backdrop-blur-[2px]",
  masonryLikeBtn:
    `inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-0.5 text-[0.68rem] text-slate-500 motion-sub hover:text-ref-sun/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  masonryLikeBtnActive: "text-ref-sun/90",
  masonryLikeBurst:
    "pointer-events-none absolute inset-0 z-[6] flex items-center justify-center bg-black/20",
  masonryLikeBurstIcon: "h-10 w-10 text-ref-sun/95 motion-safe:animate-ping",
  masonryCardBody: "px-1.5 pt-1 pb-1",
  masonryLikeCount: "tabular-nums text-[0.62rem]",
  masonryLikeLabel: "text-[0.62rem] text-slate-500",
  masonryStatBtn:
    "inline-flex min-h-[36px] min-w-[36px] items-center justify-center gap-0.5 rounded-full px-1.5 text-slate-400 motion-sub hover:text-ref-sun/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun",
  masonryStatBtnActive: "text-ref-sun/90",
  masonryStatCount: "tabular-nums text-[0.62rem] font-medium",
  promoThumbShimmer:
    "pointer-events-none absolute inset-0 z-[2] animate-pulse bg-gradient-to-br from-ink-800/50 via-ref-sun/[0.05] to-ink-900/70",
  discoveryChipMotion:
    "motion-safe:transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-out",
  discoveryChipActivePop:
    "shadow-[0_0_14px_-4px_rgba(252,164,124,0.42)] motion-safe:scale-[1.02]",
  discoveryTabIndicator:
    "motion-safe:transition-[box-shadow,color] duration-200",
  promoCardFocus:
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  promoTailShell: `${TT_COMMUNITY_FEED_PANEL_SOFT} col-span-full mb-2 break-inside-avoid px-4 py-5 text-center`,
  promoTailHint: "text-meta leading-snug text-slate-400",
  promoTailLink: "mt-2 inline-flex min-h-[44px] items-center text-meta font-medium text-ref-sun/90 motion-sub hover:text-ref-sun",
  promoLeadBand:
    "mb-2.5 hidden grid-cols-1 gap-2 md:grid md:grid-cols-2 md:gap-2.5 max-[390px]:mb-2 max-[390px]:gap-1.5",
  promoLeadCell: "min-w-0 h-full",
  promoMasonryInflow: "break-inside-avoid mb-2 md:hidden",
  masonryAdBadge:
    "pointer-events-none absolute left-1.5 top-1.5 z-[5] rounded-[var(--radius-sm)] bg-black/55 px-1.5 py-0.5 text-[0.55rem] font-medium text-white/90 backdrop-blur-sm",
  masonryShowcaseBadge:
    "pointer-events-none absolute left-1.5 top-1.5 z-[5] rounded-full border border-ref-sun/28 bg-ref-sun/12 px-1.5 py-0.5 text-[0.55rem] font-medium text-slate-100 backdrop-blur-sm",
  masonryCardPlayCenter:
    "pointer-events-none absolute left-1/2 top-1/2 z-[4] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.65)] backdrop-blur-sm",
  discoveryScanBtn:
    `inline-flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-full border border-ref-sun/28 bg-ink-900/70 text-ref-sun/90 motion-sub hover:border-ref-sun/40 hover:bg-ref-sun/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoveryActivityLink:
    "inline-flex shrink-0 self-center min-h-[36px] max-w-[5.5rem] items-center truncate rounded-full border border-ref-sun/18 bg-ink-900/45 px-2.5 text-[0.62rem] text-slate-400 motion-sub hover:border-ref-sun/28 hover:text-ref-sun/90",
  discoveryAnchorSelect:
    `min-h-[36px] max-w-[9rem] cursor-pointer appearance-none rounded-full border border-ref-sun/25 bg-ink-900/80 pl-3 pr-7 py-1.5 text-meta font-medium text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  loadMoreBtn:
    `inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/28 bg-ink-900/55 px-6 text-meta font-medium text-ref-sun/90 motion-sub hover:border-ref-sun/40 hover:bg-ref-sun/10 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  feedEndHint: "py-6 text-center text-[0.68rem] text-slate-500",
  mobileHotStrip: "md:hidden border-b border-ref-sun/8 bg-ink-950/30 px-3 py-2.5 max-[390px]:px-2.5",
  mobileHotStripScroll: "flex gap-2 overflow-x-auto scrollbar-hide pb-0.5",
  mobileHotChip:
    "flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-[var(--radius-md)] bg-ink-900/60 px-2 py-1.5 motion-sub hover:bg-ink-900/80",
  mobileHotChipThumb:
    "relative h-9 w-9 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gradient-to-br from-ink-700 to-ink-900",
  mobileHotChipTitle: "truncate text-[0.68rem] font-medium text-slate-200",
  mobileHotChipMeta: "truncate text-[0.58rem] text-slate-500",
  skeletonPromoActivity: "flex min-h-[5.5rem] gap-2 rounded-[var(--radius-md)] bg-ink-900/40 p-2",
  skeletonPromoHot: "min-h-[5.5rem] rounded-[var(--radius-md)] bg-ink-900/40 p-2 space-y-2",
} as const;

/** 小红书式竖屏视频 Feed 浮层 · L5（① 本地） */
export const TT_COMMUNITY_VIDEO_OVERLAY_L5 = {
  slideEnter:
    "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:ease-out",
  slideEnterFromBottom: "motion-safe:slide-in-from-bottom-8",
  slideEnterFromTop: "motion-safe:slide-in-from-top-8",
  actionRail:
    "pointer-events-auto absolute right-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-center gap-4 transition-all motion-safe:duration-300 md:right-5",
  actionBtn:
    "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full border border-white/15 bg-black/35 text-white/90 backdrop-blur-sm motion-sub hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  actionBtnActive: "border-ref-sun/45 text-ref-sun/95",
  actionCount: "text-[0.62rem] font-medium tabular-nums text-white/85",
  commentSheet:
    "pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex max-h-[min(72vh,520px)] flex-col rounded-t-[var(--radius-xl)] border border-white/10 border-b-0 bg-ink-950/95 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md motion-safe:animate-in motion-safe:slide-in-from-bottom-full motion-safe:duration-300",
  commentSheetHandle: "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25",
  commentSheetScroll: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2",
  commentSheetComposer:
    "shrink-0 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-ink-950/98",
  heartBurst: "motion-safe:animate-in motion-safe:zoom-in motion-safe:fade-in motion-safe:duration-300",
  captionClamp: "line-clamp-2",
  videoIndexPill:
    "pointer-events-none absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-meta tabular-nums text-white/85 backdrop-blur-sm md:hidden",
  overlayCloseFab:
    "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/35 bg-black/60 text-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm hover:bg-black/75 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  overlayTopBar:
    "relative z-40 flex shrink-0 items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/95 via-black/70 to-transparent min-h-[52px]",
  overlayProgressDock: "pointer-events-auto mt-3 space-y-1.5",
  overlayCaptionDock:
    "flex w-full flex-col bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 px-4",
  chromeFade:
    "transition-opacity motion-safe:duration-300 motion-safe:ease-out",
  chromeHidden: "opacity-0 pointer-events-none",
  videoBuffer:
    "pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/25",
  commentBackdrop:
    "pointer-events-auto absolute inset-0 z-[25] bg-black/35 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
  actionRailHidden: "pointer-events-none translate-x-6 opacity-0",
} as const;

/** 全站主题 V1 · `/community` Feed 主路径 Action（标题 / 主 Tab / 筛选 chip / 发布 FAB · ①） */
export const TT_COMMUNITY_FEED_ACTION = {
  /** @deprecated 大标题卡；Feed 改用 `headerToolbar` */
  headerFrame:
    "rounded-[var(--radius-lg)] border border-white/10 bg-ink-900/45 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5 mb-3 motion-sub hover:border-ref-sun/18 max-[390px]:px-3 max-[390px]:py-3 max-[390px]:mb-2",
  headerToolbarMobile:
    "md:hidden mb-3 flex flex-wrap items-center justify-between gap-2 gap-y-3 border-b border-white/8 pb-3 max-[390px]:mb-2 max-[390px]:pb-2",
  headerLeadDesktop:
    "hidden md:block mb-4 max-w-3xl text-meta text-slate-500",
  /** 224-D · 桌面首屏顶带（一行副标题 + 链 · 与右栏顶对齐） */
  feedHeroRow:
    "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-h-[44px]",
  feedHeroTitle: "text-meta text-slate-400",
  headerLeadDesktopBlock:
    "hidden md:block mb-4 space-y-2 border-b border-white/8 pb-4",
  headerLeadDesktopTitle: "text-body text-slate-400",
  /** L5 · 发帖/搜索唯一外框（内层无第二圈描边） */
  feedComposerShell: `${TT_COMMUNITY_FEED_PANEL_L5}`,
  feedComposerInner:
    "flex flex-col md:flex-row md:items-stretch md:min-h-[52px] md:gap-0",
  composerFormWrap: "flex min-w-0 flex-[2] md:flex-[2.25] lg:flex-[2.5]",
  feedComposerDividerH: "h-px shrink-0 bg-ref-sun/14 md:hidden",
  feedComposerDividerV: "hidden md:block w-px shrink-0 self-stretch bg-ref-sun/14 my-2.5",
  composerTriggerInShell:
    `flex w-full min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left bg-transparent border-0 rounded-none motion-sub hover:bg-ink-900/40 min-h-[52px] max-[390px]:min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/45 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  searchInShell:
    `w-full min-w-0 border-0 bg-transparent px-4 py-3 text-small text-slate-200 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40 md:w-[min(100%,14rem)] md:shrink-0 lg:w-[min(100%,15rem)] ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  /** @deprecated 用 feedComposerShell */
  feedComposerPanel:
    "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-800/65 backdrop-blur-md shadow-[0_12px_40px_-28px_rgba(0,0,0,0.5)] ring-1 ring-ref-sun/10 overflow-hidden",
  headerExploreRow: "flex flex-wrap items-center gap-x-3 gap-y-1 text-meta",
  headerTitle: TT_MARKETING_ACTION_TITLE_GRADIENT,
  headerTitleSrOnly: "sr-only",
  headerSubtitle: "text-meta text-slate-500 max-w-xl",
  headerLink:
    "inline-flex min-h-[44px] items-center justify-center text-meta text-ref-sun/90 hover:text-ref-sun motion-sub underline-offset-2 hover:underline",
  headerPillWarm:
    "rounded-full border border-ref-sun/28 bg-ref-sun/8 px-3 py-1.5 text-meta font-medium text-ref-sun/95 hover:bg-ref-sun/12 motion-sub inline-flex min-h-[44px] items-center justify-center gap-1.5",
  headerPillGhost:
    "rounded-full border border-white/10 bg-ink-900/45 px-3 py-1.5 text-meta text-slate-400 hover:border-ref-sun/18 hover:text-slate-200 motion-sub inline-flex min-h-[44px] items-center justify-center",
  headerBack:
    "rounded-full border border-ref-sun/35 bg-ref-sun/10 px-3 py-1.5 text-meta font-medium text-ref-sun hover:text-ref-coral hover:bg-ref-sun/16 motion-sub inline-flex min-h-[44px] items-center justify-center",
  feedTabBar: TT_MARKETING_COMMUNITY_FEED_TAB_STICKY_CLASS,
  feedTabActive:
    "inline-flex min-h-[44px] items-center justify-center rounded-none border-0 border-b-2 border-ref-sun bg-transparent px-3 pb-2.5 pt-2 text-ref-sun font-semibold shadow-none",
  feedTabIdle:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-transparent px-3 text-slate-400 hover:text-slate-200 hover:bg-white/5",
  feedTabUnderline: "hidden",
  feedTabFocus:
    `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET} rounded-[var(--radius-sm)]`,
  sortChipBase:
    `text-meta motion-sub min-h-[44px] inline-flex items-center justify-center px-2.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  sortChipActive:
    "rounded-none border-0 border-b-2 border-ref-sun bg-transparent pb-1.5 pt-1 text-ref-sun font-semibold shadow-none",
  sortChipIdle:
    "border-transparent bg-transparent text-slate-500 hover:text-slate-300",
  filterChipBase:
    `inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 min-h-[44px] text-meta motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  filterChipActive: TT_COMMUNITY_FEED_CHIP_ACTIVE_MUTED,
  filterChipIdle:
    "border-white/10 bg-transparent text-slate-400 hover:border-ref-sun/22 hover:text-slate-200",
  searchInput:
    `w-full rounded-[var(--radius-lg)] border border-ref-sun/16 bg-ink-900/55 px-4 py-2 text-small text-slate-200 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  searchWrap: "mb-2",
  filterToggleWrap: "mb-0.5",
  feedListAfterFilters: "mt-0",
  /** 发现页顶栏（分类 Tab + 搜索行 + 目的地/筛选 pill · L5 premium） */
  discoveryChrome:
    "mb-3 overflow-visible rounded-[var(--radius-lg)] border border-white/10 bg-ink-900/45 backdrop-blur-sm shadow-[0_8px_32px_-24px_rgba(0,0,0,0.45)]",
  discoveryCategoryRow:
    "flex gap-1 overflow-x-auto overflow-y-hidden border-b border-ref-sun/14 px-3 pt-1 scrollbar-hide",
  discoveryCategoryTabActive:
    "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-none border-0 border-b-2 border-ref-sun bg-transparent px-4 pb-2.5 pt-2 text-ref-sun font-semibold shadow-[0_4px_14px_-8px_rgba(252,164,124,0.55)]",
  discoveryCategoryTabIdle:
    "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-transparent px-4 text-slate-400 motion-sub hover:bg-white/[0.04] hover:text-slate-200",
  discoverySearchRow:
    "border-b border-ref-sun/10 px-3 py-3 max-[390px]:px-2.5 max-[390px]:py-2.5",
  discoverySearchShell:
    "flex min-h-[48px] flex-wrap items-stretch gap-2 rounded-full border border-white/12 bg-ink-950/70 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  discoverySearchHint:
    "mt-1.5 px-0.5 text-meta leading-snug text-slate-500 line-clamp-2",
  discoveryPublishBtn:
    `inline-flex h-9 shrink-0 self-center items-center justify-center gap-1.5 rounded-full border border-ref-sun/35 bg-gradient-to-br from-ref-sun/22 to-ref-sun/10 px-2.5 text-ref-sun motion-sub hover:from-ref-sun/30 hover:to-ref-sun/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 min-[391px]:px-3 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoveryPublishBtnLabel: "hidden min-[391px]:inline text-meta font-semibold",
  discoverySearchInput:
    `min-w-0 flex-1 self-center border-0 bg-transparent px-2 py-2 text-small text-slate-100 placeholder:text-slate-400 caret-ref-sun focus:outline-none focus-visible:ring-0 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoverySearchBtn:
    "inline-flex shrink-0 self-center min-h-[36px] items-center justify-center rounded-full border-0 bg-ref-sun px-4 text-meta font-semibold text-[#1a1208] motion-sub hover:bg-ref-sun/92 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  discoveryFilterRow:
    "flex flex-col gap-2 border-b border-white/[0.06] px-3 py-2 max-[390px]:px-2.5",
  discoveryQuickFilterRow: "flex min-w-0 items-center gap-2",
  discoveryQuickFilterScroll:
    "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-0.5 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]",
  discoveryTypeSortRow:
    "flex min-w-0 items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-1 pr-3 [mask-image:linear-gradient(to_right,black_calc(100%-1.25rem),transparent)]",
  discoveryDestinationPillWrap: "relative shrink-0",
  discoveryDestinationSelect:
    `min-h-[36px] max-w-[8.5rem] cursor-pointer appearance-none rounded-full border border-ref-sun/25 bg-ink-900/80 pl-3 pr-7 py-1.5 text-meta font-medium text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoveryDestinationChevron:
    "pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ref-sun/75",
  discoveryQuickDestChip:
    `inline-flex shrink-0 items-center justify-center rounded-full border border-ref-sun/18 bg-ink-900/50 px-2.5 py-1 min-h-[36px] text-[0.68rem] text-slate-300 motion-sub hover:border-ref-sun/28 hover:text-ref-sun/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoveryQuickDestChipActive: "border-ref-sun/35 bg-ref-sun/10 text-ref-sun font-medium",
  discoveryFilterMoreBtn:
    `inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 bg-transparent px-2.5 py-1 min-h-[36px] text-[0.68rem] text-slate-500 motion-sub hover:border-ref-sun/22 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  discoveryPillRow: "flex min-w-max shrink-0 items-center gap-1.5",
  /** 瀑布卡 · 美团/小红书式（图大 · 底栏极简） */
  masonryCardShell:
    "group/card break-inside-avoid mb-2 overflow-hidden rounded-[var(--radius-md)] bg-ink-900/55 motion-sub transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-20px_rgba(252,164,124,0.35)]",
  masonryCardMediaFrame:
    "relative overflow-hidden rounded-[var(--radius-md)] bg-gradient-to-br from-ink-800/90 via-ink-900 to-ink-950",
  masonryCardMediaAspect: "aspect-[4/5] w-full",
  masonryCardMediaInner:
    "absolute inset-0 motion-sub transition-transform duration-300 group-hover/card:scale-[1.03]",
  masonryCardMediaShimmer:
    "pointer-events-none absolute inset-0 z-[3] animate-pulse bg-gradient-to-br from-ink-800/40 via-ref-sun/[0.04] to-ink-900/60",
  masonryCardMediaFallback:
    "pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-800/95 via-ink-900 to-ink-950 px-3 text-center",
  masonryCardMediaFallbackIcon:
    "flex h-11 w-11 items-center justify-center rounded-full border border-ref-sun/28 bg-ref-sun/10 text-ref-sun/90 shadow-[0_0_20px_-8px_rgba(252,164,124,0.4)]",
  masonryCardTitle:
    "text-[0.68rem] font-medium leading-snug text-slate-200 line-clamp-2 max-[390px]:text-[0.65rem]",
  masonryShowcaseBadge:
    "pointer-events-none absolute left-1.5 top-1.5 z-[5] rounded-full border border-ref-sun/28 bg-ref-sun/12 px-1.5 py-0.5 text-[0.55rem] font-medium text-slate-100 backdrop-blur-sm",
  masonryCardFooter:
    "mt-0.5 flex w-full items-center justify-between gap-1.5 px-0.5 pb-0.5",
  masonryCardPlayBadge:
    "pointer-events-none absolute right-1.5 top-1.5 z-[4] flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white/95 backdrop-blur-[2px] ring-1 ring-white/15",
  masonryCardPlayCenter:
    "pointer-events-none absolute left-1/2 top-1/2 z-[4] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.65)] backdrop-blur-sm",
  masonryLocationPill:
    "pointer-events-none absolute bottom-1.5 left-1.5 z-[4] flex max-w-[calc(100%-0.75rem)] items-center gap-0.5 rounded-full bg-black/60 px-2 py-0.5 text-[0.58rem] leading-tight text-white/95 backdrop-blur-sm",
  masonryLocationPillIcon: "h-2.5 w-2.5 shrink-0 text-ref-sun/90",
  masonryLocationPillName: "min-w-0 truncate font-medium",
  masonryLocationPillSep: "shrink-0 px-0.5 text-white/35",
  masonryLocationPillDistance: "shrink-0 text-white/75",
  promoMasonrySlot: "break-inside-avoid mb-2",
  promoActivityCard:
    "flex min-h-[5.5rem] gap-2 overflow-hidden rounded-[var(--radius-md)] bg-ink-900/55 p-2 motion-sub transition-[background,transform] duration-200 hover:-translate-y-0.5 hover:bg-ink-900/70 hover:shadow-[0_10px_32px_-20px_rgba(252,164,124,0.28)]",
  promoActivityThumb:
    "relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gradient-to-br from-ref-sun/25 via-ink-800 to-ink-900",
  promoActivityBody: "flex min-w-0 flex-1 flex-col justify-between py-0.5",
  promoActivityEyebrow: "mb-0.5 text-[0.58rem] font-medium text-ref-sun/80",
  promoActivityTitle: "text-[0.72rem] font-semibold leading-snug text-slate-100 line-clamp-2",
  promoActivityHint: "mt-0.5 text-[0.6rem] leading-snug text-slate-500 line-clamp-1",
  promoActivityMore: "text-[0.6rem] font-medium text-ref-sun/85",
  promoHotCard:
    "min-h-[5.5rem] overflow-hidden rounded-[var(--radius-md)] bg-ink-900/55 p-2",
  promoHotHead: "mb-1 flex items-center justify-between gap-1",
  promoHotTitle: "text-[0.72rem] font-semibold text-ref-sun/95",
  promoHotMore: "text-[0.6rem] font-medium text-slate-500 motion-sub hover:text-ref-sun/85",
  promoHotRow:
    "flex items-center gap-2 rounded-[var(--radius-sm)] py-1.5 motion-sub hover:bg-white/[0.04]",
  promoHotThumb:
    "relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gradient-to-br from-ink-700 to-ink-900",
  promoHotRankNum:
    "absolute left-0 top-0 rounded-br-[var(--radius-sm)] bg-black/60 px-1 text-[0.55rem] font-bold text-ref-sun/95",
  promoHotRowTitle: "min-w-0 truncate text-[0.68rem] font-medium text-slate-200",
  promoHotRowMeta: "truncate text-[0.56rem] text-slate-500 max-[390px]:text-[0.52rem]",
  promoDualRow: "mb-4 grid grid-cols-2 gap-3",
  promoCard:
    "relative flex min-h-[6rem] flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/70 p-3.5 shadow-scifi-card-faint ring-1 ring-ref-sun/8 motion-sub hover:border-ref-sun/32 hover:shadow-[0_12px_36px_-24px_rgba(252,164,124,0.28)]",
  promoCardAccent:
    "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/55 to-transparent",
  promoCardIcon:
    "mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-ref-sun/30 bg-ref-sun/10 text-ref-sun/90",
  promoCardTitle: "text-meta font-semibold text-ref-sun/95",
  promoCardHint: "text-micro leading-snug text-slate-400",
  promoRankBadge:
    "mr-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ref-sun/15 px-1 text-[0.6rem] font-bold text-ref-sun/90",
  masonryMediaOverlay:
    "pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-12 bg-gradient-to-t from-black/50 to-transparent",
  masonryMediaOverlayDest:
    "hidden",
  masonryMediaOverlayTag:
    "hidden",
  filterToggle:
    `flex w-full min-h-[44px] items-center justify-between gap-2 px-0 py-2 text-meta font-medium text-slate-500 motion-sub hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 md:min-h-[40px] ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  composerSearchRow: "hidden",
  composerSearchAside: "hidden shrink-0",
  filterToggleIcon: "h-4 w-4 shrink-0 text-ref-sun/90",
  filterToggleDotActive: "h-2 w-2 shrink-0 rounded-full bg-ref-sun shadow-[0_0_8px_rgba(252,164,124,0.45)]",
  /** 侧栏 · 无大底板（避免与目的地行形成「双黑框」） */
  asideShell:
    "flex w-full flex-col gap-0 border-0 bg-transparent shadow-none ring-0 overflow-visible backdrop-blur-none",
  asideRail:
    "w-full border-l border-ref-sun/14 pl-3 md:pl-4",
  asideSectionHead:
    "text-slate-400",
  asideDestList: "space-y-0",
  /** @deprecated 用 asideDestList（无内框） */
  asideDestListPanel: "space-y-0",
  asideDivider: "border-t border-ref-sun/10",
  asideToggleHover: "hover:bg-ink-800/45",
  asideGhostPill:
    "rounded-full border border-ref-sun/24 bg-ink-900/55 px-2.5 py-1 text-meta text-slate-300 hover:border-ref-sun/35 hover:text-ref-sun/90 hover:bg-ref-sun/8 motion-sub min-h-[44px] inline-flex items-center justify-center",
  asideDestRowIdle:
    "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border-0 border-l-2 border-l-transparent rounded-none",
  asideDestRowActive:
    "text-ref-sun font-medium border-0 border-l-2 border-l-ref-sun bg-ref-sun/[0.06] rounded-none",
  asideDestRowInner: "flex min-w-0 items-center gap-2",
  asideDestRowThumb:
    "relative h-8 w-8 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gradient-to-br from-ink-700 to-ink-900",
  asideDestRowMeta: "truncate text-[0.58rem] text-slate-500",
  asideAuthorRowHover: "hover:bg-ink-800/45",
  asideSuggestedHead: "px-2.5 mb-2 text-meta font-medium text-slate-200",
  asideSuggestedEmpty: "px-2.5 text-meta text-slate-400 leading-snug",
  asideFooterLink:
    "flex min-h-[44px] items-center justify-start rounded-[var(--radius-md)] px-2 py-2 text-meta text-ref-sun/85 hover:text-ref-sun hover:bg-ref-sun/8 motion-sub",
  asideAvatarFallback: "bg-ink-800 text-ref-sun/90",
  asideFollowPillFollowing: "border-ref-sun/28 bg-ink-800/55 text-slate-300",
  filterSummaryBar:
    "mb-2 flex flex-wrap items-center gap-2 px-3 py-2",
  filterSummaryShell: `${TT_COMMUNITY_FEED_PANEL_SOFT} mb-2`,
  filterClearPill:
    "rounded-full border border-ref-sun/22 bg-ink-900/50 px-2.5 py-1 text-meta text-slate-400 hover:text-slate-200 hover:border-ref-sun/28 hover:bg-ref-sun/8 motion-sub min-h-[44px] inline-flex items-center justify-center",
  filterMobileToggle: `flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2.5 text-meta font-medium text-slate-400 motion-sub hover:bg-ink-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${TT_COMMUNITY_FOCUS_RING_OFFSET} ${TT_COMMUNITY_FEED_PANEL_SOFT}`,
  retryPill:
    "rounded-full border border-ref-sun/40 bg-ref-sun/12 px-4 py-2 text-meta font-medium text-ref-sun hover:bg-ref-sun/18 motion-sub min-h-[44px] inline-flex items-center justify-center",
  publishFab:
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-ref-sun/55 bg-gradient-to-br from-ref-sun via-[#f0a878] to-ref-coral px-5 py-2 text-meta font-semibold text-[#0c0a09] shadow-[0_0_24px_-6px_rgba(252,164,124,0.38)] motion-sub hover:brightness-110",
  publishFabFocus:
    `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  secondaryLink:
    "text-meta font-medium text-ref-sun/90 hover:text-ref-sun motion-sub underline-offset-2 hover:underline",
  emptyFooterLink:
    "inline-flex min-h-[36px] items-center justify-center rounded-sm px-0.5 text-[0.7rem] leading-snug text-slate-500 hover:text-slate-300 motion-sub underline-offset-2 hover:underline",
  emptyTitle: "text-body font-medium text-slate-200 mb-2",
  emptyHint: "text-meta text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed",
  emptyPanel:
    `${TT_COMMUNITY_PAGE_L5.emptyDashed} px-6 py-10 text-center md:max-w-lg md:mx-auto md:py-10`,
  emptyIconWrap:
    "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-ref-sun/8 text-ref-sun/90",
  emptyActions: "flex flex-col items-center gap-3",
  emptyFooter:
    "flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.7rem] text-slate-600",
  /** 空态主按钮：描边暖金（全页实心渐变仅 L0 注册） */
  emptyPrimaryCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/35 bg-ref-sun/10 px-5 py-2.5 text-body font-semibold text-ref-sun motion-sub hover:bg-ref-sun/14 hover:border-ref-sun/45",
  composerPublishLabel:
    "flex-shrink-0 text-meta text-ref-sun/90 md:text-slate-500 md:font-normal",
  skeletonCard: "rounded-[var(--radius-md)] border border-ref-sun/14 bg-ink-900/55 overflow-hidden",
  composerTrigger:
    `w-full rounded-[var(--radius-lg)] border border-ref-sun/18 bg-ink-900/50 px-4 py-3 flex items-center gap-3 text-left motion-sub hover:border-ref-sun/28 hover:bg-ink-800/60 min-h-[52px] max-[390px]:min-h-[48px] max-[390px]:py-2.5 max-md:border-white/10 max-md:bg-[#0a0a0a]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  composerFormWrapMobile: "block w-full min-w-0 flex-1 max-[390px]:mb-0",
  composerAvatar:
    "flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-ref-sun/14 border border-ref-sun/35 flex items-center justify-center text-ref-sun",
  toast:
    "fixed left-1/2 z-50 w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 rounded-[var(--radius-md)] border border-ref-sun/35 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-ref-sun/95 shadow-[0_0_32px_-10px_rgba(252,164,124,0.2)] motion-sub animate-in fade-in duration-200 safe-area-toast-bottom",
  toastDivider: "mt-2 flex flex-col items-center gap-2 border-t border-ref-sun/18 pt-2",
  loginModalScrim:
    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/90 backdrop-blur-sm p-4 safe-area-inset-t safe-area-inset-b",
  loginModalSheet:
    "w-full max-w-sm rounded-[var(--radius-xl)] border border-ref-sun/28 bg-ink-900/95 shadow-[0_0_32px_-12px_rgba(252,164,124,0.16)] overflow-hidden ring-1 ring-ref-sun/12",
  activityPanelMuted:
    "rounded-[var(--radius-md)] border border-ref-sun/20 bg-ink-900/50 backdrop-blur-md",
  supportMenuItem:
    "flex min-h-[44px] w-full items-center justify-start text-left px-3 py-2 text-small text-slate-200 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/60 rounded-sm",
  supportMenuPanel:
    "min-w-[12rem] rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/98 backdrop-blur-md py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65),0_0_24px_-10px_rgba(252,164,124,0.14)] z-[320]",
  supportMenuScrim:
    "fixed inset-0 z-[310] bg-ink-950/60 backdrop-blur-[1px] motion-sub animate-in fade-in duration-150",
  supportMenuSheet:
    "fixed inset-x-0 bottom-0 z-[320] rounded-t-[var(--radius-xl)] border border-ref-sun/22 border-b-0 bg-ink-900/98 backdrop-blur-md py-2 shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.65)] safe-area-pb motion-sub animate-in slide-in-from-bottom duration-200",
  supportMenuSheetTitle:
    "px-4 pb-2 text-meta font-semibold text-slate-300 border-b border-ref-sun/12",
  orderContextShell:
    "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 backdrop-blur-md p-4 mb-4",
  orderContextShellEmbedded:
    "rounded-[var(--radius-md)] border border-ref-sun/20 bg-ink-900/50 p-3 mb-3",
  orderContextSkeletonMedia:
    "w-full sm:w-28 h-36 sm:h-20 shrink-0 rounded-[var(--radius-md)] bg-ink-800/55 border border-ref-sun/14",
  orderContextSkeletonMediaEmbedded:
    "w-full sm:w-28 h-36 sm:h-20 shrink-0 rounded-[var(--radius-md)] bg-ink-800/55 border border-ref-sun/12",
  orderContextSkeletonBar: "rounded-[var(--radius-sm)] bg-ink-700/45",
  orderContextBreakdown:
    "mt-2 rounded-[var(--radius-md)] border border-ref-sun/14 bg-ink-900/45 px-2.5 py-2",
  orderContextBreakdownEmbedded:
    "mt-2 rounded-[var(--radius-md)] border border-ref-sun/12 bg-ink-900/40 px-2.5 py-2",
  orderContextDivider: "border-t border-ref-sun/12",
  orderContextDividerEmbedded: "border-t border-ref-sun/10",
  orderContextDeepLinkDivider: "mt-2 pt-2 border-t border-ref-sun/12",
  feedCard:
    "rounded-[var(--radius-md)] border border-ref-sun/16 bg-ink-900/60 overflow-hidden shadow-[0_10px_32px_-20px_rgba(0,0,0,0.55)] motion-sub hover:border-ref-sun/24 hover:bg-ink-900/75",
  publishSubmit: `w-full rounded-[var(--radius-xl)] border border-ref-sun/45 ${TT_MARKETING_ACTION_GRADIENT_FILL} py-4 min-h-[48px] text-body font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-sub disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2`,
  publishSubmitFocus:
    `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 ${TT_COMMUNITY_FOCUS_RING_OFFSET}`,
  badgeUnread:
    "rounded-full bg-ref-coral flex items-center justify-center text-micro font-bold text-[#0c0a09]",
} as const;

/**
 * 全站主题 V1 · community 抽屉/弹层/帖卡内二级（Publish · PostDetail · Login · Report · 分享菜单）
 * 与 Feed 主路径同族暖描边；**禁止** sheet 级 cyan/fuchsia 霓虹（① · TT-PH1-219d/e）
 */
export const TT_COMMUNITY_DRAWER_L5 = {
  sheet:
    "rounded-[var(--radius-lg)] border-2 border-ref-sun/35 bg-ink-900 shadow-[0_0_32px_-12px_rgba(252,164,124,0.14)]",
  sheetHeader: "border-b border-ref-sun/22 bg-ink-800/80",
  sheetFooter: "border-t border-ref-sun/18 bg-ink-900/95",
  section: "rounded-[var(--radius-xl)] border-2 border-ref-sun/25 bg-ink-800/60",
  sectionInset: "rounded-[var(--radius-xl)] border border-ref-sun/22 bg-ink-800/40",
  /** 评论列表行 · 较 sectionInset 更轻，避免单条评论占满宽屏 */
  postDetailCommentRow: "rounded-[var(--radius-md)] border border-white/[0.08] bg-ink-800/35",
  divider: "border-t border-ref-sun/18",
  typeChipActive:
    "border-ref-sun/55 bg-ref-sun/18 text-ref-sun font-medium shadow-[0_0_12px_-4px_rgba(252,164,124,0.25)]",
  typeChipIdle:
    "border-ref-sun/22 bg-ink-900/55 text-slate-300 hover:border-ref-sun/35 hover:text-ref-sun/90",
  ghostBtnHover: "hover:border-ref-sun/40 hover:text-ref-sun",
  mediaThumb: "rounded-[var(--radius-xl)] overflow-hidden border border-ref-sun/30 bg-ink-800",
  destinationBadge:
    "rounded-full border border-ref-sun/35 bg-ref-sun/10 px-2 py-0.5 text-meta text-ref-sun/90",
  roleGuide: "rounded-full border border-ref-coral/40 bg-ref-coral/12 px-2 py-0.5 text-meta text-slate-100",
  roleTourist: "rounded-full border border-ref-sun/40 bg-ref-sun/12 px-2 py-0.5 text-meta text-slate-200",
  avatarRing: "ring-2 ring-ref-sun/30",
  authorLink: "text-meta text-ref-sun/85 hover:text-ref-sun",
  tagChip:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/24 bg-ink-900/55 px-2.5 py-1 text-meta text-slate-300 hover:border-ref-sun/40 hover:text-ref-sun",
  tagChipStatic: "rounded-full border border-ref-sun/24 bg-ink-900/55 px-2 py-0.5 text-meta text-slate-300",
  tagChipActive: "border-ref-sun/45 bg-ref-sun/14 text-ref-sun font-medium",
  feedCardMediaBorder: "border-b border-ref-sun/16",
  feedCardMediaBg: "bg-gradient-to-br from-ink-800/90 to-ink-900/90",
  feedCardMediaPlaceholder: "bg-ink-800/80",
  /** Feed 帖卡媒体区类型角标（暖描边 · 非 cyan） */
  feedCardTypeBadge:
    "rounded-full border border-ref-sun/35 bg-ink-900/85 px-2 py-0.5 text-meta text-ref-sun/90",
  /** Feed 帖卡媒体区 focus-visible（与 `communityPublishFabFocus` 同族 ref-sun） */
  feedCardMediaFocus:
    "outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  feedCardCarouselDotActive: "w-4 bg-ref-sun",
  feedCardCarouselDotIdle: "w-1.5 bg-white/50",
  feedCardActionsRow: "border-t border-ref-sun/16",
  followPillFollowing: "border-ref-sun/32 bg-ink-800/70 text-slate-100",
  /** 帖卡/抽屉内「关注」未关注态（暖描边 · 非 Tab 激活实心） */
  followPillIdle:
    "rounded-full border border-ref-sun/45 bg-ref-sun/14 text-slate-100 hover:text-white hover:bg-ref-sun/18 motion-sub",
  /** 评论排序 Tab 激活（抽屉内 · 与 Feed sortChip 同族实心暖金） */
  sortTabActive: `rounded-full border border-transparent px-3 py-1.5 text-meta motion-sub min-h-[44px] inline-flex items-center justify-center ${TT_MARKETING_ACTION_CHIP_TAB_ACTIVE}`,
  sortTabIdle:
    "rounded-full border border-ref-sun/22 bg-ink-800/60 px-3 py-1.5 text-meta text-slate-200 hover:border-ref-sun/30 hover:text-ref-sun/90 motion-sub min-h-[44px] inline-flex items-center justify-center",
  sortTabIdleMuted:
    "rounded-full border border-slate-600 bg-ink-800/60 px-3 py-1.5 text-meta text-slate-300 hover:border-ref-sun/30 hover:text-slate-300 motion-sub min-h-[44px] inline-flex items-center justify-center",
  archivedBadge: "rounded-full border border-ref-sun/22 bg-ink-900/55 px-2 py-0.5 text-meta text-slate-300",
  avatarFallback: "h-full w-full bg-ink-700",
  sendBtn: `rounded-[var(--radius-xl)] border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2.5 text-meta font-semibold text-[#0c0a09] hover:brightness-110 motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-50 disabled:brightness-[0.72] disabled:saturate-75 disabled:cursor-not-allowed shrink-0`,
  composerInput:
    "border-ref-sun/35 bg-ink-900/80 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  composerInputShowcase:
    "border-ref-sun/22 focus-visible:ring-ref-sun/40",
  menuPanel:
    "rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/95 backdrop-blur py-1 shadow-medium z-10",
  menuItemHover: "hover:bg-ref-sun/12 focus-visible:ring-ref-sun/45",
  shareBanner: "rounded-[var(--radius-md)] border border-ref-sun/30 bg-ref-sun/10",
  shareBannerText: "text-small text-ref-sun/95",
  activeRowAccent: "border-l-[3px] border-ref-coral/70",
  unreadCount: "rounded-full bg-ref-coral px-2 py-0.5 text-meta text-[#0c0a09]",
  collectedAccent: "text-ref-coral",
  topicHeroFrame: "rounded-[var(--radius-xl)] border border-ref-sun/30 bg-ink-900/70 backdrop-blur-md shadow-[0_0_24px_-10px_rgba(252,164,124,0.12)]",
  topicHeroTitle: TT_MARKETING_ACTION_TITLE_GRADIENT,
  overlayVideoFrame: "rounded-[var(--radius-md)] border border-ref-sun/32 bg-black overflow-hidden",
  accentRadio: "accent-ref-sun",
  publishScrim:
    "absolute inset-0 top-0 bottom-20 bg-ink-950/85 backdrop-blur-sm md:bottom-0 md:top-12",
  publishFieldSection: "rounded-[var(--radius-xl)] border bg-ink-800/40 px-4 py-4",
  publishFieldBorderOk: "border-ref-sun/22",
  publishFieldBorderInput: "border-ref-sun/24 focus-visible:ring-ref-sun/50 focus:border-ref-sun/40",
  publishTextarea:
    "w-full rounded-[var(--radius-md)] border bg-ink-900/80 px-3 py-3 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 resize-none min-h-[120px] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  publishInput:
    "w-full rounded-[var(--radius-md)] border border-ref-sun/24 bg-ink-900/80 px-3 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  publishFooter:
    "flex shrink-0 border-t border-ref-sun/18 bg-ink-800/80 px-4 py-4 safe-area-inset-b",
  publishDashedTile:
    "border-2 border-dashed border-ref-sun/28 bg-ink-700/30 hover:border-ref-sun/45 hover:bg-ink-600/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-ref-sun focus-within:ring-offset-2 focus-within:ring-offset-[#14100d] motion-sub gap-0.5",
  publishDashedTileFocus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  publishGhostBtn:
    "rounded-[var(--radius-md)] border border-ref-sun/24 bg-ink-800/80 px-3 text-meta text-slate-300 hover:border-ref-sun/40 hover:text-ref-sun/95 motion-sub min-h-[44px] inline-flex items-center justify-center",
  publishCloseBtn:
    "flex shrink-0 items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-ref-sun/24 bg-ink-800 text-slate-300 hover:bg-ink-700 hover:text-white motion-sub",
  publishSaveDraftBtn:
    "flex items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-ref-sun/40 bg-ink-800 px-3 sm:px-4 py-2 min-h-[44px] text-body font-medium text-ref-sun hover:text-ref-sun/95 hover:bg-ink-700 motion-sub",
  publishMediaThumb: "border border-ref-sun/30 bg-ink-800",
  publishTextBanner: "rounded-[var(--radius-xl)] border border-ref-sun/22 bg-ink-800/40 px-4 py-3",
  publishTypeChipDisabled:
    "border-ref-sun/14 bg-ink-800/25 text-slate-500 cursor-not-allowed opacity-60",
  publishTypeChipIdleAlt:
    "border-ref-sun/22 bg-ink-700/40 text-slate-300 hover:text-ref-sun/90 hover:border-ref-sun/32",
  feedInlineAlert:
    "mb-4 rounded-[var(--radius-md)] border border-ref-sun/20 bg-ink-900/50 px-4 py-3 text-small text-slate-200",
  feedInlineAlertSoft:
    "mb-4 rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 px-4 py-3 space-y-3",
  feedScrollTopFab:
    "pointer-events-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-ref-sun/22 bg-ink-900/90 backdrop-blur px-4 py-2 text-meta text-slate-300 hover:bg-ink-800/90 motion-sub",
  postDetailOverlay:
    "fixed inset-0 z-[320] flex items-end md:items-center justify-center overflow-hidden bg-black/78 backdrop-blur-sm p-0 md:p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
  postDetailShell:
    "relative mx-auto flex h-full w-full max-w-[min(1080px,96vw)] flex-col min-h-0 overflow-hidden max-md:min-h-[min(92dvh,100%)] max-md:max-h-[min(94dvh,100%)] max-md:rounded-t-[1.25rem] max-md:bg-ink-950/98 max-md:shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.55)] md:max-h-[min(88vh,820px)] md:rounded-[1.25rem] md:bg-ink-950 md:shadow-[0_24px_80px_-28px_rgba(0,0,0,0.92)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
  postDetailCloseFab:
    "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-white/8 text-slate-200 hover:bg-white/14 hover:text-white motion-sub backdrop-blur-sm",
  postDetailMediaCloseFab:
    "absolute right-3 top-3 z-20 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75 motion-sub backdrop-blur-sm md:hidden",
  postDetailMobileHandle:
    "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden",
  postDetailTextNoteHero:
    "relative min-h-[min(42vh,360px)] shrink-0 bg-gradient-to-br from-ink-900 via-ink-950 to-[#0a0a0a] px-5 py-8 sm:px-8",
  postDetailTextNoteBody:
    "text-body sm:text-h4 font-medium leading-relaxed text-slate-100 whitespace-pre-wrap",
  postDetailTextNoteTags: "mt-4 flex flex-wrap gap-2",
  postDetailAuthorCompact:
    "flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 py-0.5 motion-sub hover:text-ref-sun/95 rounded-sm",
  postDetailAuthorAvatar:
    "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-ref-sun/30 bg-ink-800 text-meta font-medium text-ref-sun/90",
  postDetailGhostBtn:
    "flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-ref-sun/24 bg-ink-800/80 px-3 py-2 text-meta text-slate-300 hover:border-ref-sun/40 hover:text-ref-sun/95 motion-sub shrink-0 min-h-[44px]",
  postDetailSelect:
    "inline-flex max-w-[7.5rem] min-h-[44px] items-center justify-start sm:max-w-none rounded-[var(--radius-md)] border border-ref-sun/24 bg-ink-900/80 px-2 py-2 text-meta text-slate-200 disabled:opacity-50",
  postDetailTypeBadge:
    "pointer-events-none inline-block rounded-full border border-ref-sun/40 bg-ink-900/80 px-2.5 py-0.5 text-meta text-ref-sun",
  postDetailMediaStage:
    "relative flex flex-1 min-h-0 w-full min-h-[min(36vh,360px)] touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-inset select-none bg-black overflow-hidden max-md:rounded-t-[1.25rem] md:min-h-0 md:rounded-l-[1.25rem]",
  postDetailMediaColumn:
    "relative flex min-h-[min(36vh,360px)] shrink-0 flex-col overflow-hidden max-md:rounded-t-[1.25rem] md:min-h-0 md:h-auto md:max-h-[min(88vh,820px)] md:w-[min(62%,680px)] md:shrink-0 md:rounded-l-[1.25rem] bg-black",
  postDetailBodySplit:
    "flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row",
  postDetailSideColumn:
    "flex min-h-0 flex-1 flex-col bg-ink-950 md:max-w-[440px] md:rounded-r-[1.25rem] md:border-l md:border-white/[0.06]",
  postDetailSideScroll:
    "flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]",
  postDetailSideMetaBlock: "shrink-0",
  postDetailSectionDivider: "border-t border-white/[0.06]",
  postDetailRoleBadge: "shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-meta text-slate-200",
  postDetailShowcaseHint:
    "rounded-[var(--radius-md)] border border-ref-sun/30 bg-ref-sun/12 px-3 py-2 text-small leading-snug text-slate-100",
  postDetailShowcaseBadge:
    "shrink-0 rounded-full border border-ref-sun/28 bg-ref-sun/12 px-2 py-0.5 text-meta font-medium text-slate-100",
  postDetailActionBarShowcaseHint:
    "w-full basis-full rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 px-2.5 py-1.5 text-meta leading-snug text-ref-sun/75",
  postDetailBookGuideChip:
    "inline-flex min-h-[32px] shrink-0 items-center rounded-full border border-ref-sun/35 bg-ref-sun/12 px-3 py-1 text-meta font-medium text-ref-sun hover:bg-ref-sun/18 hover:text-ref-sun motion-sub",
  postDetailDestinationChip:
    "inline-flex min-h-[32px] items-center rounded-full bg-ref-sun/10 px-2.5 py-0.5 text-meta text-ref-sun/90",
  postDetailLightboxOverlay:
    "fixed inset-0 z-[340] flex items-center justify-center bg-black/96 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
  postDetailLightboxCloseFab:
    "absolute right-4 top-4 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/18 motion-sub backdrop-blur-sm",
  postDetailHeaderBar:
    "flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-ink-950/98 px-4 py-3 safe-area-inset-t min-h-[48px] backdrop-blur-sm",
  postDetailReplyBanner: "mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-white/[0.06] px-3 py-2",
  /** @deprecated use postDetailSideColumn */
  postDetailCommentsColumn: "flex min-h-0 flex-1 flex-col md:border-l md:border-white/[0.06]",
  postDetailActionBar:
    "flex flex-wrap items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5",
  postDetailMetaBody: "text-body text-slate-200 whitespace-pre-wrap leading-relaxed",
  postDetailTagChipCompact:
    "inline-flex min-h-[32px] items-center rounded-full bg-white/[0.06] px-2.5 py-0.5 text-meta text-slate-300 visited:text-slate-300 hover:bg-white/10 hover:text-ref-sun/90 motion-sub",
  postDetailActionBtn:
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-meta font-medium motion-sub",
  postDetailThumbStrip:
    "flex shrink-0 items-center justify-center gap-1.5 border-t border-white/10 bg-black/80 px-3 py-2",
  postDetailThumbBtn:
    "relative h-11 w-11 shrink-0 overflow-hidden rounded-md border-2 border-transparent motion-sub hover:border-ref-sun/50 focus:outline-none focus-visible:border-ref-sun",
  postDetailThumbBtnActive: "border-ref-sun/75 ring-1 ring-ref-sun/40",
  postDetailScrollPane: "flex-1 min-h-0 overflow-y-auto overscroll-contain",
  postDetailComposerBar:
    "sticky bottom-0 z-[2] flex shrink-0 flex-col border-t border-white/[0.06] bg-ink-950/98 p-4 safe-area-inset-b backdrop-blur-sm",
  postDetailComposerInput:
    "flex-1 min-w-0 rounded-[var(--radius-xl)] border border-white/14 bg-ink-900/92 px-4 py-2.5 text-small text-slate-100 placeholder:text-slate-300/90 focus:outline-none focus-visible:ring-2 disabled:opacity-55 disabled:cursor-not-allowed focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  postDetailIconBtn:
    "flex items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/24 bg-ink-800/80 min-h-[44px] min-w-[44px] text-meta text-slate-300 hover:text-ref-sun/95 motion-sub",
  postDetailCarouselNav:
    "rounded-full bg-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
  postDetailImageCounter:
    "pointer-events-none absolute left-3 top-3 z-[6] rounded-full bg-black/50 px-2.5 py-1 text-meta tabular-nums text-white/90 backdrop-blur-sm",
  postDetailVideoFeedCounter:
    "pointer-events-none absolute right-3 top-3 z-[6] max-w-[min(72%,14rem)] truncate rounded-full bg-black/50 px-2.5 py-1 text-meta tabular-nums text-white/85 backdrop-blur-sm",
  postDetailFeedNavHint:
    "pointer-events-none absolute left-1/2 bottom-3 z-[6] -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-meta text-white/80 backdrop-blur-sm",
  postDetailVideoFeedNav:
    "absolute left-3 z-[6] rounded-full bg-black/45 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d] disabled:opacity-35 motion-sub",
  postDetailVideoMutedHint:
    "pointer-events-auto absolute left-3 bottom-16 z-[5] rounded-full bg-black/55 px-3 py-1.5 text-meta text-white/90 backdrop-blur-sm motion-sub hover:bg-black/70",
  postDetailCarouselSlide:
    "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-out",
  reportOverlay:
    "fixed inset-0 z-[90] flex flex-col items-stretch justify-end bg-ink-950/75 sm:items-center sm:justify-center sm:bg-black/70 sm:p-4",
  reportSheet:
    "flex max-h-[min(92dvh,640px)] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-ref-sun/16 bg-ink-950 shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.65)] sm:max-w-lg sm:rounded-[var(--radius-xl)]",
  reportSheetScroll: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(252,164,124,0.28)_transparent]",
  reportSheetFooter:
    "sticky bottom-0 shrink-0 border-t border-ref-sun/18 bg-ink-950/98 px-4 py-3 flex gap-3 justify-end safe-area-pb backdrop-blur-sm",
  reportReasonRow:
    "flex min-h-[44px] items-center justify-start gap-2 rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/60 px-3 py-2.5 text-small text-slate-200 cursor-pointer focus-within:ring-2 focus-within:ring-ref-sun",
  meQuickFab:
    "fixed right-2 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-ref-sun/28 bg-ink-900/88 text-ref-sun shadow-[0_0_24px_-10px_rgba(252,164,124,0.18)] backdrop-blur-md motion-sub hover:bg-ref-sun/10 hover:text-ref-sun bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-7",
  meQuickPanel:
    "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-ref-sun/25 bg-ink-900/75 shadow-[0_0_32px_-12px_rgba(252,164,124,0.14)] backdrop-blur-md",
  meQuickPanelHeader: "flex shrink-0 items-center justify-between gap-2 border-b border-ref-sun/16 px-2.5 py-2",
  meQuickCloseBtn:
    "shrink-0 rounded-full border border-ref-sun/24 bg-ink-800/80 px-2.5 py-1.5 text-meta text-slate-200 hover:bg-ref-sun/10 hover:text-ref-sun min-h-[40px] min-w-[40px]",
  meQuickAccordionBtn:
    "flex w-full min-h-[40px] items-center justify-start gap-2 px-2.5 py-2 text-left text-meta font-medium text-ref-sun hover:bg-ink-800/55 hover:text-ref-sun/95 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d]",
} as const;

/** marketDark premium · L5 面板（与 TT 社区 Feed 面板同族数值 · 仅 market/did-rank 消费） */
export const TT_MARKETING_DARK_ROUTE_PANEL_L5 =
  "rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-800/70 backdrop-blur-md shadow-[0_12px_40px_-28px_rgba(0,0,0,0.48)] ring-1 ring-ref-sun/12 overflow-hidden";

export const TT_MARKETING_DARK_ROUTE_PANEL_SOFT =
  "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-800/55 backdrop-blur-md";

/** market/did-rank · 列表卡片（轻描边 · 无 ring/光晕 hover） */
export const TT_MARKETING_DARK_ROUTE_CARD_SURFACE =
  "group rounded-[var(--radius-md)] border border-ref-sun/12 bg-ink-800/50 backdrop-blur-sm overflow-hidden motion-sub transition-[background-color,border-color] hover:border-ref-sun/18 hover:bg-ink-800/56 motion-reduce:hover:bg-ink-800/50";

export const TT_MARKETING_DARK_ROUTE_CARD_MEDIA_DIVIDER =
  "border-b border-ref-sun/10";

/** 全站主题 V1 · `/market*` 子站/列表主路径（筛选带、内链、玻璃卡描边） */
export const TT_MARKETING_MARKET_DARK_PATH = {
  filterBandLabel: "text-small font-semibold uppercase tracking-wide text-ref-sun/90",
  inlineLinkUnderline:
    "font-medium text-ref-sun/90 underline decoration-ref-sun/40 underline-offset-4 transition-colors motion-reduce:transition-none hover:text-ref-sun",
  glassPanelRing: "ring-1 ring-ref-sun/15",
  guideCardDark: TT_MARKETING_DARK_ROUTE_CARD_SURFACE,
  orderCardDark: TT_MARKETING_DARK_ROUTE_CARD_SURFACE,
  cardMediaArea:
    `relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-ink-800/95 via-ink-900/92 to-[#0c0a09] ${TT_MARKETING_DARK_ROUTE_CARD_MEDIA_DIVIDER}`,
  cardMediaAreaCompact:
    `relative aspect-[5/2] max-h-[7.5rem] overflow-hidden bg-gradient-to-br from-ink-800/90 via-ink-900/92 to-[#0c0a09] ${TT_MARKETING_DARK_ROUTE_CARD_MEDIA_DIVIDER}`,
  cardInteractive:
    "cursor-pointer focus-within:outline-none focus-within-visible:ring-2 focus-within-visible:ring-ref-sun/55 focus-within-visible:ring-offset-2 focus-within-visible:ring-offset-[#0a0a0a]",
  cardCoverScrim:
    "pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/88 via-[#0a0a0a]/20 to-transparent",
  cardCoverChip:
    "inline-flex items-center rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ink-900/70 px-2 py-0.5 text-meta font-semibold text-ref-sun backdrop-blur-sm [color:var(--ref-sun)] shadow-[0_2px_8px_-6px_rgba(0,0,0,0.55)]",
  /** 列表/抽屉 · Escrow 短角标（暖金 · 非 success 绿） */
  trustEscrowBadge:
    "inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ink-900/60 px-2 py-0.5 text-meta font-medium text-ref-sun/95 backdrop-blur-sm shadow-[0_2px_8px_-6px_rgba(0,0,0,0.5)]",
  /** 深色底 · USDC/结算 pill */
  trustTokenPill:
    "inline-flex items-center gap-1 rounded-full border border-ref-sun/26 bg-ink-900/70 px-2 py-0.5 text-meta font-medium text-ref-sun shadow-[inset_0_0_0_1px_rgba(249,215,121,0.08)]",
  /** 向导 · DID 已验证（深底 + 暖金字 · 避免金底金字「空框」） */
  trustDidVerified:
    "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ink-900/65 px-2 py-0.5 text-meta font-medium text-ref-sun",
  drawerAccordionToggle:
    "w-full flex min-h-[44px] items-center justify-between gap-2 border-0 border-b border-ref-sun/14 bg-transparent px-0 py-2.5 text-left text-small font-medium text-slate-100 hover:text-ref-sun/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  drawerSummaryStrip:
    "rounded-[var(--radius-sm)] border border-ref-sun/20 bg-ink-900/55 px-3 py-2.5 ring-1 ring-inset ring-ref-sun/10",
  drawerHintText: "text-meta text-slate-300/90 leading-snug",
  cardCoverPlaceholderTitle:
    "text-h4 font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] line-clamp-2",
  cardDetailsToggle:
    "inline-flex min-h-[44px] items-center text-meta font-medium text-ref-sun/75 hover:text-ref-sun underline-offset-2 hover:underline rounded-[var(--radius-sm)] px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  marketFilterMoreToggle:
    "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-ref-sun/26 bg-ink-900/45 px-3 py-1 text-small font-medium text-ref-sun backdrop-blur-sm transition-[background-color,border-color] motion-reduce:transition-none hover:border-ref-sun/38 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] [color:var(--ref-sun)]",
  marketFilterAdvancedBadge:
    "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-ref-sun/16 px-1.5 py-px text-meta font-semibold leading-none text-ref-sun tabular-nums [color:var(--ref-sun)]",
  marketFilterChevron:
    "h-3.5 w-3.5 shrink-0 text-ref-sun/85 transition-transform motion-reduce:transition-none",
  cardMediaPlaceholder:
    "w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-800/88 via-ink-900/95 to-[#0c0a09]",
  cardMediaAvatarFallback:
    "w-20 h-20 rounded-full flex items-center justify-center text-h3 font-semibold bg-ref-sun/16 text-ref-sun border border-ref-sun/32 shadow-[0_0_20px_-8px_rgba(252,164,124,0.35)]",
  cardContentDivider: "border-t border-ref-sun/12",
  cardBodyPadding: "p-4 space-y-3 bg-transparent backdrop-blur-sm",
  cardDetailList: "mb-2",
  cardActionRow: "pt-2",
  cardTagChip:
    "tt-market-guide-tag inline-flex items-center rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ink-900/55 px-2 py-0.5 text-meta font-medium text-ref-sun [color:var(--ref-sun)]",
  /** 向导卡 · 无 hourly_rate 时的「时薪面议」 */
  cardHourlyOnRequest:
    "tt-market-guide-hourly-note text-meta font-medium text-ref-sun/88 [color:var(--ref-sun)]",
  /** 订单/向导卡 · 次要文字 CTA（须压过浏览器 `button` 默认黑字） */
  cardSecondaryBtn:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-2 py-1.5 text-small font-semibold text-ref-sun underline decoration-ref-sun/45 underline-offset-[5px] bg-transparent border-0 hover:text-ref-sun hover:decoration-ref-coral/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] [color:var(--ref-sun)]",
  /** 与 `cardSecondaryBtn` 同源；订单/向导卡 L5 描边次 CTA（机读 / 契约 · 非下划线链） */
  cardViewItineraryLink:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/45 px-3 py-1.5 text-small font-semibold text-ref-sun bg-transparent hover:bg-ref-sun/10 hover:border-ref-sun/60 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] [color:var(--ref-sun)]",
  cardFavBtn:
    "inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-ink-900/55 backdrop-blur-sm shadow-[0_0_16px_-6px_rgba(252,164,124,0.2)] hover:bg-ref-sun/12 transition-colors border border-ref-sun/28 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  cardPayHubBtn:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-2 py-1.5 text-meta font-medium text-ref-sun/75 bg-transparent border-0 hover:text-ref-sun hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  emptyStateDark:
    "rounded-[var(--radius-md)] border border-dashed border-ref-sun/28 bg-ink-900/40 backdrop-blur-md p-8 text-center",
  guidesColumnMoreHint:
    "tt-market-guides-more-hint mt-4 rounded-[var(--radius-md)] border border-dashed border-ref-sun/28 bg-ink-900/40 px-4 py-6 text-center text-meta leading-relaxed text-[#c9c2bc]/95 [color:#c9c2bc]",
  emptyCrossNavLink:
    "inline-flex min-h-[44px] items-center justify-center text-ref-sun/85 hover:text-ref-sun hover:underline underline-offset-2 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  /** `EmptyState` 浅色面板（`darkBg` 未设）次要链 — 225-E · D7 */
  emptyStateLightCrossNavLink:
    "inline-flex min-h-[44px] items-center justify-center text-ref-sun/90 hover:text-ref-sun hover:underline underline-offset-2 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-soft",
  emptyCrossNavSep: "text-ref-sun/35",
  masonryCtaLink:
    "inline-flex min-h-[44px] items-center justify-start px-0 py-1 text-small font-semibold text-ref-sun underline decoration-ref-sun/45 underline-offset-[5px] bg-transparent border-0 transition-colors motion-reduce:transition-none group-hover:text-ref-sun group-hover:decoration-ref-coral/50 [color:var(--ref-sun)]",
  footerLink: "text-slate-300/95 underline decoration-ref-sun/25 underline-offset-4 hover:text-ref-sun",
  marketFooterNavText: "text-meta text-slate-300/95",
  studioClearLink: "text-meta text-ref-sun/90 underline hover:text-ref-sun",
  studioHintBanner: "rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-3 py-2 text-meta text-ref-sun/90",
  /** Escrow 深链绑定向导 · 状态横幅（深底可读 · 非 ink-900） */
  bindGuideBanner:
    "w-full max-w-4xl rounded-[var(--radius-lg)] border border-ref-sun/28 bg-gradient-to-b from-slate-950/78 via-[#12100e]/90 to-[#0a0a0a]/95 backdrop-blur-md px-4 py-3.5 sm:px-5 sm:py-4 ring-1 ring-inset ring-white/[0.06]",
  bindGuideBannerTitle:
    "m-0 text-body font-semibold text-white tracking-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]",
  bindGuideBannerSub: "m-0 mt-2 text-small text-[#e8ddd4]/95 leading-relaxed",
  bindGuideBannerCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/38 bg-slate-950/40 px-4 py-2.5 text-small font-medium text-white shadow-[0_4px_20px_rgba(15,23,42,0.32)] backdrop-blur-md transition hover:border-ref-sun/55 hover:bg-ref-sun/12 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  drawerAccentHeading: "text-body font-semibold text-ref-sun/90",
  drawerFocusRing: "focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  drawerCloseFocus:
    "focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  drawerControlFocus:
    "focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  drawerHeroRing: "ring-1 ring-ref-sun/18 border-y border-ref-sun/12 border-x-0",
  drawerSectionAccent: "text-small font-semibold uppercase tracking-wide text-ref-sun/90",
  drawerAccentLink:
    "border border-ref-sun/32 bg-ref-sun/10 text-ref-sun/95 hover:bg-ref-sun/16 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  drawerAvatarFallback: "text-ref-sun/90",
  glassSelectTrigger:
    "w-full rounded-[var(--radius-sm)] border border-ref-sun/26 bg-ink-900/80 px-3 py-2 text-small text-white placeholder-white/50 focus:outline-none focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 flex items-center justify-between gap-2 text-left",
  glassSelectPanel:
    "absolute left-0 right-0 top-full z-[340] mt-1 max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-ref-sun/22 bg-ink-900/95 backdrop-blur-sm shadow-strong py-1",
  glassSelectOptionSelected: "bg-ref-sun/22 text-ref-sun",
  filterBarGlass: "sticky top-0 z-10 border-0 bg-transparent py-2.5 px-3 sm:px-4 sm:py-3",
  filterChipFocusGlass:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  filterChipActiveGlass:
    "bg-ref-sun/12 border-ref-sun/36 text-ref-sun ring-0 shadow-[inset_0_0_0_1px_rgba(249,215,121,0.1)] [color:var(--ref-sun)]",
  filterChipIdleGlass:
    "bg-ink-900/50 border-ref-sun/18 text-slate-100/90 hover:bg-ref-sun/8 hover:border-ref-sun/28 hover:text-slate-50 [color:#f1f5f9]",
  filterChipTextGlass: "text-small font-medium",
  filterRowGrid: "grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1",
  filterRowLabelGlass: "shrink-0 pt-1.5 text-small font-medium text-slate-200/95 [color:#e2e8f0]",
  filterLabelGlass: "text-small font-medium text-slate-200/95 [color:#e2e8f0]",
  filterSectionGlass: "text-small font-normal text-slate-400/92 [color:#94a3b8]",
  filterGuidePanelGlass:
    "space-y-3 rounded-[var(--radius-md)] border border-ref-sun/12 bg-ink-900/28 px-3 py-3 sm:px-3.5",
  filterGuideSectionTitleGlass: "text-small font-semibold tracking-wide text-slate-100/95 [color:#f1f5f9]",
  filterHintGlass:
    "border-l-2 border-ref-sun/18 pl-2.5 text-meta leading-relaxed text-slate-400/90 [color:#94a3b8]",
  filterPlaceholderGlass:
    "inline-flex items-center rounded-[var(--radius-sm)] border border-dashed border-ref-sun/16 bg-ink-900/22 px-2.5 py-1 text-small text-slate-400/90 [color:#94a3b8]",
  filterSummaryFilterLine: "text-small leading-snug text-slate-400/92 [color:#94a3b8]",
  filterSummaryListLine: "text-meta font-normal leading-snug text-slate-300/88 [color:#cbd5e1]",
  filterSummaryBypassHint: "text-meta leading-snug text-ref-sun/90 [color:var(--ref-sun)]",
  filterBandTitle: "text-small font-semibold text-slate-100/95 [color:#f1f5f9]",
  glassModalScrim: "fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 backdrop-blur-sm p-4",
  glassModalPanel:
    "w-full max-w-md rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-900/88 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(252,164,124,0.18)] p-6 text-slate-100 ring-1 ring-ref-sun/14",
  glassModalDismissLink:
    "w-full text-meta text-slate-400 hover:text-ref-sun/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded-[var(--radius-sm)]",
  heroFrameDefault:
    "border-0 bg-transparent shadow-none ring-0 backdrop-blur-none",
  heroFrameDefaultWash:
    "bg-[radial-gradient(ellipse_90%_75%_at_50%_-30%,rgba(249,215,121,0.2),transparent_52%),radial-gradient(ellipse_70%_55%_at_8%_40%,rgba(252,164,124,0.16),transparent_50%),radial-gradient(circle_at_95%_35%,rgba(252,164,124,0.08),transparent_42%)]",
  heroFrameSubsite:
    "border border-ref-sun/18 bg-ink-900/55 shadow-[0_20px_56px_-28px_rgba(0,0,0,0.55)] ring-1 ring-ref-sun/10",
  heroFrameSubsiteWash:
    "bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(252,164,124,0.1),transparent_52%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(20,16,13,0.45),transparent_45%)]",
  subsiteFooterStrip: "mx-auto max-w-5xl border-t border-ref-sun/14 px-4 pb-12 pt-6",
  subsiteFooterCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/26 bg-ink-900/55 px-5 py-2.5 text-small font-medium text-slate-100 hover:bg-ref-sun/10 hover:text-ref-sun",
  drawerAvatarRing: "ring-1 ring-ref-sun/22",
  drawerAvatarBg: "bg-ref-sun/12 text-ref-sun",
  drawerTagChip: "rounded-[var(--radius-sm)] border border-ref-sun/18 bg-ink-900/55 text-slate-100 px-2 py-0.5 text-small",
  studioModalPanelLg:
    "relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-ref-sun/28 bg-ink-900/88 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(252,164,124,0.18)] overflow-hidden max-h-[90vh] flex flex-col ring-1 ring-ref-sun/14",
  studioModalHeader:
    "border-b border-ref-sun/16 px-4 py-3 sm:px-6 shrink-0 flex items-start justify-between gap-3",
  studioCloseBtn:
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-ref-sun/24 bg-ink-800/80 text-slate-200 hover:bg-ref-sun/12 hover:text-ref-sun motion-sub",
  studioInput:
    "w-full rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ink-900/80 px-3 py-2 text-small text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] backdrop-blur-sm",
  studioSectionHeading: "text-small font-semibold uppercase tracking-wide text-ref-sun/90",
  studioInsetPanel: "rounded-[var(--radius-sm)] border border-ref-sun/18 bg-ink-900/45 p-3 space-y-3",
  studioChipActive: "border-ref-sun/45 bg-ref-sun/14 text-ref-sun font-medium",
  studioChipIdle:
    "border-ref-sun/22 bg-ink-900/55 text-slate-200 hover:bg-ref-sun/10 hover:border-ref-sun/32",
  studioMediaBtn:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/26 bg-ink-800/70 px-4 py-2 text-small font-medium text-slate-100 hover:bg-ref-sun/10 hover:border-ref-sun/35",
  studioFooter: "shrink-0 border-t border-ref-sun/16 bg-ink-900/55",
  studioFooterGhost:
    "w-full sm:w-auto rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ink-900/50 px-4 py-2.5 text-small font-medium text-slate-200 hover:bg-ref-sun/10",
  studioImageFrame: "max-h-48 w-full rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-950/60 object-contain",
  studioCheckbox: "mt-1 rounded border-ref-sun/30 text-ref-sun bg-ink-900/80",
  studioLabel: "block text-small font-medium text-slate-200 mb-1",
  studioDesc: "text-small text-slate-300/95 mt-0.5",
  studioEscrowSection: "rounded-[var(--radius-md)] border border-ref-sun/16 bg-ink-900/40 p-4 space-y-3",
  studioPublishDisabled: "cursor-not-allowed border-ref-sun/12 bg-ink-900/40 text-slate-500",
  customItineraryPillSelected:
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border transition-colors border-ref-sun/45 bg-ref-sun/14 text-ref-sun",
  customItineraryPillIdle:
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-1.5 text-meta font-medium border transition-colors border-ref-sun/22 bg-ink-900/55 text-slate-200 hover:bg-ref-sun/10 hover:border-ref-sun/32 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  subsiteTagPill: "rounded-full border border-ref-sun/22 bg-ref-sun/10 px-3 py-1 text-meta text-slate-100/95",
  subsiteHeroMedia:
    "relative mt-6 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border border-ref-sun/18 ring-1 ring-ref-sun/14",
  subsiteHeroMediaWarning:
    "relative mt-6 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border border-ref-sun/18 ring-1 ring-warning/15",
  subsiteHighlightPanel:
    `mt-8 p-5 ${TT_MARKETING_DARK_ROUTE_PANEL_L5}`,
  subsiteEscrowPanel:
    `mt-8 p-5 ${TT_MARKETING_DARK_ROUTE_PANEL_L5}`,
  subsitePrimaryCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/45 bg-ref-sun/14 px-5 py-2.5 text-small font-semibold text-slate-100 transition-colors motion-reduce:transition-none hover:bg-ref-sun/22",
  subsiteGhostCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/26 bg-ink-900/55 px-5 py-2.5 text-small font-medium text-slate-200 transition-colors motion-reduce:transition-none hover:bg-ref-sun/10",
  subsiteFilterPillBase:
    "shrink-0 rounded-[var(--radius-sm)] border px-3 py-2 text-small font-semibold text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  subsiteFilterPillActive:
    "border-ref-sun/45 bg-ref-sun/16 text-ref-sun shadow-[0_0_12px_-4px_rgba(252,164,124,0.2)]",
  subsiteFilterPillIdle:
    "border-ref-sun/22 bg-ink-900/55 text-slate-200 hover:border-ref-sun/35 hover:bg-ref-sun/10",
  masonryCard:
    "overflow-hidden rounded-[var(--radius-lg)] border border-ref-sun/18 bg-ink-900/55 shadow-[0_0_24px_-8px_rgba(252,164,124,0.12)] backdrop-blur-md ring-1 ring-ref-sun/12 transition hover:border-ref-sun/32 hover:ring-ref-sun/22 motion-reduce:transition-none motion-reduce:hover:border-ref-sun/18 motion-reduce:hover:ring-ref-sun/12",
  masonryCardFocus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  studioMediaPreviewFrame:
    "relative w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] border border-ref-sun/16 bg-ink-950/60 aspect-[4/3]",
  marketSortPillBase:
    "rounded-full px-3 py-1.5 text-meta font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  marketSortPillActive:
    "bg-ref-sun/10 border-ref-sun/28 text-ref-sun ring-0 shadow-none [color:var(--ref-sun)]",
  marketSortPillIdle:
    "bg-ink-900/55 border-ref-sun/22 text-slate-200 hover:bg-ref-sun/10 hover:border-ref-sun/32",
  marketGlassInsetPanel: "rounded-[var(--radius-md)] p-4 sm:p-5",
  marketGlassInsetPanelShowcase:
    "mb-6 rounded-[var(--radius-lg)] border border-ref-sun/18 bg-ink-900/42 backdrop-blur-md backdrop-saturate-150 p-4 ring-1 ring-ref-sun/12",
  marketApiErrorPanel:
    "rounded-[var(--radius-lg)] border border-warning/45 bg-ink-900/50 backdrop-blur-md backdrop-saturate-150 p-6 ring-1 ring-warning/22",
  marketRetryBtn:
    "rounded-[var(--radius-sm)] border border-ref-sun/32 bg-ref-sun/12 px-4 py-2 text-small font-medium text-slate-100 hover:bg-ref-sun/18 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  marketLoadMorePill:
    "rounded-full border border-ref-sun/26 bg-ink-900/55 px-5 py-2.5 text-small font-medium text-slate-100 backdrop-blur-md backdrop-saturate-150 hover:bg-ref-sun/10 hover:border-ref-sun/32 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed",
  filterBarGlassDivider: "border-ref-sun/14",
  marketHeroShell:
    "mx-auto max-w-5xl relative text-center border-b border-ref-sun/12 pb-4 sm:pb-5",
  marketHeroPillMuted:
    "pointer-events-none rounded-full border border-ref-sun/22 bg-ref-sun/10 px-3 py-1 text-meta font-medium text-slate-100/95 backdrop-blur-sm drop-shadow-market-pill",
  marketFooterBorder: "mt-12 border-t border-ref-sun/14 px-4 py-8",
  marketFooterPanel: "p-4 sm:p-6 max-w-5xl mx-auto",
  marketFooterLink:
    "inline-flex min-h-[44px] items-center justify-center text-slate-200 hover:text-ref-sun/95 hover:underline rounded-[var(--radius-sm)] px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  marketFilterPanelDivider: "border-ref-sun/12",
  marketFilterBarShell:
    "mx-auto w-full max-w-5xl border-b border-ref-sun/14 px-0 pb-0 sm:pb-0",
  marketFilterResetLink:
    "inline-flex min-h-[36px] items-center rounded-full border border-ref-sun/22 bg-transparent px-3 py-1 text-small font-medium text-ref-sun/90 transition-[background-color,border-color] motion-reduce:transition-none hover:border-ref-sun/34 hover:bg-ref-sun/8 hover:text-ref-sun focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] [color:var(--ref-sun)]",
  marketFilterSearchWrap: "mb-1",
  marketFilterSearchInput:
    "w-full min-h-[44px] rounded-[var(--radius-lg)] border border-ref-sun/28 bg-ink-900/72 px-4 py-2.5 text-small text-slate-100 placeholder:text-slate-400 caret-ref-sun shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
  marketFilterSearchHint: "mt-1.5 text-meta leading-snug text-slate-400/92 [color:#94a3b8]",
  marketLoadingShell:
    "w-full max-w-xl rounded-[var(--radius-md)] border border-ref-sun/22 bg-ink-900/55 backdrop-blur-md p-8 shadow-[0_0_32px_-12px_rgba(252,164,124,0.12)] space-y-4",
  marketLoadingSkeleton: "bg-ink-700/45 rounded-[var(--radius-sm)] animate-pulse motion-reduce:animate-none",
  customItineraryPanelMd:
    "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 p-4 space-y-4",
  customItineraryPanelLg:
    "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 p-6 space-y-4",
  customItineraryPanelDay:
    "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 p-4 space-y-3",
  customItineraryPanelQuote:
    "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/45 p-4 space-y-2",
  customItineraryInsetRow:
    "mt-2 space-y-1.5 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-900/40 px-3 py-2",
  customItineraryDivider: "border-ref-sun/14",
  customItineraryThumb:
    "border border-ref-sun/16 bg-ink-950/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  customItineraryOverlayPanel:
    "relative max-w-md w-full rounded-[var(--radius-lg)] border border-ref-sun/22 bg-ink-900/95 overflow-hidden shadow-[0_0_40px_-12px_rgba(252,164,124,0.18)] ring-1 ring-ref-sun/12",
  masonryListingPill:
    "rounded-[var(--radius-md)] border border-ref-sun/16 bg-ink-800/70 px-2.5 py-1 text-meta font-medium tracking-wide text-slate-200/95 ring-1 ring-ref-sun/10 w-fit",
  subsiteComplianceShellMerchant: "border-ref-sun/16 bg-ink-900/50",
} as const;

/** 全站主题 V1 · `/did-rank` 弹窗/内链（与 `DidRankRecordModal` 暖壳同族） */
export const TT_MARKETING_DID_RANK_PATH = {
  badgeSecondary: "rounded-full border border-ref-coral/35 bg-ref-coral/10 px-3 py-0.5 text-meta text-ref-coral",
  inlineRankLinkHover: "hover:text-ref-coral",
  modalShell:
    "relative w-full max-w-md rounded-[var(--radius-md)] border border-ref-sun/35 bg-slate-900/95 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(252,164,124,0.2)] motion-sub",
  modalHeaderBorder: "border-b border-ref-sun/20",
  modalTitle: "text-body font-semibold text-ref-sun",
  modalCloseBtn:
    "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-ref-sun/15 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
  modalAvatarRing: "ring-2 ring-ref-sun/30",
  modalAvatarFallback: "bg-ref-sun/14 text-ref-sun",
  modalStatValue: "text-h4 font-bold font-mono text-ref-sun mt-1",
  modalPrimaryLink:
    "mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-ref-sun/12 px-4 py-2 text-small font-medium text-ref-sun hover:bg-ref-sun/18 hover:text-ref-coral motion-sub",
  modalHighlightLink:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded border border-ref-sun/32 bg-ref-sun/8 px-4 py-2 text-small font-medium text-ref-sun/95 hover:text-ref-sun hover:bg-ref-sun/14 motion-sub text-center",
  modalGhostBtn:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded border border-ref-sun/22 px-4 py-2 text-small text-ref-sun/90 hover:text-ref-sun hover:bg-ref-sun/8 motion-sub disabled:opacity-60 disabled:cursor-wait",
  skeletonTitleShimmer: "bg-gradient-to-r from-ref-sun/30 to-ref-coral/20",
  skeletonBadgeShimmer: "border border-ref-coral/30 bg-ref-coral/10",
} as const;

/** 顶栏用户/语言下拉 menuitem（inset；替代 `travelFocusRingCoreInsetMenuClasses`） */
export const TT_MARKETING_HEADER_MENU_ITEM_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50 focus-visible:bg-ink-100";

/** 深色顶栏 · 用户菜单（与 `HeaderUserMenu variant="dark"` 配套） */
export const TT_MARKETING_HEADER_USER_MENU_BTN_DARK =
  "flex items-center gap-2 rounded-full ring-2 ring-white/20 pl-0.5 pr-2.5 py-1 min-h-[44px] min-w-0 max-w-[12rem] sm:max-w-[14rem] bg-white/10 hover:bg-white/15 text-slate-100";

export const TT_MARKETING_HEADER_USER_MENU_DROPDOWN_DARK =
  "border-white/15 bg-ink-950/98 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)]";

export const TT_MARKETING_HEADER_USER_MENU_ITEM_DARK =
  "block w-full text-left px-3 py-2 text-small text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50";

/** `/auth/*` L5 · 用户菜单（与语言/钱包 utility 同温） */
export const TT_MARKETING_HEADER_USER_MENU_BTN_AUTH_L5 =
  "flex items-center gap-2 rounded-full ring-2 ring-ref-sun/38 pl-0.5 pr-2.5 py-1 min-h-[44px] min-w-0 max-w-[12rem] sm:max-w-[14rem] border border-ref-sun/38 bg-ref-sun/[0.08] hover:border-ref-sun/52 hover:bg-ref-sun/12 text-[#e8e4e0]";

export const TT_MARKETING_HEADER_USER_MENU_DROPDOWN_AUTH_L5 =
  "border-ref-sun/22 bg-[#0c0a09]/98 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md";

export const TT_MARKETING_HEADER_USER_MENU_ITEM_AUTH_L5 = TT_MARKETING_HEADER_LANG_MENU_ITEM_AUTH_L5;

/** —— `/` 氛围 —— */
export const TT_MARKETING_HOME_AMBIENT_SCRIM =
  "fixed inset-0 z-0 bg-experience-landing-vignette pointer-events-none";

export const TT_MARKETING_HOME_AMBIENT_GLOW =
  "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_18%,rgba(249,215,121,0.16),transparent_55%),radial-gradient(circle_at_88%_28%,rgba(252,164,124,0.08),transparent_50%),radial-gradient(circle_at_12%_55%,rgba(12,10,9,0.28),transparent_48%)]";

export const TT_MARKETING_HOME_DOT_GRID =
  "pointer-events-none fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.14] mix-blend-overlay";

/** —— `/` Hero 居中玻璃卡（25 §3.1 · 非 /traveltrust 左右分栏） —— */
export const TT_MARKETING_HOME_HERO_SECTION =
  "relative flex min-h-[min(70svh,680px)] flex-col items-center justify-center px-4 py-10 scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] max-[390px]:min-h-[min(66svh,620px)] max-[390px]:px-3 max-[390px]:py-8 sm:py-12 lg:min-h-[min(72svh,720px)]";

/** 单卡容器宽度（文案 + 表单同卡；日期行 sm+ 横排） */
export const TT_MARKETING_HOME_HERO_GRID = "relative z-10 w-full max-w-5xl";

/**
 * Console 浅底 · 暖金 L5 玻璃卡外框（与 `/` `HOME_HERO_CARD_FRAME` 同描边族 · 无 fadeUp）
 * 首页深色照片底 + 深玻璃内胆；订单等 Console 页复用此外框 + `WARM_L5_CARD_INNER_CONSOLE`。
 */
export const TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE =
  "rounded-[var(--radius-xl)] p-[1px] bg-gradient-to-br from-white/50 via-ref-sun/42 to-ref-coral/45 shadow-[0_0_48px_-12px_rgba(252,164,124,0.22)]";

/** Console 浅底玻璃卡内胆（奶油 `#faf8f6` 暖渐变 · 禁止落冷灰 `bg-soft` / 大面积 `from-white`） */
export const TT_MARKETING_WARM_L5_CARD_INNER_CONSOLE =
  "rounded-[calc(var(--radius-xl)-1px)] bg-gradient-to-b from-[#fff8f2]/96 via-[#faf8f6]/98 to-[#f5efe8]/95 backdrop-blur-md supports-[backdrop-filter]:from-[#faf8f6]/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-20px_40px_-28px_rgba(252,164,124,0.12)]";

/** Console 浅底卡内暖光（同源 `/` `HOME_FORM_INNER_GLOW` · 降强度适配奶油底） */
export const TT_MARKETING_WARM_L5_CARD_INNER_GLOW_CONSOLE =
  "pointer-events-none absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(252,164,124,0.12),transparent_55%),radial-gradient(circle_at_96%_8%,rgba(249,215,121,0.1),transparent_42%)]";

/** 与 `HOME_HERO_CARD_FRAME` 同义，兼容旧 import（波次 C · 221-A · 暖金描边） */
export const TT_MARKETING_HOME_HERO_CARD_FRAME =
  `w-full ${TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE} animate-fadeUp`;

/** `/` Hero 顶栏品牌 kicker（与 L0「Web3旅行」同指 · Tab「创新行程」为当前任务） */
export const TT_MARKETING_HOME_HERO_KICKER =
  "mb-2 text-center text-meta font-semibold uppercase tracking-[0.2em] text-ref-sun/90 drop-shadow-sm";

/** `/` Hero 标题（§1.7 · 与 marketDark 主 Action 同族） */
export const TT_MARKETING_HOME_HERO_TITLE =
  `text-h3 font-bold tracking-tight sm:text-h2 text-center drop-shadow-landing-hero ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

/** Hero 与行程预览区之间的视觉收束（页身节奏 · L5） */
export const TT_MARKETING_HOME_SECTION_BRIDGE =
  "mx-auto max-w-5xl px-4 pt-2 pb-1 pointer-events-none";
export const TT_MARKETING_HOME_SECTION_BRIDGE_LINE =
  "h-px w-full bg-gradient-to-r from-transparent via-ref-sun/35 to-transparent";
export const TT_MARKETING_HOME_RESULTS_LEAD =
  "text-meta text-white/90 text-center max-w-2xl mx-auto mb-4";

export const TT_MARKETING_HOME_INTRO_COLUMN = "flex flex-col text-center";

/** `/` Hero 次要 CTA（浅顶区 vignette 上须深玻璃底，勿用 bg-white/10 单款） */
export const TT_MARKETING_BTN_SECONDARY_HOME =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 bg-slate-950/45 px-4 py-2.5 text-small font-medium text-white shadow-[0_4px_20px_rgba(15,23,42,0.35)] backdrop-blur-md transition hover:bg-slate-950/58 hover:border-white/40 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

export const TT_MARKETING_BTN_SECONDARY_HOME_MARKET =
  "tt-market-l5-cta-link inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/38 bg-slate-950/40 px-4 py-2.5 text-small font-semibold text-white shadow-[0_4px_20px_rgba(15,23,42,0.32)] backdrop-blur-md transition hover:border-ref-sun/55 hover:bg-ref-sun/12 hover:text-white motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 [color:#ffffff!important] visited:[color:#ffffff!important]";

/** Hero 双行按钮区（无额外描边盒 · 仅纵向节奏） */
export const TT_MARKETING_HOME_HERO_ACTIONS_STACK = "mt-5";

export const TT_MARKETING_HOME_HERO_ACTIONS_DIVIDER =
  "mt-5 border-t border-[#f0a878]/20 pt-5";

/** Hero 次要 pill 共用底（暖描边幽灵 · 与辅助链同族） */
export const TT_MARKETING_HOME_HERO_PILL_GHOST =
  "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border-2 border-[#f0a878]/55 bg-[rgba(252,164,124,0.14)] px-4 py-2.5 text-small font-medium shadow-[0_0_22px_-8px_rgba(252,164,124,0.45)] backdrop-blur-sm transition hover:border-[#f0a878]/80 hover:bg-[rgba(252,164,124,0.22)] motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a878]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** Hero 辅助三链 */
export const TT_MARKETING_HOME_HERO_AUX_LINK = `${TT_MARKETING_HOME_HERO_PILL_GHOST} text-[#ffe8d4]`;

/** Hero 四链 Tab · 当前页（暖金玻璃 · 勿用实心渐变，避免与网络 CTA / 黑字混淆） */
export const TT_MARKETING_HOME_HERO_NAV_TAB_ACTIVE =
  "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border-2 border-[#f0c878] bg-[rgba(252,164,124,0.32)] px-4 py-2.5 text-small font-semibold !text-ref-sun shadow-[0_0_26px_-4px_rgba(252,164,124,0.55),inset_0_1px_0_rgba(255,220,180,0.18)] ring-2 ring-[#f0a878]/45 backdrop-blur-sm transition motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a878]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** Hero 四链 Tab · 未选中（与辅助链同款 · 上下行视觉一致） */
export const TT_MARKETING_HOME_HERO_NAV_TAB_INACTIVE = TT_MARKETING_HOME_HERO_AUX_LINK;

export const TT_MARKETING_BTN_NETWORK_LINK_HOME =
  `inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2.5 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`;

/** —— 按钮 —— */
export const TT_MARKETING_BTN_PRIMARY_WARM =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-sun/40 bg-gradient-to-r from-ref-sun/95 via-ref-coral/90 to-ref-sun/95 px-5 py-2.5 text-small font-semibold text-ink-900 shadow-warm-up transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-55";

/** `/traveltrust` 暗色文案卡内主 CTA：实色渐变，避免 CSS 变量透明度在 `<a>` 上发虚（TT-PH1-153 · 截图复验） */
export const TT_MARKETING_BTN_PRIMARY_WARM_HERO =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-ref-sun/38 bg-gradient-to-r from-[#e8c96a] via-[#f0a878] to-[#e8c96a] px-5 py-2.5 text-small font-bold text-[#0a1018] shadow-[0_8px_28px_rgba(252,164,124,0.32)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:border-ref-sun/55 hover:shadow-[0_12px_32px_-10px_rgba(252,164,124,0.45)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0";

/** 深色卡片内次 CTA：暖金描边胶囊（与 L0 注册/语言切换同族 · 非琥珀/白描边混用） */
export const TT_MARKETING_BTN_GHOST_WARM_DARK =
  "inline-flex min-h-[44px] min-w-0 w-full items-center justify-center rounded-full border border-ref-sun/26 bg-[#14100d]/50 px-4 py-2.5 text-center text-meta font-semibold leading-snug text-[#e8e4e0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-ref-sun/42 hover:bg-ref-sun/12 hover:text-ref-sun hover:shadow-[0_10px_28px_-14px_rgba(252,164,124,0.32)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 sm:text-small sm:px-5";

/** Console widget 主 CTA（浅底 · 同源 `/` 暖金实色胶囊 · 非表单方角 submit） */
export const TT_MARKETING_BTN_PRIMARY_WARM_WIDGET =
  `inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2.5 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:cursor-not-allowed disabled:opacity-55`;

/** Console widget 次 CTA（浅底 · 暖金描边幽灵 · 非 Experience 深壳 pill） */
export const TT_MARKETING_BTN_GHOST_WARM_CONSOLE =
  "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border-2 border-ref-sun/35 bg-ref-sun/8 px-4 py-2.5 text-small font-semibold text-ink-800 shadow-[0_0_16px_-8px_rgba(252,164,124,0.35)] backdrop-blur-sm transition hover:border-ref-sun/55 hover:bg-ref-sun/14 hover:text-[#9a5f18] motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:cursor-not-allowed disabled:opacity-55";

/** 表单主提交（Console 卡片内 · 方角） */
export const TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-gradient-to-r from-ref-sun/95 via-ref-coral/90 to-ref-sun/95 px-3 py-2 text-small font-semibold text-ink-900 shadow-warm-up transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:cursor-not-allowed disabled:opacity-55";

export const TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT_BLOCK = `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} w-full`;

/** 错误边界 / 内联重试（浅色 Console 卡片） */
export const TT_MARKETING_ERROR_RETRY_BTN = TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT;

/** 深色协议区 / market 抽屉主 CTA（暖色渐变 + 深底 focus offset） */
export const TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL = `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} focus-visible:ring-offset-ink-900`;

export const TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT =
  "inline-flex min-h-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-gradient-to-r from-ref-sun/95 via-ref-coral/90 to-ref-sun/95 px-3 py-1.5 text-small font-semibold text-ink-900 shadow-warm-up transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-55";

export const TT_MARKETING_BTN_PRIMARY_WARM_MARKET_BLOCK = `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} w-full focus-visible:ring-offset-ink-900`;

/** `<input type="file">` 浏览钮（Console 浅底表单） */
export const TT_MARKETING_FILE_INPUT_BROWSE =
  "file:mr-2 file:rounded file:border-0 file:border-ref-sun/40 file:bg-gradient-to-r file:from-ref-sun/95 file:via-ref-coral/90 file:to-ref-sun/95 file:px-2 file:py-1 file:text-small file:font-semibold file:text-ink-900";

/** 产品内次要 CTA（浅 Console · 暖描边，如支付 Hub / 次要导航） */
export const TT_MARKETING_BTN_WARM_OUTLINE =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/45 bg-ref-sun/10 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ref-sun/15 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console";

/** Market 卡片内紧凑暖描边钮（支付 Hub 等） */
export const TT_MARKETING_BTN_WARM_OUTLINE_COMPACT =
  "inline-flex min-h-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/45 bg-ref-sun/10 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ref-sun/15 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console";

/** Market 卡片 · 浅色头像占位圆 */
export const TT_MARKETING_AVATAR_FALLBACK_LIGHT =
  "bg-ref-sun/15 text-ink-800 ring-1 ring-ref-sun/35";

/** 治理 / 产品区 tag pill（圆角全宽） */
export const TT_MARKETING_TAG_PILL_WARM =
  "border-ref-sun/35 bg-ref-sun/10 text-ink-800";

/** 订单列表 · 草稿卡高亮（虚线框） */
export const TT_MARKETING_DRAFT_CARD_HIGHLIGHT =
  "border-2 border-dashed border-ref-sun/50 bg-ref-sun/[0.06] shadow-soft ring-1 ring-ref-sun/10";

/** Console 卡片 · 左侧强调条（callout） */
export const TT_MARKETING_CALLOUT_LEFT_ACCENT = "border-l-4 border-l-ref-sun/55";

/** 治理 Timelock 占位钮 · 可点击态 */
export const TT_MARKETING_GOV_EXEC_ACTION_ON =
  "border-ref-sun/55 bg-ref-sun/10 text-ink-900 hover:bg-ref-sun/15 dark:border-ref-sun/40 dark:bg-ref-sun/10 dark:text-ink-100";

/** Console 浅底次要按钮（白底描边 · 加载更多 / 筛选等） */
export const TT_MARKETING_BTN_SECONDARY_CONSOLE =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white text-small font-medium text-ink-800 hover:bg-ink-50 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50 disabled:cursor-not-allowed";

/** Console 主链语义钮（P1 · 取代 `btn-console` + 手写 ring） */
const TT_MARKETING_BTN_CONSOLE_MOTION =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] text-small font-medium motion-sub motion-reduce:transition-none transition-[transform,box-shadow] duration-200 ease-out hover:enabled:-translate-y-0.5 hover:enabled:shadow-soft active:enabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none";

export const TT_MARKETING_BTN_CONSOLE_SUCCESS = `${TT_MARKETING_BTN_CONSOLE_MOTION} bg-success px-3 py-1.5 text-white focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_SUCCESS_SOLID = `${TT_MARKETING_BTN_CONSOLE_MOTION} bg-success px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_SUCCESS_OUTLINE = `${TT_MARKETING_BTN_CONSOLE_MOTION} border border-success/60 bg-success/15 px-4 py-2 text-success focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_WARNING = `${TT_MARKETING_BTN_CONSOLE_MOTION} border border-warning px-3 py-1.5 text-warning focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_WARNING_SOLID = `${TT_MARKETING_BTN_CONSOLE_MOTION} bg-warning px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_DANGER = `${TT_MARKETING_BTN_CONSOLE_MOTION} border border-danger px-3 py-1.5 text-danger focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

export const TT_MARKETING_BTN_CONSOLE_TRUST = `${TT_MARKETING_BTN_CONSOLE_MOTION} bg-trust-600 px-4 py-2 text-white hover:bg-trust-500 focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

/** 治理 / 产品 · 筛选 tab 选中 */
export const TT_MARKETING_FILTER_TAB_SELECTED =
  "border-ref-sun/55 bg-ref-sun/10 text-ink-800";

/** 争议列表 · open 状态 pill（替代 travel 绿字） */
export const TT_MARKETING_STATUS_PILL_OPEN = "bg-ref-sun/12 text-ink-800";

/** 深色底卡片 focus ring（market 子站 masonry 等） */
export const TT_MARKETING_FOCUS_RING_DARK_SURFACE =
  "focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** Market / 深色玻璃 · 主 CTA（全站主题 V1 · 暖金 Action） */
export const TT_MARKETING_BTN_MARKET_PRIMARY =
  `inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2 text-small font-medium text-white hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-60`;

/** Market / 深色玻璃 · 描边钮（空态次 CTA、卡片操作） */
export const TT_MARKETING_BTN_MARKET_GHOST =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/40 px-3 py-1.5 text-small text-white hover:bg-white/10 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-60";

/** Escrow DID 深色区 · 青色主钮（替代 `btn-console` + cyan 手写） */
export const TT_MARKETING_BTN_ESCROW_DID_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-cyan-400/45 bg-cyan-500/85 px-3 py-1.5 text-small font-medium text-white shadow-scifi-glow hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** Market 深色 · 半透玻璃钮（BookGuideModal 等） */
export const TT_MARKETING_BTN_MARKET_GLASS =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-small text-white text-center hover:bg-white/20 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20 disabled:opacity-45 disabled:pointer-events-none";

/** Market 深色 · success 描边 */
export const TT_MARKETING_BTN_MARKET_SUCCESS_GHOST =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-success/35 bg-success/10 px-4 py-2 text-small text-white text-center hover:bg-success/20 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20";

/** Market Hub L1（旅行预约 / 商家 / 收购 · 透明底 · 无第二条黑带） */
export const TT_MARKETING_MARKET_HUB_NAV_SHELL =
  "flex flex-wrap justify-center gap-0.5 rounded-none border-0 bg-transparent p-0";

export const TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-3 font-semibold border-0 border-b-2 border-ref-sun/50 bg-transparent text-ref-sun shadow-none ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export const TT_MARKETING_MARKET_HUB_NAV_LINK_IDLE =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-3 font-medium text-[#c9c2bc]/95 hover:text-[#ffe8d4] hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/** —— 深色路由壳（`/market` · `/community` · `/did-rank` · W3 单源） —— */
/** warm = 现行暖褐底；premium = 高级近黑（对齐 /traveltrust 黑场 · ① `/market` 试色） */
export const TT_MARKETING_DARK_ROUTE_SURFACE = {
  warm: {
    base: "#14100d",
    baseClass: "bg-[#14100d]",
    atmosphereClass: "bg-traveltrust-atmosphere-market-dark",
    dotGridClass: "bg-traveltrust-dot-grid-market-dark opacity-[0.18]",
    pageShell: "min-h-screen relative overflow-x-hidden bg-[#14100d] text-slate-100 antialiased",
  },
  premium: {
    base: "#0a0a0a",
    baseClass: "bg-[#0a0a0a]",
    atmosphereClass: "bg-traveltrust-atmosphere-market-dark-premium",
    dotGridClass: "bg-traveltrust-dot-grid-market-dark-premium opacity-[0.12]",
    pageShell:
      "min-h-screen relative overflow-x-hidden bg-[#0a0a0a] text-slate-100 antialiased scroll-pt-[calc(4.5rem+env(safe-area-inset-top,0px))]",
  },
} as const;

export type TTMarketingDarkRouteSurfaceId = keyof typeof TT_MARKETING_DARK_ROUTE_SURFACE;

/** V2 默认 · 高级近黑（`/market*` · `/did-rank` · 与 TT 社区同底） */
export const TT_MARKETING_DARK_ROUTE_PAGE_SHELL = TT_MARKETING_DARK_ROUTE_SURFACE.premium.pageShell;

export const TT_MARKETING_DARK_ROUTE_PAGE_SHELL_WARM = TT_MARKETING_DARK_ROUTE_SURFACE.warm.pageShell;

export const TT_MARKETING_DARK_ROUTE_WARM_FIELD_BASE = `fixed inset-0 z-0 ${TT_MARKETING_DARK_ROUTE_SURFACE.warm.baseClass} pointer-events-none`;

/** 社区壳 · 移动顶栏 / 桌面 Tab 顶栏 / 底栏（W3+ 内层收口 · 暖金边与 L0 对齐） */
export const TT_MARKETING_DARK_ROUTE_MOBILE_HEADER =
  "md:hidden sticky z-[110] border-b border-ref-sun/16 bg-ink-900/90 backdrop-blur-md ring-1 ring-ref-sun/12 safe-area-inset-t top-[calc(3.5rem+env(safe-area-inset-top,0px))]";

export const TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER =
  "hidden md:block sticky z-[110] relative border-b border-ref-sun/20 bg-ink-900/90 backdrop-blur-md ring-1 ring-ref-sun/14 safe-area-inset-t top-[calc(3.5rem+env(safe-area-inset-top,0px))]";

export const TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV =
  "md:hidden fixed bottom-0 left-0 right-0 z-[110] relative border-t border-ref-sun/20 bg-ink-900/95 backdrop-blur-md safe-area-pb ring-1 ring-ref-sun/12";

export const TT_MARKETING_DARK_ROUTE_HEADER_TITLE =
  "shrink-0 text-body font-semibold text-slate-100";

export const TT_MARKETING_DARK_ROUTE_HEADER_LINK_PRIMARY =
  "text-meta font-medium text-ref-sun hover:text-ref-coral motion-sub underline-offset-2";

export const TT_MARKETING_DARK_ROUTE_HEADER_LINK_MUTED =
  "text-meta text-slate-300 hover:text-ref-sun motion-sub";

/** 深色路由页脚 / ProductCrossNav 内链（暖金 · 替代 cyan-300 手写） */
export const TT_MARKETING_DARK_ROUTE_INLINE_LINK =
  "inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-coral underline motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded-[var(--radius-sm)] px-0.5";

/** DID 排行榜 · 分页钮（描边暖金） */
export const TT_MARKETING_DID_RANK_PAGINATION_BTN =
  "rounded border border-ref-sun/28 px-2 py-1 text-ref-sun/90 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ref-sun/10 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const TT_MARKETING_DARK_ROUTE_HEADER_SUPPORT_RAIL =
  "border-t border-ref-sun/12 bg-ink-900/85 px-3 py-1.5";

/** 页身弱纵向柔光（保留极低赛博感 · opacity 低于 community） */
export const TT_MARKETING_DARK_ROUTE_SCRIM_CYAN =
  "absolute inset-0 bg-gradient-to-b from-transparent via-ref-sun/6 to-transparent";

/**
 * marketDark 三页 · `WarmRouteFieldBackdrop` 之上叠层分档（减轻路由切换色差 · ①）。
 * 真源：`MarketDarkRouteSceneDecor`；`/market` 最弱，`/community`/`/did-rank` 略强但仍低于历史 0.75/0.80 赛博。
 */
export const TT_MARKETING_DARK_ROUTE_SCENE = {
  market: {
    podium: "opacity-[0.16]",
    warmVeil: "opacity-[0.24]",
    vignette: "opacity-[0.22]",
    warmRadials:
      "bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(252,164,124,0.12),transparent_50%),radial-gradient(circle_at_88%_22%,rgba(249,215,121,0.08),transparent_48%)]",
  },
  /** `/market` + premium 底：弱化暖雾，保留少量顶缘金晕 */
  marketPremium: {
    podium: "opacity-[0.10]",
    warmVeil: "opacity-[0.14]",
    vignette: "opacity-[0.30]",
    warmRadials:
      "bg-[radial-gradient(ellipse_72%_42%_at_18%_0%,rgba(249,215,121,0.07),transparent_52%),radial-gradient(circle_at_90%_18%,rgba(252,164,124,0.04),transparent_46%)]",
  },
  community: {
    podium: "opacity-[0.22]",
    warmVeil: "opacity-[0.28]",
    vignette: "opacity-[0.28]",
    warmRadials:
      "bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(252,164,124,0.12),transparent_50%),radial-gradient(circle_at_95%_25%,rgba(249,215,121,0.07),transparent_45%)]",
  },
  /** `/community` + premium 底（高级近黑 · 弱化褐雾） */
  communityPremium: {
    podium: "opacity-[0.12]",
    warmVeil: "opacity-[0.16]",
    vignette: "opacity-[0.32]",
    warmRadials:
      "bg-[radial-gradient(ellipse_76%_48%_at_16%_0%,rgba(249,215,121,0.08),transparent_52%),radial-gradient(circle_at_94%_20%,rgba(252,164,124,0.05),transparent_46%)]",
  },
  didRank: {
    podium: "opacity-[0.19]",
    warmVeil: "opacity-[0.24]",
    vignette: "opacity-[0.24]",
    warmRadials:
      "bg-[radial-gradient(ellipse_95%_55%_at_50%_-15%,rgba(249,215,121,0.09),transparent_52%),radial-gradient(circle_at_85%_12%,rgba(252,164,124,0.07),transparent_42%)]",
  },
} as const;

/** 224-D · `/market` 首屏节奏：Hero(12) → Hub/筛选(8) → 列表(16) */
export const TT_MARKETING_MARKET_HERO_ZONE = "px-4 pt-4 pb-2 sm:pt-5 sm:pb-3";

export const TT_MARKETING_MARKET_HUB_GAP = "flex justify-center px-4 mt-2";

export const TT_MARKETING_MARKET_FILTER_GAP = "flex justify-center px-4 mt-1.5 sm:mt-2";

export const TT_MARKETING_MARKET_CONTENT_GAP = "mt-4";

/** 224-D · `/did-rank` 压顶区，榜单 Top3 更易 above fold */
export const TT_MARKETING_DID_RANK_PAGE_INNER =
  "relative z-10 max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-8";

export const TT_MARKETING_DID_RANK_PREBOARD_STACK = "flex flex-col gap-3 sm:gap-5";

/** `/did-rank` 奖池 + 标题区合并单壳（PR-C · 减套娃） */
export const TT_MARKETING_DID_RANK_PREBOARD_SHELL =
  `overflow-hidden ${TT_MARKETING_DARK_ROUTE_PANEL_L5}`;

/** 224-D · `/community` Feed 首屏（D6 · mobile 首条 above fold） */
export const TT_MARKETING_COMMUNITY_FEED_PAGE =
  "max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-5 md:pt-3 lg:pt-4 max-[390px]:pt-2 max-[390px]:pb-4";

export type TTMarketingDarkRouteSceneTier = keyof typeof TT_MARKETING_DARK_ROUTE_SCENE;

export const TT_MARKETING_DARK_ROUTE_TAB_PROGRESS =
  "absolute left-0 top-0 right-0 h-0.5 bg-gradient-to-r from-ref-sun/80 to-ref-coral/70 z-[1]";

export const TT_MARKETING_DARK_ROUTE_TAB_RAIL =
  "flex items-stretch gap-1 rounded-[var(--radius-md)] p-1 bg-ink-800/60 ring-1 ring-ref-sun/14";

export const TT_MARKETING_DARK_ROUTE_TAB_ACTIVE =
  `border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} text-white font-semibold shadow-[0_0_18px_-6px_rgba(252,164,124,0.34)] ring-1 ring-ref-sun/22`;

export const TT_MARKETING_DARK_ROUTE_TAB_IDLE =
  "text-slate-300 hover:text-slate-100 hover:bg-ink-700/60 border border-transparent";

/** `/community` premium · L1 桌面 Tab（透明底 · 仅底部分隔 · 不叠第二条黑带） */
export const TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM =
  "hidden md:block relative z-[240] overflow-visible bg-transparent border-b border-white/8";

export const TT_MARKETING_DARK_ROUTE_MOBILE_HEADER_COMMUNITY_PREMIUM =
  `md:hidden sticky z-[290] bg-transparent backdrop-blur-none safe-area-inset-t border-b-0 ${TT_MARKETING_SITE_HEADER_STICKY_OFFSET_CLASS}`;

/** `/community` premium · 移动 L2 帮助条（透明 · 避免第三条色带） */
export const TT_MARKETING_DARK_ROUTE_HEADER_SUPPORT_RAIL_COMMUNITY_PREMIUM =
  "border-t border-white/8 bg-transparent px-3 py-1.5";

export const TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV_COMMUNITY_PREMIUM =
  "md:hidden fixed bottom-0 left-0 right-0 z-[110] relative border-t border-white/8 bg-[#0a0a0a]/96 backdrop-blur-md safe-area-pb";

export const TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM =
  "flex w-full items-stretch gap-0.5 overflow-visible rounded-none p-0 bg-transparent";

export const TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM =
  "relative font-semibold rounded-[var(--radius-sm)] border border-ref-sun/22 bg-ref-sun/10 text-ref-sun shadow-none ring-0";

export const TT_MARKETING_DARK_ROUTE_TAB_IDLE_COMMUNITY_PREMIUM =
  "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent";

export const TT_MARKETING_DARK_ROUTE_TAB_BASE_COMMUNITY =
  "relative text-center rounded-md px-2 py-2 sm:px-3 text-meta font-medium motion-sub min-h-[44px] flex items-center justify-center border border-transparent";

const TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950 =
  "focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";
const TT_MARKETING_DARK_ROUTE_FOCUS_OFF_900 =
  "focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

export const TT_MARKETING_DARK_ROUTE_TAB_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_HEADER_LINK_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_900} rounded-sm px-0.5`;

export const TT_MARKETING_DARK_ROUTE_PUBLISH_FAB =
  "flex-shrink-0 w-12 h-12 rounded-full border-2 border-ref-sun/55 bg-gradient-to-br from-ref-sun via-[#f0a878] to-ref-coral flex items-center justify-center text-[#0c0a09] font-semibold shadow-[0_0_20px_-6px_rgba(252,164,124,0.38)] motion-sub hover:brightness-110";

export const TT_MARKETING_DARK_ROUTE_PUBLISH_FAB_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_CYAN_PILL_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_FUCHSIA_PILL_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/80 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_SLATE_PILL_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_WARNING_PILL_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/75 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_FUCHSIA_TEXT_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950} rounded-sm px-0.5`;

export const TT_MARKETING_DARK_ROUTE_CARD_LINK_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

export const TT_MARKETING_DARK_ROUTE_CONVERSATION_ROW_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/45";

export const TT_MARKETING_DARK_ROUTE_ME_TAB_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/40";

export const TT_MARKETING_DARK_ROUTE_AVATAR_LINK_FOCUS = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${TT_MARKETING_DARK_ROUTE_FOCUS_OFF_950}`;

/** DID 排行榜 · 四榜脊签容器 */
export const TT_MARKETING_DID_RANK_BOARD_SHELL =
  `rounded-[var(--radius-md)] p-2 sm:p-3 flex flex-col lg:flex-row gap-3 lg:gap-0 lg:items-stretch ${TT_MARKETING_DARK_ROUTE_PANEL_L5}`;

export const TT_MARKETING_DID_RANK_TABLIST =
  "flex flex-col gap-0.5 p-1 rounded-none border-0 bg-transparent lg:w-[11.5rem] shrink-0 lg:border-r lg:border-ref-sun/14 lg:pr-2";

export const TT_MARKETING_DID_RANK_TAB_ACTIVE =
  "min-h-[48px] w-full rounded-[var(--radius-sm)] border border-ref-sun/32 bg-ref-sun/12 px-3 py-3 text-left text-small font-semibold text-ref-sun shadow-[inset_0_0_20px_-12px_rgba(252,164,124,0.38)] ring-0 motion-sub transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export const TT_MARKETING_DID_RANK_TAB_IDLE =
  "min-h-[48px] w-full rounded-[var(--radius-md)] border border-transparent bg-ink-800/35 px-3 py-3 text-left text-small font-medium text-slate-400 hover:border-ref-sun/16 hover:text-slate-200 hover:bg-ref-sun/8 motion-sub transition-[border-color,background-color,color] duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** 榜内主面板：透明壳（外框仅 `DID_RANK_BOARD_SHELL` 一层 · PR-F） */
export const TT_MARKETING_DID_RANK_MAIN_PANEL = "overflow-hidden motion-sub min-h-0";

/** 深色 marketDark · 圆角主 CTA（Hero / 工具条 · 全站主题 V1 暖金 Action） */
export const TT_MARKETING_BTN_MARKET_PRIMARY_PILL =
  `inline-flex min-h-[44px] items-center justify-center rounded-full ${TT_MARKETING_ACTION_GRADIENT_FILL} px-5 py-2.5 text-small font-semibold text-white ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-safe:transition-transform motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(20,12,10,0.55)]`;

/**
 * `/guides*` 市场氛围深壳（桥接轨 · TT-PH1-216）。
 * 主 CTA / 面板 / 章节标题暖金；内联链优先 `TT_MARKETING_DARK_ROUTE_INLINE_LINK` / `TT_MARKETING_MARKET_DARK_PATH`。
 */
export const TT_MARKETING_GUIDES_ATMOSPHERE = {
  panel:
    "rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/70 backdrop-blur-md shadow-scifi-panel",
  panelSlate:
    "rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-900/70 backdrop-blur-md shadow-scifi-panel-md",
  sectionHeading:
    "text-body font-semibold text-ref-sun/90 px-4 pt-4 pb-2 border-b border-slate-600/50",
  sectionHeadingMeta: "text-meta font-semibold text-ref-sun/85 mb-2",
  accentText: "text-small text-ref-sun/90 mt-2 font-medium",
  heroRing: "ring-2 ring-ref-sun/40",
  avatarFallbackText: "text-ref-sun",
  retryPill: TT_MARKETING_BTN_MARKET_PRIMARY_PILL,
  primaryBtn:
    "rounded-[var(--radius-md)] border border-ref-sun/42 bg-ref-sun/14 px-4 py-2 text-small font-medium text-ref-sun hover:text-ref-coral hover:bg-ref-sun/22 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
  primaryCtaBlock: `rounded-[var(--radius-md)] border border-ref-sun/45 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-5 py-3 text-small font-medium text-white hover:brightness-110 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800`,
  secondaryBtn:
    "rounded-[var(--radius-md)] border border-white/18 bg-ink-700/60 px-5 py-3 text-small text-slate-300 hover:bg-ink-600/60 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
  didCopyBtn:
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-ref-sun/35 bg-ref-sun/10 px-3 py-1.5 text-meta font-mono text-ref-sun/95 hover:text-ref-sun hover:bg-ref-sun/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 disabled:opacity-60 disabled:cursor-wait",
  inputFocus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
} as const;

/** 子站 Hero 工具条主钮（描边暖金 · 非全填充） */
export const TT_MARKETING_BTN_MARKET_SUBSITE_TOOLBAR =
  "inline-flex min-h-[44px] w-full min-w-[8.5rem] items-center justify-center rounded-xl border border-ref-sun/32 bg-ref-sun/10 px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_24px_-12px_rgba(252,164,124,0.28)] hover:bg-ref-sun/16 hover:border-ref-sun/45 motion-safe:transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 sm:w-auto";

export const TT_MARKETING_DID_RANK_MAIN_PANEL_HEADER =
  "border-b border-ref-sun/12 px-3 py-2.5 sm:px-4 sm:py-3";

export const TT_MARKETING_DID_RANK_MAIN_PANEL_TITLE = "text-body font-semibold text-slate-100";

export const TT_MARKETING_DID_RANK_MAIN_PANEL_DESC = "text-meta text-slate-400 mt-0.5";

export const TT_MARKETING_DID_RANK_FOOTER_NAV_TEXT = "text-meta text-slate-300/95";

/** DID 排行榜 · 面板/卡片/幽灵钮（P1 暖描边 · 替代 slate 冷框） */
export const TT_MARKETING_DID_RANK_SURFACE = {
  prizePoolShell:
    "px-4 py-4 sm:px-6 sm:py-5 motion-sub border-b border-ref-sun/12 bg-transparent",
  prizePoolMetric:
    "relative overflow-hidden rounded-[var(--radius-md)] border border-ref-sun/22 bg-gradient-to-br from-ref-sun/14 via-ink-900/40 to-ref-coral/10 px-4 py-2 sm:px-5 sm:py-2.5 ring-1 ring-ref-sun/12",
  prizePoolMetricBorderGlow:
    "pointer-events-none absolute inset-0 rounded-[var(--radius-md)] border border-ref-sun/28 animate-did-rank-prize-border-glow motion-reduce:animate-none",
  prizePoolMetricShimmer:
    "pointer-events-none absolute inset-y-0 left-0 w-[42%] min-w-[4rem] bg-gradient-to-r from-transparent via-ref-sun/35 to-transparent animate-did-rank-prize-shimmer motion-reduce:hidden",
  rankRowHighlightPulse: "",
  /** 榜内卡片文字层：避免 transform 动画导致子像素发糊 */
  rankCardTextCrisp: "relative z-[1] subpixel-antialiased [text-rendering:geometricPrecision]",
  headerShell:
    "px-4 py-4 sm:px-6 sm:py-5 motion-sub flex flex-col lg:flex-row lg:items-center lg:gap-8 bg-transparent border-0",
  rankSectionShell: "px-0 sm:px-1 py-4 sm:py-5 mt-6 sm:mt-8",
  rankCard:
    "rounded-[var(--radius-md)] border-0 bg-ink-800/48 backdrop-blur-sm p-2 sm:p-3 min-w-0 motion-sub hover:bg-ink-800/55",
  rankTop3Card:
    "rounded-[var(--radius-md)] border border-ref-sun/14 bg-ink-800/52 backdrop-blur-sm p-2 sm:p-3 min-w-0 motion-sub hover:border-ref-sun/22 hover:bg-ink-800/58",
  rankTop10Card:
    "rounded-[var(--radius-md)] p-2 sm:p-3 sm:pb-3.5 min-w-0 h-full flex flex-col motion-sub relative overflow-hidden",
  rankTop10RowCard:
    "rounded-[var(--radius-md)] p-2 sm:p-2 min-w-0 h-full flex flex-row sm:flex-col items-center gap-2.5 sm:gap-1 sm:text-center motion-sub",
  rankTop10Highlight:
    "ring-2 ring-ref-sun/45 shadow-[0_0_16px_-8px_rgba(252,164,124,0.28)]",
  rankTop10HighlightOnce:
    "animate-did-rank-highlight-pulse motion-reduce:animate-none",
  top10StageShell:
    "relative rounded-[var(--radius-lg)] px-1 py-3 sm:px-2 sm:py-4 bg-gradient-to-b via-ink-900/20 to-transparent motion-reduce:animate-none",
  top10RefreshFlash: "animate-did-rank-top10-refresh-flash motion-reduce:animate-none",
  top10RowBand: "mt-2 sm:mt-3 pt-3 sm:pt-4 border-t border-ref-sun/12",
  top10BandLabel:
    "block text-center text-meta font-medium tracking-[0.12em] uppercase text-slate-500 mb-2 sm:mb-2.5",
  fullListFoldWrap: "mt-5 sm:mt-6",
  fullListFoldDivider: "flex items-center gap-3 sm:gap-4",
  fullListFoldRule:
    "h-px flex-1 bg-gradient-to-r from-transparent via-ref-sun/18 to-transparent",
  fullListFoldDisclosure:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-ref-sun/22 bg-ink-900/50 px-4 py-2 text-small font-medium text-ref-sun/95 hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  fullListFoldDisclosureExpanded:
    "border-ref-sun/36 bg-ref-sun/12 text-ref-sun shadow-[0_0_20px_-12px_rgba(252,164,124,0.35)]",
  fullListFoldChevron: "inline-block text-ref-sun transition-transform duration-300 ease-out motion-reduce:transition-none",
  fullListFoldHint: "text-center text-meta text-slate-500 mt-2.5 max-w-lg mx-auto leading-relaxed",
  rankPodiumRecordBtn:
    "w-full min-h-[36px] rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ref-sun/10 px-2 py-1 text-meta font-medium text-ref-sun hover:border-ref-sun/34 hover:bg-ref-sun/16 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  rankPodiumGuideBtn:
    "w-full min-h-[36px] rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ref-sun/10 px-2 py-1 text-meta font-medium text-ref-sun hover:border-ref-sun/34 hover:bg-ref-sun/16 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  shareRankLinkBtn:
    "rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ink-900/55 px-2 py-1 text-meta text-ref-sun/90 hover:border-ref-sun/38 hover:bg-ref-sun/10 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  shareRankLinkBtnCopied:
    "border-ref-sun/42 bg-ref-sun/14 text-ref-sun animate-did-rank-copy-ok motion-reduce:animate-none",
  /** 随内容增高 · 不裁切内滚（完整榜随页面滚动，见 DidRankFullRankList） */
  boardInner: "relative rounded-[var(--radius-md)] bg-ink-900/25",
  boardRefreshTrack:
    "pointer-events-none absolute left-0 right-0 top-0 z-20 h-0.5 overflow-hidden bg-ref-sun/10",
  boardRefreshBar:
    "h-full w-[38%] min-w-[5rem] bg-gradient-to-r from-transparent via-ref-sun/90 to-transparent animate-did-rank-refresh-bar motion-reduce:animate-none",
  listPanel:
    "flex flex-col rounded-[var(--radius-md)] overflow-hidden border border-ref-sun/14 bg-gradient-to-b from-ref-sun/[0.06] via-ink-900/25 to-ink-900/40 ring-1",
  listPanelRingTraveler: "ring-ref-sun/10",
  listPanelRingGuide: "ring-fuchsia-500/14",
  listNavFooter:
    "shrink-0 flex items-center justify-between gap-2 px-2 py-2 border-t border-ref-sun/10 text-meta text-slate-300/95 bg-transparent",
  skeletonSection:
    "rounded-[var(--radius-lg)] border border-ref-sun/26 bg-ink-900/58 backdrop-blur-md overflow-hidden ring-1 ring-ref-sun/12",
  /** 榜内骨架：不再叠 L5 外框（外层 `DID_RANK_BOARD_SHELL` 已承担） */
  skeletonBoardInner: "min-h-0 overflow-hidden bg-transparent border-0 ring-0 rounded-none",
  skeletonHeader: "border-b border-ref-sun/16 bg-ink-900/55 px-3 py-2.5 sm:px-4 sm:py-3",
  skeletonCard: "rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-800/50 p-2 sm:p-3 animate-pulse",
  skeletonList: "rounded border border-ref-sun/18 bg-ink-900/45 overflow-hidden",
  skeletonListFooter: "px-2 py-2 border-t border-ref-sun/16 flex justify-between text-meta text-slate-400",
  fetchErrorBanner:
    "rounded-[var(--radius-md)] border border-ref-coral/30 bg-ink-900/50 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-slate-300 motion-sub",
  recordModalShell:
    "relative w-full max-w-md rounded-[var(--radius-md)] border border-ref-sun/35 bg-ink-900/95 backdrop-blur-md shadow-[0_0_40px_-12px_rgba(252,164,124,0.2)] motion-sub",
  rankListRowCard:
    "mx-1 sm:mx-1.5 my-0.5 rounded-[var(--radius-sm)] border border-ref-sun/10",
  rankRow: "border-b border-ref-sun/10 last:border-b-0 motion-sub hover:border-ref-sun/18 hover:bg-ref-sun/6",
  rankRowZebraEven: "bg-ink-900/32",
  rankRowZebraOdd: "bg-ink-900/14",
  rankRowHighlight: "ring-1 ring-ref-sun/45 bg-ref-sun/10",
  rankListStickyHeader:
    "sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.75rem_1fr_auto_auto] gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 text-meta font-medium text-slate-400 border-b border-ref-sun/14 bg-ink-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-ink-900/80",
  skeletonPulse: "bg-ink-700/50 animate-pulse",
  skeletonPulseSoft: "bg-ink-700/40 animate-pulse",
  guideModalScrim: "absolute inset-0 bg-ink-950/80 backdrop-blur-sm",
  emptyPanel:
    "rounded-[var(--radius-md)] border border-dashed border-ref-sun/22 bg-ink-900/30 py-12 px-4 text-center text-slate-300",
  emptyPanelL5:
    "rounded-[var(--radius-md)] border border-dashed border-ref-sun/20 bg-ink-900/35 py-10 sm:py-12 px-4 sm:px-6 text-center text-slate-300/95",
  emptyPanelCompact:
    "rounded-[var(--radius-sm)] border border-dashed border-ref-sun/16 bg-ink-900/20 py-5 px-4 text-center text-meta text-slate-400",
  ghostBtn:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/55 px-2 py-1.5 text-meta font-medium text-slate-200 hover:bg-ref-sun/10 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  fullListFoldCta:
    "flex w-full min-h-[44px] items-center justify-between gap-2 rounded-[var(--radius-md)] border border-ref-sun/18 bg-ink-900/35 px-3 py-2 text-left motion-sub hover:border-ref-sun/28 hover:bg-ref-sun/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  modalGhostBtn:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/26 bg-ink-800/55 px-4 py-2 text-small font-medium text-slate-200 hover:bg-ref-sun/10 hover:text-ref-sun motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
  myRankBadge:
    "rounded border border-ref-sun/32 bg-ref-sun/12 px-1.5 py-0.5 text-meta font-medium text-ref-sun/95",
} as const;

/** Market 深色 · 半透填充次要（OrderCard 支付 Hub 等） */
export const TT_MARKETING_BTN_MARKET_GHOST_FILL =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/35 bg-white/10 px-3 py-1.5 text-small font-medium text-white motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** Escrow 深色玻璃模态 · 次要描边（取消 / dismiss） */
export const TT_MARKETING_BTN_ESCROW_MODAL_GHOST =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/22 bg-ink-900/50 px-4 py-2 text-small text-slate-200 hover:bg-ref-sun/10 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-50";

/** Escrow 深色 · 警告描边 pill（ReorgBanner · did） */
export const TT_MARKETING_BTN_ESCROW_WARNING_PILL =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-warning/20 border border-warning/50 px-3 py-1.5 text-small text-warning/95 hover:bg-warning/30 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** Console · 深灰实心（质押 approve 等） */
export const TT_MARKETING_BTN_CONSOLE_NEUTRAL_SOLID =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-ink-800 px-5 py-2.5 text-small font-semibold text-white hover:bg-ink-700 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:cursor-not-allowed disabled:opacity-50";

/** Market 深色玻璃 · 文本输入 focus（CustomItinerary / studio modal） */
export const TT_MARKETING_MARKET_GLASS_FIELD_FOCUS =
  "focus:outline-none focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 backdrop-blur-sm";

/** Market 深色玻璃 · merchant studio 输入（offset ink-800） */
export const TT_MARKETING_MARKET_GLASS_FIELD_FOCUS_INK800 =
  "focus:outline-none focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] backdrop-blur-sm";

/** Market 深色玻璃 · radio/checkbox */
export const TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL =
  "rounded-full border-ref-sun/24 bg-ink-900/55 text-ref-sun accent-ref-sun focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/** Market 深色玻璃 · file trigger（focus-within） */
export const TT_MARKETING_MARKET_GLASS_FOCUS_WITHIN =
  "focus-within:outline-none focus-within:ring-2 focus-within:ring-ref-sun/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0a0a0a]";

/** Market 详情抽屉 · 青色强调 CTA 条（替代 travel-400/500 底） */
export const TT_MARKETING_MARKET_DRAWER_ACCENT_SURFACE =
  "border-ref-sun/35 bg-ref-sun/14 hover:bg-ref-sun/22";

/** OrderFlow 当前步圆点（Console 浅色区） */
export const TT_MARKETING_ORDER_FLOW_STEP_CURRENT =
  "bg-gradient-to-br from-ref-sun/95 to-ref-coral/90 text-ink-900 ring-2 ring-ref-sun/50 shadow-warm-up";

/** 产品 Console 区内链（替代 text-travel-500；与 touchTargetLink44Classes 联用） */
export const TT_MARKETING_CONSOLE_INLINE_LINK =
  "font-medium text-ink-800 underline underline-offset-2 transition-colors motion-reduce:transition-none hover:text-ref-coral/95";

/** 浅底输入框 focus 描边（替代 focus-visible:border-travel-500） */
export const TT_MARKETING_INPUT_FOCUS_BORDER = "focus-visible:border-ref-sun/60";

/** Console 浅底表单控件 focus（描边 + 暖色 ring；替代 travelFocusRingCoreOffset2 + travel 描边） */
export const TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE =
  "focus:outline-none focus-visible:border-ref-sun/60 focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console";

/** Console 控件 focus ring（无圆角；按钮/ pill 自备 rounded） */
export const TT_MARKETING_FOCUS_RING_CONSOLE =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console";

/** Console 内联链 focus（含 radius-sm；替代 travelFocusRingOffset2Classes） */
export const TT_MARKETING_CONSOLE_LINK_FOCUS =
  `rounded-[var(--radius-sm)] ${TT_MARKETING_FOCUS_RING_CONSOLE}`;

/** Me onboarding 角色 pill · 选中 */
export const TT_MARKETING_ROLE_PILL_SELECTED =
  "border-ref-sun/55 bg-ref-sun/12 text-ink-900";

export const TT_MARKETING_ROLE_PILL_IDLE =
  "border-ink-200 bg-white text-ink-700 hover:border-ref-sun/40";

/** 圆角 pill 选中（行程新建国家/城市等） */
export const TT_MARKETING_PILL_SELECTED_ROUND =
  "bg-ref-sun/20 border-ref-sun/50 text-ink-900";

/** OrderFlow loading 骨架 · 当前步格 */
export const TT_MARKETING_ORDER_FLOW_STEP_SKELETON_CURRENT =
  "border-ref-sun/55 bg-ref-sun/15";

/** 表单 loading 主 CTA 骨架槽（暖色 tint） */
export const TT_MARKETING_SKELETON_WARM_CTA =
  "bg-ref-sun/20 border border-ref-sun/35";

/** 信息 callout 暖描边（替代 travel 绿框） */
export const TT_MARKETING_CALLOUT_WARM =
  "border-ref-sun/40 bg-ref-sun/[0.08]";

/** 我的订单列表 · 标准卡（Console L5 · hover 暖边） */
export const TT_MARKETING_ORDER_LIST_CARD =
  "border border-ink-200/90 bg-white shadow-soft hover:border-ref-sun/32 hover:shadow-medium motion-reduce:transition-none transition-[box-shadow,border-color] duration-200";

/** 订单列表 · 状态徽章（中性） */
export const TT_MARKETING_ORDER_STATUS_BADGE_NEUTRAL = "bg-ink-100/90 text-ink-700 ring-1 ring-ink-200/80";

/**
 * `/orders` · 深色玻璃正文层级（玻璃底上可读 · 比通用脚注 slate-400 提亮一档）
 */
export const TT_MARKETING_ORDERS_TEXT_BODY = "text-slate-200";
export const TT_MARKETING_ORDERS_TEXT_META = "text-slate-300";
export const TT_MARKETING_ORDERS_TEXT_MUTED = "text-slate-400";

/** 我的订单 · 骨架 shimmer 条（须落在 `data-tt-orders-list-l5` 祖先下） */
export const TT_MARKETING_ORDERS_SKELETON_SHIMMER = "orders-list-l5-shimmer motion-reduce:animate-none";

/** 我的订单 · 页脚（深色底 · 暖金顶线） */
export const TT_MARKETING_ORDERS_FOOTER_SHELL =
  "mt-12 border-t border-ref-sun/14 bg-gradient-to-b from-ref-sun/[0.08] via-transparent to-transparent pt-8";

/** 订单产品页精简页脚（`footerWrap` 已带上间距 · 无重复 `mt-12`） */
export const TT_MARKETING_ORDERS_PRODUCT_FOOTER_SHELL =
  "border-t border-ref-sun/14 bg-gradient-to-b from-ref-sun/[0.06] via-transparent to-transparent pt-8 pb-10 sm:pb-12";

/** 我的订单 · 加载更多（深色底 · 暖描边） */
export const TT_MARKETING_ORDERS_LOAD_MORE_BTN =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-ref-sun/40 bg-slate-950/55 px-6 py-2.5 text-small font-semibold text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-ref-sun/55 hover:bg-ref-sun/10 motion-sub motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-50";

/** 我的订单 · 加载更多旋转指示 */
export const TT_MARKETING_ORDERS_LOAD_MORE_SPINNER =
  "inline-block h-4 w-4 shrink-0 rounded-full border-2 border-ref-sun/28 border-t-ref-sun/90 motion-safe:animate-spin motion-reduce:animate-none";

/** 我的订单 · 列表已全部加载条 */
export const TT_MARKETING_ORDERS_LIST_END_PANEL =
  "flex flex-col items-center gap-3 py-2 text-center";

/** 我的订单 · 列表已全部加载文案 */
export const TT_MARKETING_ORDERS_LIST_END_TEXT =
  `text-meta font-medium ${TT_MARKETING_ORDERS_TEXT_META}`;

/** 我的订单 · 空态背景光晕 */
export const TT_MARKETING_ORDERS_EMPTY_GLOW =
  "pointer-events-none absolute left-1/2 top-8 -z-10 h-28 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(252,164,124,0.22),transparent_68%)] blur-2xl motion-reduce:blur-xl";

/** 我的订单 · 加载更多失败面板 */
export const TT_MARKETING_ORDERS_LOAD_MORE_ERROR_PANEL =
  "rounded-[var(--radius-lg)] border border-ref-sun/22 bg-slate-950/55 backdrop-blur-md p-4 space-y-3 shadow-[0_8px_28px_-18px_rgba(0,0,0,0.48)]";

/** 我的订单 · 期望新订单 / 内联状态条 */
export const TT_MARKETING_ORDERS_EXPECT_BANNER_PANEL =
  "rounded-[var(--radius-lg)] border border-ref-sun/22 bg-slate-950/50 backdrop-blur-md p-4 shadow-[0_8px_28px_-18px_rgba(0,0,0,0.45)]";

/** 我的订单 · 预约向导校验中 */
export const TT_MARKETING_ORDERS_BOOK_GUIDE_CHECKING_PANEL =
  "rounded-[var(--radius-xl)] border border-ref-sun/22 bg-slate-950/55 p-4 shadow-[0_8px_32px_-18px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-5";

/** 我的订单 · 预约向导无效/失败 */
export const TT_MARKETING_ORDERS_BOOK_GUIDE_INVALID_PANEL =
  "rounded-[var(--radius-xl)] border border-warning/35 bg-slate-950/55 p-4 shadow-[0_8px_32px_-18px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-5";

/** 我的订单 · 空态图标圆 */
export const TT_MARKETING_ORDERS_EMPTY_ICON =
  "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-ref-sun/35 bg-ref-sun/12 text-2xl text-ref-coral/90 shadow-[0_0_20px_-8px_rgba(252,164,124,0.4)]";

/** 我的订单 · alert 关闭钮 */
export const TT_MARKETING_ORDERS_ALERT_DISMISS_BTN =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/28 bg-slate-950/60 text-slate-300 hover:border-ref-sun/45 hover:bg-ref-sun/10 hover:text-slate-100 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 列表同步中条 */
export const TT_MARKETING_ORDERS_SYNCING_BANNER =
  "flex items-center gap-2 rounded-[var(--radius-lg)] border border-ref-sun/22 bg-ref-sun/[0.1] px-4 py-2.5 text-meta font-medium text-ref-sun/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

/** 我的订单 · 点阵叠层（同源 `/` `HOME_DOT_GRID`） */
export const TT_MARKETING_ORDERS_DOT_GRID = TT_MARKETING_HOME_DOT_GRID;

/** 我的订单 · 当前筛选芯片 */
export const TT_MARKETING_ORDERS_ACTIVE_FILTER_CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-ref-sun/35 bg-ref-sun/12 px-3 py-1 text-meta font-semibold text-ref-sun/95 shadow-[0_0_14px_-6px_rgba(252,164,124,0.32)]";

/** 我的订单 · 筛选芯片清除 */
export const TT_MARKETING_ORDERS_ACTIVE_FILTER_CHIP_DISMISS =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ref-coral/90 hover:bg-ref-sun/16 hover:text-ref-sun motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55";

/** 我的订单 · 列表提示条 sticky 偏移（顶栏下沿） */
export const TT_MARKETING_ORDERS_STICKY_HINT_BAR =
  "sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[8] sm:top-14";

/** 我的订单 · 卡片 hover 进入托管箭头 */
export const TT_MARKETING_ORDERS_CARD_OPEN_CHEVRON =
  "pointer-events-none absolute right-3 top-1/2 z-[15] hidden -translate-y-1/2 text-ref-sun/75 opacity-0 motion-safe:transition-all motion-safe:duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block motion-reduce:transition-none motion-reduce:group-hover:translate-y-[-50%]";

/** 我的订单 · 滚动后固定筛选条 */
export const TT_MARKETING_ORDERS_STICKY_FILTER_DOCK =
  "fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[9] border-b border-ref-sun/22 bg-[#faf8f6]/94 px-4 py-2.5 shadow-[0_10px_28px_-16px_rgba(252,164,124,0.32)] backdrop-blur-md supports-[backdrop-filter]:bg-[#faf8f6]/86 sm:top-14";

/** 我的订单 · 筛选条（纯 CSS sticky · 替代 JS dock） */
export const TT_MARKETING_ORDERS_STICKY_FILTER_RAIL =
  "sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[9] mb-5 rounded-[var(--radius-xl)] border border-ref-sun/24 bg-gradient-to-b from-white/88 via-bg-console/92 to-bg-soft/70 px-4 py-3 shadow-[0_8px_28px_-18px_rgba(252,164,124,0.22)] backdrop-blur-md supports-[backdrop-filter]:from-white/82 sm:top-14 sm:px-5";

/** 我的订单 · 筛选条（嵌入工具栏时无独立壳） */
export const TT_MARKETING_ORDERS_FILTER_RAIL_EMBEDDED = "space-y-2";

/**
 * `/orders` · 深色玻璃内胆（同源 `/` `HOME_FORM_PANEL` · 列表 Hero/工具栏/卡片共用）
 */
export const TT_MARKETING_ORDERS_DARK_GLASS_INNER =
  "rounded-[calc(var(--radius-xl)-1px)] border border-white/15 bg-slate-950/55 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

/** 我的订单 · 筛选条标题 */
export const TT_MARKETING_ORDERS_FILTER_RAIL_LABEL = `text-small font-medium ${TT_MARKETING_ORDERS_TEXT_BODY}`;

/** 我的订单 · 列表工具栏 sticky 外壳 */
export const TT_MARKETING_ORDERS_TOOLBAR_STICKY =
  "sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[9] mb-4 sm:top-14";

/** 我的订单 · 列表工具栏渐变框（保留 · 非列表默认壳） */
export const TT_MARKETING_ORDERS_TOOLBAR_FRAME = TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE;

/** 我的订单 · 列表工具栏内胆（暖金框版） */
export const TT_MARKETING_ORDERS_TOOLBAR_INNER =
  `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} px-4 py-4 sm:px-5 sm:py-5`;

/** 我的订单 · 列表工具栏扁平壳（无第二层暖金框 · 列表默认） */
export const TT_MARKETING_ORDERS_TOOLBAR_SHELL =
  `${TT_MARKETING_ORDERS_TOOLBAR_STICKY} border-t border-white/10 bg-[#0c0a09]/82 backdrop-blur-md -mt-1`;

/** 我的订单 · 列表工具栏扁平内区 */
export const TT_MARKETING_ORDERS_TOOLBAR_INNER_FLAT = "space-y-2.5 py-3 sm:py-4";

/** Hero 范围说明（单行 · 非 callout 面板） */
export const TT_MARKETING_ORDERS_HERO_SCOPE_NOTE =
  `text-meta leading-snug ${TT_MARKETING_ORDERS_TEXT_META}`;

/** 我的订单 · 卡片金额行 */
export const TT_MARKETING_ORDERS_AMOUNT_ROW = "mt-2.5 flex items-baseline gap-1.5";

/** 我的订单 · 筛选胶囊横向滚动（小屏） */
export const TT_MARKETING_ORDERS_FILTER_BAR_SCROLL =
  "min-w-0 flex-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** 我的订单 · 筛选条滑动指示 pill */
export const TT_MARKETING_ORDERS_FILTER_TAB_INDICATOR = `pointer-events-none absolute inset-y-1.5 rounded-[var(--radius-md)] ${TT_MARKETING_ACTION_GRADIENT_FILL} ${TT_MARKETING_ACTION_GRADIENT_SHADOW} ring-1 ring-ref-sun/30 shadow-[0_0_18px_-8px_rgba(252,164,124,0.55)] motion-safe:transition-[left,width] motion-safe:duration-200 motion-reduce:transition-none`;

/** 我的订单 · 筛选条选中 tab 文案（叠在指示 pill 上） */
export const TT_MARKETING_ORDERS_FILTER_TAB_ON_INDICATOR = "relative z-10 text-white font-semibold";

/** 我的订单 · 搜索条外壳 */
export const TT_MARKETING_ORDERS_SEARCH_WRAP =
  "mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3";

/** 我的订单 · 搜索输入 */
export const TT_MARKETING_ORDERS_SEARCH_INPUT =
  "w-full min-w-0 rounded-[var(--radius-lg)] border border-ref-sun/32 bg-ink-900/85 px-4 py-2.5 pl-10 text-small text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] placeholder:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] motion-sub";

/** 我的订单 · 搜索图标位 */
export const TT_MARKETING_ORDERS_SEARCH_ICON =
  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ref-sun/85";

/** 我的订单 · 搜索清除按钮 */
export const TT_MARKETING_ORDERS_SEARCH_CLEAR_BTN =
  "absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 motion-sub hover:bg-ref-sun/12 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 搜索无结果图标 */
export const TT_MARKETING_ORDERS_SEARCH_EMPTY_ICON =
  "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-ref-sun/30 bg-gradient-to-br from-ref-sun/14 to-ref-coral/8 text-2xl text-ref-sun/90 shadow-[0_0_24px_-10px_rgba(252,164,124,0.4)]";

/** 我的订单 · 搜索命中高亮 */
export const TT_MARKETING_ORDERS_SEARCH_HIGHLIGHT_MARK =
  "rounded-[0.2rem] bg-ref-sun/30 px-0.5 text-inherit ring-1 ring-ref-sun/40 [box-decoration-break:clone]";

/** 我的订单 · 搜索范围提示 */
export const TT_MARKETING_ORDERS_SEARCH_SCOPE_HINT =
  `text-meta ${TT_MARKETING_ORDERS_TEXT_META} leading-snug text-center max-w-md mx-auto`;

/** 我的订单 · 已激活筛选条（状态 + 搜索） */
export const TT_MARKETING_ORDERS_ACTIVE_FILTERS_BAR =
  "mb-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-ref-sun/18 bg-slate-950/45 px-3 py-2.5 shadow-[0_8px_28px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md";

/** 我的订单 · 已激活筛选条标签 */
export const TT_MARKETING_ORDERS_ACTIVE_FILTERS_LABEL = `text-meta font-medium ${TT_MARKETING_ORDERS_TEXT_BODY} shrink-0`;

/** 我的订单 · 清除全部筛选 */
export const TT_MARKETING_ORDERS_CLEAR_ALL_FILTERS_BTN =
  "ml-auto inline-flex min-h-[36px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/30 bg-ref-sun/12 px-3 py-1.5 text-small font-semibold text-ref-sun motion-sub hover:bg-ref-sun/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 搜索匹配中指示 */
export const TT_MARKETING_ORDERS_SEARCH_PENDING_DOT =
  "inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ref-sun/80 motion-safe:animate-pulse motion-reduce:animate-none";

/** 我的订单 · 卡片左滑外壳（小屏） */
export const TT_MARKETING_ORDERS_CARD_SWIPE_SHELL =
  "relative overflow-hidden rounded-[var(--radius-xl)] touch-pan-y sm:overflow-visible sm:touch-auto";

/** 我的订单 · 卡片左滑露出托盘 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_TRAY =
  "absolute inset-y-0 right-0 z-0 flex w-[8.25rem] items-stretch sm:hidden";

/** 我的订单 · 卡片左滑面（随手指位移） */
export const TT_MARKETING_ORDERS_CARD_SWIPE_SURFACE =
  "relative z-[1] motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transition-none sm:!translate-x-0";

/** 我的订单 · 卡片左滑快捷按钮 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_ACTION =
  "flex min-h-full min-w-[2.75rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center text-[0.68rem] font-semibold leading-tight motion-sub motion-safe:active:scale-[0.96] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 卡片左滑预览 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_PREVIEW =
  `${TT_MARKETING_ORDERS_CARD_SWIPE_ACTION} bg-gradient-to-b from-ref-sun/22 to-ref-sun/10 text-slate-100`;

/** 我的订单 · 卡片左滑托管 / 继续 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_ESCROW =
  `${TT_MARKETING_ORDERS_CARD_SWIPE_ACTION} bg-gradient-to-b from-ref-coral/18 to-ref-sun/12 text-[#0c0a09]`;

/** 我的订单 · 卡片左滑删除 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_DELETE =
  `${TT_MARKETING_ORDERS_CARD_SWIPE_ACTION} bg-danger/12 text-danger`;

/** 我的订单 · 卡片左滑左缘暖光 */
export const TT_MARKETING_ORDERS_CARD_SWIPE_EDGE_GLOW =
  "pointer-events-none absolute inset-y-0 left-0 z-[2] w-3 bg-gradient-to-r from-ref-sun/40 via-ref-sun/12 to-transparent sm:hidden";

/** 我的订单 · 筛选 tab 数量徽章（未选中） */
export const TT_MARKETING_ORDERS_FILTER_TAB_COUNT_BADGE =
  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums bg-ref-sun/14 text-ref-sun/95 ring-1 ring-ref-sun/28";

/** 我的订单 · 筛选 tab 数量徽章（选中 · 叠在指示 pill 上） */
export const TT_MARKETING_ORDERS_FILTER_TAB_COUNT_ON_INDICATOR =
  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums bg-white/22 text-white ring-1 ring-white/35";

/** 我的订单 · 筛选 tab 计数变化 bump（加载更多后） */
export const TT_MARKETING_ORDERS_FILTER_TAB_COUNT_BUMP = "orders-list-l5-count-bump";

/** 我的订单 · 键盘聚焦卡片环 */
export const TT_MARKETING_ORDERS_LIST_CARD_KEYBOARD_FOCUS =
  "ring-2 ring-ref-sun/55 ring-offset-2 ring-offset-[#0c0a09] motion-reduce:transition-none";

/** 我的订单 · 列表提示条（左暖色强调 · 遗留） */
export const TT_MARKETING_ORDERS_HINT_BAR =
  `mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-[var(--radius-lg)] border border-white/15 bg-slate-950/55 px-4 py-2.5 shadow-[0_8px_28px_-18px_rgba(0,0,0,0.42)] backdrop-blur-xl ${TT_MARKETING_ORDERS_TEXT_BODY}`;

/** 我的订单 · 可折叠操作提示条（默认收起 · 无框；展开才显玻璃） */
export const TT_MARKETING_ORDERS_HINT_BAR_SLIM =
  "group mb-2 border-t border-white/[0.08] pt-2 open:mb-3 open:rounded-[var(--radius-lg)] open:border open:border-white/10 open:border-t-white/10 open:bg-slate-950/40 open:px-3 open:py-2.5 open:backdrop-blur-sm motion-reduce:transition-none transition-[background-color,border-color,padding,margin] duration-200";

export const TT_MARKETING_ORDERS_HINT_TOGGLE_BTN =
  "flex w-full min-h-[32px] cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-sm)] text-meta font-medium text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] [&::-webkit-details-marker]:hidden";

export const TT_MARKETING_ORDERS_HINT_CHEVRON =
  "h-3.5 w-3.5 shrink-0 text-ref-sun/75 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180";

export const TT_MARKETING_ORDERS_HINT_BODY =
  `mt-2 space-y-1.5 text-meta leading-relaxed ${TT_MARKETING_ORDERS_TEXT_META}`;

/** 我的订单 · 卡片操作列（无独立渐变盒） */
export const TT_MARKETING_ORDERS_CARD_ACTIONS_STACK =
  "relative z-20 flex w-full shrink-0 flex-col gap-2 pointer-events-auto sm:w-auto sm:min-w-[10.5rem]";

export const TT_MARKETING_ORDERS_CARD_SECONDARY_ROW = "flex flex-wrap gap-2";

export const TT_MARKETING_ORDERS_CARD_SECONDARY_BTN =
  "inline-flex min-h-[36px] min-w-[5.5rem] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-white/18 bg-slate-950/40 px-3 py-1.5 text-meta font-medium text-slate-200 hover:border-ref-sun/35 hover:bg-ref-sun/10 hover:text-white motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

export const TT_MARKETING_ORDERS_CARD_DELETE_BTN_COMPACT =
  "inline-flex min-h-[36px] min-w-[5.5rem] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-danger/40 bg-danger/8 px-3 py-1.5 text-meta font-medium text-red-300 hover:border-danger/55 hover:bg-danger/14 hover:text-red-200 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-50";

export const TT_MARKETING_ORDERS_META_ICON = "h-3.5 w-3.5 shrink-0 opacity-90";

/** 我的订单 · 列表已全部加载图标 */
export const TT_MARKETING_ORDERS_LIST_END_ICON =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-ref-sun/38 bg-ref-sun/12 text-sm font-semibold text-ref-sun/90 shadow-[0_0_14px_-6px_rgba(252,164,124,0.35)]";

/** 我的订单 · 卡片金额数值 */
export const TT_MARKETING_ORDERS_AMOUNT_VALUE = `text-h4 sm:text-[1.65rem] font-bold tabular-nums tracking-tight leading-none ${TT_MARKETING_ACTION_STAT_EMPHASIS}`;

/** 我的订单 · 卡片金额币种 */
export const TT_MARKETING_ORDERS_AMOUNT_CURRENCY = `text-body font-medium ${TT_MARKETING_ORDERS_TEXT_BODY}`;

/** 我的订单 · 状态徽章基础（圆角 pill） */
export const TT_MARKETING_ORDERS_STATUS_BADGE_BASE = "inline-flex rounded-full px-2.5 py-0.5 text-meta font-semibold";

/** 我的订单 · 移动端底栏 CTA */
export const TT_MARKETING_ORDERS_MOBILE_ACTION_BAR =
  "md:hidden fixed inset-x-0 bottom-0 z-[9] border-t border-white/10 bg-[#14100d]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_32px_rgba(0,0,0,0.55)] backdrop-blur-md";

/** 我的订单 · 草稿封面角标 */
export const TT_MARKETING_ORDERS_CARD_DRAFT_RIBBON =
  "absolute left-3 top-3 z-20 rounded-full border border-ref-sun/45 bg-gradient-to-r from-ref-sun/95 to-ref-coral/90 px-2.5 py-0.5 text-meta font-semibold text-white shadow-[0_4px_14px_-6px_rgba(252,164,124,0.55)]";

/** 我的订单 · 删除中遮罩 */
export const TT_MARKETING_ORDERS_CARD_DELETING_OVERLAY =
  "pointer-events-none absolute inset-0 z-[25] flex items-center justify-center rounded-[calc(var(--radius-xl)-1px)] bg-[#0c0a09]/76 backdrop-blur-[2px]";

/** 我的订单 · 同步进度条轨道 */
export const TT_MARKETING_ORDERS_SYNCING_PROGRESS_TRACK =
  "h-1 w-full overflow-hidden rounded-full bg-ref-sun/16";

/** 我的订单 · 同步进度条填充 */
export const TT_MARKETING_ORDERS_SYNCING_PROGRESS_FILL = "orders-list-l5-sync-progress h-full w-1/3 rounded-full bg-gradient-to-r from-ref-sun/40 via-ref-sun to-ref-coral/80";

/** 我的订单 · 筛选空态图标 */
export const TT_MARKETING_ORDERS_FILTER_EMPTY_ICON =
  "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-ref-sun/32 bg-slate-950/80 text-xl text-ref-sun/90 shadow-[0_0_18px_-8px_rgba(252,164,124,0.35)]";

/**
 * `/orders` · 深色 cinematic 页壳（同源 `/`：纯色底 + vignette/glow/dot · 无 Ken Burns 照片）
 */
/** 我的订单 · 页壳 */
export const TT_MARKETING_ORDERS_PAGE_SHELL =
  "min-h-screen relative overflow-x-hidden bg-[#0c0a09] text-slate-100 antialiased";

/** 我的订单 · 页身内区（同源 `/` `max-w-5xl` 节奏） */
export const TT_MARKETING_ORDERS_PAGE_INNER =
  "mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10";

/** 我的订单 · 页标题（同源 `/` `HOME_HERO_TITLE` · 左对齐产品页） */
export const TT_MARKETING_ORDERS_PAGE_TITLE =
  `text-h2 font-bold tracking-tight drop-shadow-landing-hero ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

/** 我的订单 · 说明 callout（同源 `/` `HOME_FORM_PANEL` 玻璃） */
export const TT_MARKETING_ORDERS_CALLOUT_PANEL =
  `relative overflow-hidden rounded-[var(--radius-lg)] border border-white/15 bg-slate-950/55 backdrop-blur-xl px-4 py-3 text-meta leading-snug ${TT_MARKETING_ORDERS_TEXT_BODY} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`;

/** 我的订单 · 页脚包裹（同源 `/` 页脚前收束） */
export const TT_MARKETING_ORDERS_FOOTER_WRAP = "relative mt-12";

/** 我的订单 · vignette（同源 `/` `bg-experience-landing-vignette`） */
export const TT_MARKETING_ORDERS_PAGE_VIGNETTE = TT_MARKETING_HOME_AMBIENT_SCRIM;

/** 我的订单 · 氛围光（同源 `/` `HOME_AMBIENT_GLOW`） */
export const TT_MARKETING_ORDERS_PAGE_AMBIENT = TT_MARKETING_HOME_AMBIENT_GLOW;

/** 我的订单 · 页头框（暖金描边 · 同源 `/` `HOME_HERO_CARD_FRAME` 入场） */
export const TT_MARKETING_ORDERS_PAGE_HERO_FRAME =
  `${TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE} animate-fadeUp`;

export const TT_MARKETING_ORDERS_PAGE_HERO_INNER =
  `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} px-4 py-5 sm:px-6 sm:py-6`;

/** 我的订单 · Hero/工具栏内胆暖光（同源 `/` `HOME_FORM_INNER_GLOW`） */
export const TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW =
  "pointer-events-none absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(252,164,124,0.14),transparent_50%),radial-gradient(circle_at_100%_40%,rgba(240,168,120,0.12),transparent_45%)]";

/** 我的订单 · kicker（同源 `/` Hero kicker · 提亮可读） */
export const TT_MARKETING_ORDERS_PAGE_KICKER =
  "text-meta font-semibold uppercase tracking-[0.2em] text-[#ffe8d4]";

/** 我的订单 · 列表区分隔（同源 `/` `HOME_SECTION_BRIDGE_LINE`） */
export const TT_MARKETING_ORDERS_PAGE_SECTION_BRIDGE_LINE = TT_MARKETING_HOME_SECTION_BRIDGE_LINE;

/** 我的订单 · 卡片暖金外框（同源 `/` `WARM_L5_CARD_FRAME_CONSOLE` + 列表 hover） */
export const TT_MARKETING_ORDERS_LIST_CARD_FRAME =
  `${TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE} motion-reduce:transition-none transition-[box-shadow,transform] duration-200 hover:shadow-[0_0_56px_-10px_rgba(252,164,124,0.28)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`;

/** `/market` 解冻 L5 · 与 `/` · `/orders` 同源（2026-05-29 · MARKET-UI-THAW） */
export const TT_MARKETING_MARKET_L5_HERO_FRAME = TT_MARKETING_HOME_HERO_CARD_FRAME;

export const TT_MARKETING_MARKET_L5_HERO_INNER =
  "relative rounded-[calc(var(--radius-xl)-1px)] border border-white/12 bg-slate-950/50 backdrop-blur-md px-4 py-6 sm:px-8 sm:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

/** Hero 副标题 · 同源 `/` 辅助链 #ffe8d4 */
export const TT_MARKETING_MARKET_L5_HERO_SUBTITLE =
  "mt-3 text-body text-[#ffe8d4]/95 text-center drop-shadow-market-body max-w-3xl mx-auto leading-relaxed";

/** Hero 区次要标签（筛选天数等） */
export const TT_MARKETING_MARKET_L5_HERO_META =
  "text-meta font-medium text-[#e8ddd4]/90 tracking-wide";

/** 流程提示带 · 轻于 Hero 全框，避免首屏双大卡 stacked */
export const TT_MARKETING_MARKET_L5_FLOW_BANNER_FRAME =
  "w-full rounded-[var(--radius-md)] border border-ref-sun/20 bg-gradient-to-b from-slate-950/68 via-[#12100e]/82 to-[#0a0a0a]/88 backdrop-blur-md ring-1 ring-inset ring-white/[0.06] shadow-[0_8px_28px_-20px_rgba(0,0,0,0.7)]";

export const TT_MARKETING_MARKET_L5_FLOW_BANNER_INNER =
  "px-4 py-3 sm:px-5 sm:py-3.5 text-center";

export const TT_MARKETING_MARKET_L5_FLOW_BANNER_TITLE =
  "m-0 text-small sm:text-body font-semibold text-white tracking-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)] [color:#ffffff]";

export const TT_MARKETING_MARKET_L5_FLOW_BANNER_COUNT =
  "font-bold text-ref-sun [color:var(--ref-sun)]";

export const TT_MARKETING_MARKET_L5_FLOW_BANNER_SUB =
  "m-0 mt-1.5 text-meta text-[#e8ddd4]/90 leading-snug max-w-2xl mx-auto";

export const TT_MARKETING_MARKET_L5_FLOW_BANNER_CTA_ROW =
  "mt-3 flex flex-wrap justify-center gap-2";

export const TT_MARKETING_MARKET_L5_LIST_CARD_FRAME = TT_MARKETING_ORDERS_LIST_CARD_FRAME;

export const TT_MARKETING_MARKET_L5_LIST_CARD_INNER =
  "rounded-[calc(var(--radius-xl)-1px)] overflow-hidden bg-gradient-to-b from-[#1a1410]/95 via-[#14100c]/98 to-[#0f0c0a]/98 backdrop-blur-md";

export const TT_MARKETING_MARKET_L5_PAGE_MAX = "mx-auto w-full max-w-5xl";

/** `/market` L5 空态 · 与首页 Hero / 我的订单空态同源暖金玻璃 */
export const TT_MARKETING_MARKET_L5_EMPTY_FRAME = TT_MARKETING_HOME_HERO_CARD_FRAME;

export const TT_MARKETING_MARKET_L5_EMPTY_INNER =
  "rounded-[calc(var(--radius-xl)-1px)] border border-white/10 bg-slate-950/48 backdrop-blur-md px-5 py-8 sm:px-8 sm:py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-center";

export const TT_MARKETING_MARKET_L5_EMPTY_ICON =
  "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-ref-sun/35 bg-ref-sun/12 text-xl text-ref-sun shadow-[0_0_24px_-8px_rgba(252,164,124,0.45)]";

export const TT_MARKETING_MARKET_L5_EMPTY_STEPS =
  "mt-5 grid gap-2 text-left sm:grid-cols-3 sm:gap-3";

export const TT_MARKETING_MARKET_L5_EMPTY_STEP =
  "rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-meta leading-snug text-slate-200/95";

export const TT_MARKETING_MARKET_L5_CONTENT_BRIDGE = TT_MARKETING_HOME_SECTION_BRIDGE;

export const TT_MARKETING_ORDERS_LIST_CARD_INNER =
  `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} overflow-hidden`;

/** 我的订单 · 封面 ring */
export const TT_MARKETING_ORDERS_COVER_RING =
  "ring-1 ring-ref-sun/22 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";

/** 我的订单 · 空态暖框卡 */
export const TT_MARKETING_ORDERS_EMPTY_CARD =
  `rounded-[var(--radius-xl)] border border-ref-sun/22 ${TT_MARKETING_ORDERS_DARK_GLASS_INNER} px-6 py-12 text-center shadow-[0_8px_32px_-18px_rgba(0,0,0,0.48)]`;

/** 我的订单 · 筛选胶囊条容器（同源 `/` 深色玻璃 field） */
export const TT_MARKETING_ORDERS_FILTER_BAR =
  "flex flex-wrap gap-1.5 rounded-[var(--radius-lg)] border border-white/15 bg-slate-950/50 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md";

/** 我的订单 · 筛选 tab 选中（首页 Action 实心渐变 · 白字高对比） */
export const TT_MARKETING_ORDERS_FILTER_TAB_SELECTED = `border border-transparent ${TT_MARKETING_ACTION_GRADIENT_FILL} text-white font-semibold ${TT_MARKETING_ACTION_GRADIENT_SHADOW} ring-1 ring-ref-sun/30 shadow-[0_0_18px_-8px_rgba(252,164,124,0.55)]`;

/** 我的订单 · 筛选 tab 未选中 */
export const TT_MARKETING_ORDERS_FILTER_TAB_IDLE =
  "border border-transparent bg-transparent text-slate-200 hover:border-ref-sun/22 hover:bg-ref-sun/[0.1] hover:text-white motion-sub motion-safe:active:scale-[0.98] motion-reduce:active:scale-100";

/** 我的订单 · 列表数量徽章 */
export const TT_MARKETING_ORDERS_LIST_COUNT_BADGE =
  "inline-flex items-center rounded-full border border-ref-sun/35 bg-ref-sun/12 px-2.5 py-0.5 text-meta font-semibold tabular-nums text-ref-sun/95 shadow-[0_0_12px_-6px_rgba(252,164,124,0.3)]";

/** 我的订单 · 卡片主操作（托管详情 · 暖金实心） */
export const TT_MARKETING_ORDERS_CARD_ESCROW_BTN =
  `inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/45 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-sub motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`;

/** 我的订单 · 卡片次操作（行程预览 · 暗底暖描边） */
export const TT_MARKETING_ORDERS_CARD_PREVIEW_BTN =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/42 bg-slate-950/55 px-4 py-2 text-small font-semibold text-slate-50 shadow-[0_4px_16px_rgba(0,0,0,0.32)] hover:border-ref-sun/58 hover:bg-ref-sun/12 hover:text-white motion-sub motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 卡片删除（深色底 · 高对比红字） */
export const TT_MARKETING_ORDERS_CARD_DELETE_BTN =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-danger/55 bg-danger/10 px-4 py-2 text-small font-semibold text-red-300 shadow-[0_4px_16px_rgba(0,0,0,0.28)] hover:border-danger/70 hover:bg-danger/16 hover:text-red-200 motion-sub motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 我的订单 · 卡片操作列底 */
export const TT_MARKETING_ORDERS_CARD_ACTIONS_PANEL =
  "rounded-[var(--radius-lg)] border border-ref-sun/18 bg-gradient-to-b from-ref-sun/[0.12] via-slate-950/55 to-ref-sun/[0.06] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-w-[11rem]";

/** 我的订单 · 状态徽章（暖金 · 已发布等） */
export const TT_MARKETING_ORDER_STATUS_BADGE_WARM =
  `${TT_MARKETING_ORDERS_STATUS_BADGE_BASE} bg-ref-sun/16 text-ref-sun ring-1 ring-ref-sun/40 shadow-[0_0_12px_-6px_rgba(252,164,124,0.35)]`;

/** 我的订单 · Hero 主 CTA（同源 `/` 暖金 Action · 深字） */
export const TT_MARKETING_ORDERS_HERO_CTA =
  `inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-6 py-2.5 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} shadow-[0_0_22px_-8px_rgba(252,164,124,0.58)] hover:brightness-110 hover:-translate-y-0.5 motion-sub motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`;

/** Console 浅底进度条分段（报价拆分条等） */
export const TT_MARKETING_PROGRESS_BAR_SEGMENT_LIGHT = "bg-ref-sun/70 min-w-[2px]";

/** 行程列表时间轴圆点/竖线（浅色 Console） */
export const TT_MARKETING_ITIN_TIMELINE_DOT = "bg-ref-sun/50";
export const TT_MARKETING_ITIN_TIMELINE_LINE = "bg-ref-sun/40";

/** Console 内 hover 强调（折叠标题等，非下划线链） */
export const TT_MARKETING_CONSOLE_HOVER_ACCENT = "hover:text-ref-coral/95";

/** 行程日 tab · 选中（圆角 pill） */
export const TT_MARKETING_ITIN_DAY_TAB_SELECTED =
  "border-ref-sun/55 bg-ref-sun/10 text-ink-900 font-medium";

export const TT_MARKETING_BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/22 bg-white/10 px-4 py-2.5 text-small font-medium text-white backdrop-blur-sm transition hover:bg-white/16 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const TT_MARKETING_BTN_NETWORK_LINK =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ref-cyan/35 bg-transparent px-4 py-2.5 text-small font-medium text-ref-cyan/95 transition hover:border-ref-cyan/55 hover:bg-ref-cyan/10 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const TT_MARKETING_HOME_FORM_FRAME = TT_MARKETING_HOME_HERO_CARD_FRAME;

export const TT_MARKETING_HOME_FORM_PANEL =
  "relative w-full rounded-[var(--radius-xl)] border border-white/15 bg-slate-950/55 backdrop-blur-xl backdrop-saturate-150";

/** 仅裁切内发光至圆角；勿在 FORM_PANEL 上用 overflow-hidden（会裁切日期弹层底边） */
export const TT_MARKETING_HOME_FORM_PANEL_GLOW_CLIP =
  "pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)]";

export const TT_MARKETING_HOME_FORM_INNER_GLOW =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(252,164,124,0.14),transparent_50%),radial-gradient(circle_at_100%_40%,rgba(240,168,120,0.12),transparent_45%)]";

/** `/` Hero 出行日期区间 · 日历弹层（圆角四边 + 底栏分隔，勿被 FORM_PANEL 裁切） */
export const TT_MARKETING_HOME_CALENDAR_POPOVER =
  "absolute left-0 top-full z-[110] mt-1.5 min-w-[280px] overflow-hidden rounded-[var(--radius-xl)] border border-white/25 bg-slate-900/98 shadow-[0_18px_50px_-14px_rgba(0,0,0,0.85)] backdrop-blur-md ring-1 ring-inset ring-white/[0.07]";

export const TT_MARKETING_HOME_CALENDAR_POPOVER_FOOTER =
  "border-t border-white/14 bg-gradient-to-b from-slate-900/50 to-slate-950/95 px-4 py-3";

export const TT_MARKETING_HOME_SUBMIT_FAB =
  `w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} text-[#0c0a09] flex items-center justify-center ${TT_MARKETING_ACTION_GRADIENT_SHADOW} transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/80`;

export const TT_MARKETING_HOME_CALENDAR_DAY_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55";

/** `/` Hero 深色玻璃表单控件 focus（日期/数字输入；替代 Tailwind 原生 cyan/white 混写） */
export const TT_MARKETING_HOME_GLASS_FIELD_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

export const TT_MARKETING_HOME_GLASS_FIELD_FOCUS_INSET =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset";

/** `/` Hero 人数/房间等小整数输入（可键盘删空重打 · 无浏览器 stepper） */
export const TT_MARKETING_HOME_GLASS_COUNT_INPUT =
  `${TT_MARKETING_HOME_GLASS_FIELD_FOCUS} w-full min-h-[44px] h-11 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-center text-white text-small tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::placeholder]:text-white/50`;

/** `/` Hero 预算外框（单位已在 label · 框内仅 $ + 数字，避免 USDT/USDC 挤占） */
export const TT_MARKETING_HOME_GLASS_BUDGET_SHELL =
  "flex h-11 min-h-[44px] w-full min-w-[7.5rem] sm:min-w-[9rem] items-center gap-1 rounded-[var(--radius-xl)] border border-white/30 bg-white/20 backdrop-blur-sm px-2.5";

/** `/` Hero 预算输入（无 spinner · tabular-nums · 与 COUNT 同系玻璃） */
export const TT_MARKETING_HOME_GLASS_BUDGET_INPUT =
  `${TT_MARKETING_HOME_GLASS_FIELD_FOCUS_INSET} min-w-0 flex-1 bg-transparent py-0 text-left text-white text-small tabular-nums [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder:text-white/50`;

/** `/` Hero 日期格选中/范围（暖金 Action · 非 cyan-400/500） */
export const TT_MARKETING_HOME_CALENDAR_DAY_SELECTED = `${TT_MARKETING_ACTION_GRADIENT_FILL} text-[#0c0a09] font-semibold`;
export const TT_MARKETING_HOME_CALENDAR_DAY_IN_RANGE = "bg-white/15 text-white";

/** `/traveltrust` · 深色区主钮（Site Theme V1 暖金 · 与 `TT_MARKETING_BTN_PRIMARY_WARM` 同族） */
export const TT_MARKETING_BTN_PRIMARY_TRUST = TT_MARKETING_BTN_PRIMARY_WARM;

export const TT_MARKETING_BTN_GHOST =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-lg)] border border-white/18 bg-ink-900/45 px-4 py-2.5 text-small font-medium text-slate-200 transition hover:border-ref-cyan/35 hover:bg-ink-900/65 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55";

/** `/traveltrust` 页脚全站横链（无 · 分隔，gap 换行） */
export const TT_MARKETING_TRAVELTRUST_NETWORK_FOOTER_CROSS_NAV =
  "mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-small max-w-4xl mx-auto";

export const TT_MARKETING_TRAVELTRUST_NETWORK_FOOTER_CROSS_LINK =
  "inline-flex min-h-[44px] items-center justify-center px-1 text-small font-medium text-slate-300 underline-offset-2 hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

/** `/traveltrust` #start · 费路由收起：文字链行（`+` 贴文案，避免宽屏悬空） */
export const TT_MARKETING_TRAVELTRUST_FEE_ROUTER_LINK =
  "inline-flex min-h-[44px] max-w-xl items-center justify-start gap-2 rounded-md border-0 bg-transparent px-0 py-1 text-left text-meta font-medium text-slate-300 underline decoration-white/15 underline-offset-[0.35em] transition hover:text-ref-sun hover:decoration-ref-sun/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

export const TT_MARKETING_TRAVELTRUST_FEE_ROUTER_PANEL =
  "overflow-hidden rounded-lg border border-white/12 bg-ink-900/40";

export const TT_MARKETING_TRAVELTRUST_FEE_ROUTER_PANEL_TRIGGER =
  "flex min-h-[44px] w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3 text-left text-meta font-medium text-slate-300 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 sm:px-5 sm:py-3.5";

/** `/traveltrust` 页脚右栏 · 段眉（11px 全大写，仅段 eyebrow 用） */
export const TT_MARKETING_TRAVELTRUST_FOOTER_NAV_KICKER =
  "text-kicker font-semibold uppercase tracking-[0.16em] text-ref-teal/75";

/** `/traveltrust` 页脚分组标题（产品与订单 / 快捷入口等 · 14px 可读） */
export const TT_MARKETING_TRAVELTRUST_FOOTER_NAV_GROUP_TITLE =
  "text-small font-semibold text-slate-200";

export const TT_MARKETING_TRAVELTRUST_FOOTER_NAV_LINK =
  "inline-flex min-h-[44px] max-w-[14rem] items-center truncate text-meta font-medium text-slate-300 underline-offset-2 hover:text-ref-cyan hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

export const TT_MARKETING_TRAVELTRUST_NETWORK_FOOTER_CROSS_NAV_GROUPED =
  "mb-2 w-full space-y-4";

export const TT_MARKETING_TRAVELTRUST_NETWORK_FOOTER_CROSS_NAV_ROW =
  "mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:max-w-none sm:gap-x-5 sm:gap-y-2 lg:grid-cols-2 xl:grid-cols-3";

/** 页脚横链 · 信任组（窄屏默认折叠） */
export const TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_DETAILS =
  "group mt-4 border-t border-white/8 pt-4 md:mt-0 md:border-0 md:pt-0";

export const TT_MARKETING_TRAVELTRUST_FOOTER_CROSS_NAV_TRUST_SUMMARY =
  "flex min-h-[44px] cursor-pointer list-none items-center justify-between text-small font-semibold text-slate-200 md:hidden [&::-webkit-details-marker]:hidden";

/** 页脚「全站入口」等辅助链（弱于横链主链） */
export const TT_MARKETING_TRAVELTRUST_FOOTER_SITE_MAP_LINK =
  "inline-flex min-h-[40px] items-center text-small font-medium text-slate-500 underline-offset-2 transition hover:text-slate-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

export const TT_MARKETING_TRAVELTRUST_FOOTER_QUICK_LINK_LIST = "mt-2 flex flex-col items-start gap-1";

export const TT_MARKETING_TRAVELTRUST_FOOTER_COMPLIANCE_DETAILS =
  "group mt-3 max-w-lg text-meta leading-relaxed text-slate-400";

export const TT_MARKETING_TRAVELTRUST_FOOTER_COMPLIANCE_SUMMARY =
  "inline-flex min-h-[40px] cursor-pointer list-none items-center gap-2 font-medium text-slate-300 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50 [&::-webkit-details-marker]:hidden";

export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW =
  "mt-4 flex flex-wrap items-center gap-3";

/** 首页页脚社媒行居中 */
export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ROW_CENTER =
  "mt-3 flex flex-wrap items-center justify-center gap-2";

/** `/traveltrust` 页脚右栏 · 动效说明 */
export const TT_MARKETING_TRAVELTRUST_FOOTER_MOTION_HINT =
  "max-w-sm text-meta leading-relaxed text-slate-400";

export const TT_MARKETING_TRAVELTRUST_FOOTER_MOTION_HELP_LINK =
  "mt-1 inline-flex min-h-[40px] items-center text-small font-medium text-slate-400 underline-offset-2 transition hover:text-ref-cyan hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/12 bg-white/5 text-slate-300 transition hover:border-ref-cyan/35 hover:bg-ref-cyan/10 hover:text-ref-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

/** 社媒槽位已预留、env URL 未配置 */
export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_ICON_LINK_PENDING =
  "inline-flex min-h-[36px] min-w-[36px] cursor-not-allowed items-center justify-center rounded-md border border-ref-sun/14 bg-ink-900/45 text-slate-500/80 sm:min-h-[40px] sm:min-w-[40px]";

export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_PENDING_NOTE =
  "mt-1.5 text-meta text-slate-500";

export const TT_MARKETING_TRAVELTRUST_FOOTER_SOCIAL_DISCLAIMER =
  "mt-2 max-w-lg text-meta leading-relaxed text-slate-500";

/** Hero 次按钮：细描边、无填充，与暖色主 CTA 区分（TT-PH1-153） */
export const TT_MARKETING_BTN_GHOST_HERO =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-ref-cyan/22 bg-ink-950/35 px-4 py-2.5 text-small font-medium text-slate-100/95 transition hover:border-ref-cyan/45 hover:bg-ref-cyan/8 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

/** Hero 次 CTA：纯文字链，避免三框同形（TT-PH1-153） */
export const TT_MARKETING_BTN_GHOST_LINK =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-md px-2 py-2 text-small font-medium text-slate-300/95 underline-offset-4 transition hover:text-ref-cyan hover:underline motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50";

export const TT_MARKETING_HERO_CTA_DOCK =
  "w-full space-y-3 p-0 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] max-[390px]:pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:space-y-3.5 sm:pb-[max(1.375rem,env(safe-area-inset-bottom,0px))]";

export const TT_MARKETING_BTN_WALLET =
  "inline-flex min-h-[48px] min-w-[min(100%,11rem)] items-center justify-center rounded-[var(--radius-lg)] border-2 border-ref-cyan/45 bg-ref-cyan/12 px-6 py-2.5 text-small font-semibold text-white shadow-[0_4px_24px_rgba(35,206,217,0.22)] transition hover:border-ref-cyan/70 hover:bg-ref-cyan/20 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-55";

/** —— 信任话术（`/` + `/traveltrust`） —— */
export const TT_MARKETING_TRUST_BADGE_HOME =
  "rounded-full border border-ref-sun/38 bg-slate-950/40 backdrop-blur-md px-3 py-1 text-meta font-medium text-white/92 shadow-[0_4px_16px_rgba(0,0,0,0.28)] transition hover:border-ref-sun/52 hover:bg-ref-sun/12";

export const TT_MARKETING_TRUST_BADGE_PROTOCOL =
  "rounded-full border border-white/14 bg-ink-900/70 px-2.5 py-1 text-meta font-medium text-slate-100 backdrop-blur-md";

/** —— `/traveltrust` 文案卡 / 免责 / 示意 —— */
export const TT_MARKETING_COPY_CARD_CLASS =
  "pointer-events-auto relative z-[6] flex w-full min-w-0 max-w-full flex-col gap-4 overflow-visible rounded-2xl border border-ref-sun/28 bg-[rgba(14,11,9,0.88)] px-5 pb-8 pt-6 shadow-[0_20px_56px_rgba(0,0,0,0.45),0_0_56px_-12px_rgba(252,164,124,0.28),inset_0_1px_0_rgba(255,220,180,0.08)] ring-1 ring-inset ring-ref-sun/14 backdrop-blur-2xl max-[390px]:gap-3.5 max-[390px]:px-4 max-[390px]:pb-7 max-[390px]:pt-5 sm:gap-5 sm:px-7 sm:pb-9 sm:pt-7 lg:gap-4.5 lg:px-7 lg:pb-9 lg:pt-7";

export const TT_MARKETING_DISCLAIMER_CLASS =
  "mt-4 text-meta leading-relaxed text-slate-300/92 sm:mt-4 sm:text-small";

export const TT_MARKETING_ILLUSTRATIVE_BADGE =
  "inline-flex shrink-0 items-center rounded-full border border-amber-400/40 bg-amber-400/12 px-2.5 py-0.5 text-meta font-medium text-amber-100/95";

export const TT_MARKETING_ILLUSTRATIVE_BADGE_PREVIEW =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-950/55 font-mono text-[10px] font-bold uppercase text-amber-100/95";

/** 页脚等深色区：示意标识更易扫读（波次 1.5 · v2 同源） */
export const TT_MARKETING_ILLUSTRATIVE_BADGE_FOOTER =
  "inline-flex shrink-0 items-center rounded-full border border-amber-300/55 bg-amber-400/18 px-3 py-1 text-small font-semibold text-amber-50 shadow-[0_0_20px_-6px_rgba(251,191,36,0.35)]";

/** Hero 分栏布局（/traveltrust · 与 traveltrustHeroLayout 契约 grep 同源） */
/** 全页固定 WebGL（TT_Z.CANVAS）之上的正文层 — Hero / 折叠区 / 页脚 */
export const TT_MARKETING_TRAVELTRUST_PAGE_LAYER_CLASS = `relative ${ttZClass(TT_Z.HERO_SKY)}`;

/** Hero 装饰 underlay（letterbox · 暖墨背板）— 低于 WebGL */
export const TT_MARKETING_TRAVELTRUST_HERO_GLOBE_UNDERLAY_CLASS =
  `pointer-events-none fixed inset-0 ${ttZClass(TT_Z.GLOBE_UNDERLAY)} motion-reduce:hidden`;

/** 全页 3D 层基础（pointer-events-none · 高于 underlay） */
export const TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_BASE =
  `pointer-events-none fixed inset-0 ${ttZClass(TT_Z.CANVAS)} motion-reduce:hidden`;

/** 桌面首屏：Canvas 仅左栏（宽度 = 100% − 右栏留白；见 traveltrustHeroSplitLayout.ts） */
export const TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_SPLIT_LG =
  "lg:inset-y-0 lg:bottom-0 lg:left-0 lg:right-auto lg:w-[calc(100%-var(--tt-hero-split-canvas-right,28rem))] lg:max-w-[calc(100%-28rem)] lg:[mask-image:linear-gradient(to_right,black_0%,black_78%,rgba(0,0,0,0.92)_90%,rgba(0,0,0,0.48)_97%,transparent_100%)]";

/** 桌面滚动后：Canvas 恢复全宽（剧场段落） */
export const TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_FULL_LG = "lg:inset-0 lg:w-full lg:[mask-image:none]";

/** `/traveltrust` hero 外层：全宽背景；内容框见 HERO_CONTENT_SHELL（TT-PH1-153） */
const TT_MARKETING_TRAVELTRUST_HERO_SECTION_LAYOUT =
  `relative ${ttZClass(TT_Z.HERO_SKY)} w-full overflow-hidden min-h-[100svh] min-h-[100dvh] pb-[max(3.25rem,env(safe-area-inset-bottom))] max-[390px]:pb-[max(2.75rem,env(safe-area-inset-bottom,0px))] mb-[clamp(1.5rem,4vh,2.75rem)] box-border lg:flex lg:flex-col lg:justify-center`;

/** 非 unified 3D 或需纯色垫底 */
export const TT_MARKETING_TRAVELTRUST_HERO_SECTION_CLASS = `${TT_MARKETING_TRAVELTRUST_HERO_SECTION_LAYOUT} bg-[#0c0a09]`;

/** unified 全页 WebGL：须透明，否则盖住 `z-[1]` 固定 Canvas（TT-PH1-150） */
export const TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS = `${TT_MARKETING_TRAVELTRUST_HERO_SECTION_LAYOUT} bg-transparent`;

export const TT_MARKETING_HERO_CONTENT_SHELL_CLASS =
  `relative ${ttZClass(TT_Z.HERO_COPY)} mx-auto flex w-full min-h-[min(44svh,380px)] max-w-7xl flex-col overflow-visible px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center max-[390px]:min-h-[min(40svh,340px)] sm:min-h-[min(46svh,420px)] sm:px-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:grid lg:min-h-[min(42svh,400px)] lg:w-full lg:overflow-visible lg:[direction:ltr] lg:[grid-template-areas:'globe_copy'] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,var(--tt-hero-copy-w,27rem))] lg:items-center lg:gap-x-[var(--tt-hero-split-gap,2.5rem)] lg:px-6 lg:pb-8 lg:pt-0.5 lg:text-left xl:px-10`;

/** 左列：3D 地球占位（lg grid-area: globe；窄屏 order-2 在文案下方） */
export const TT_MARKETING_HERO_GLOBE_VIEWPORT_CLASS =
  "relative flex min-h-[min(10svh,96px)] w-full min-w-0 flex-1 flex-col items-center justify-center overflow-visible max-[390px]:min-h-[min(8svh,68px)] sm:min-h-[min(11svh,112px)] max-lg:order-2 lg:order-none lg:[grid-area:globe] lg:min-h-[min(24svh,280px)] lg:max-h-[min(32svh,380px)] lg:items-start lg:justify-center lg:overflow-visible lg:pt-0.5 lg:pb-0 lg:pl-2 lg:pr-3 xl:pl-3 lg:pointer-events-none";

/** 右列：文案卡（lg grid-area: copy；窄屏 order-1 在文案上方） */
export const TT_MARKETING_HERO_COPY_COL_CLASS =
  "flex w-full min-w-0 flex-col max-lg:order-1 lg:order-none lg:[grid-area:copy] lg:items-stretch lg:justify-center lg:translate-x-[var(--tt-hero-copy-shift-x,0px)]";

export const TT_MARKETING_HERO_GLOBE_DECOR_CLASS =
  "pointer-events-none min-h-[min(8svh,68px)] w-full flex-1 max-[390px]:min-h-[min(5.5svh,60px)] sm:min-h-[min(10svh,112px)] lg:min-h-[min(16svh,188px)] lg:flex-[1_1_auto]";

export const TT_MARKETING_LANDING_CHROME_CLASS =
  `sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] ${ttZClass(TT_Z.CONTENT)} mb-1 overflow-x-clip overflow-y-visible border-b border-white/16 bg-[#0a0908]/98 shadow-[0_10px_32px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:top-14`;

/** 产品内页壳：与营销顶栏衔接，无全屏动效（TT-PH1-194 · P3） */
export const TT_MARKETING_PRODUCT_PAGE_SHELL =
  "min-h-screen bg-bg-main text-ink-900 antialiased";

/**
 * Console 浅底暖奶油页壳（治理提案等 · 与 L0 顶栏 `#faf8f6` 同族 · 非冷灰 `bg-main`）
 * 使用显式 hex（避免 Tailwind 对 `var()` 渐变偶发不生效）。
 */
export const TT_MARKETING_CONSOLE_WARM_PAGE_SHELL =
  "min-h-screen bg-[#faf8f6] bg-gradient-to-b from-[#fff8f2] via-[#faf8f6] to-[#f5efe8] text-[#5c4528] antialiased";

/** `/governance/proposals*` 全宽暖底 canvas（layout 包裹 · 压住根 `body.bg-bg-main` 冷白缝） */
export const TT_MARKETING_GOVERNANCE_PROPOSALS_WARM_CANVAS =
  "relative min-h-[calc(100dvh-3.5rem)] min-h-[calc(100vh-3.5rem)] bg-[#faf8f6] bg-gradient-to-b from-[#fff8f2] via-[#faf8f6] to-[#f5efe8]";

/** 治理提案页内 `<main>`：透明叠在 canvas 上，不再重复铺冷底 */
export const TT_MARKETING_GOVERNANCE_CONSOLE_WARM_MAIN =
  "relative min-h-full bg-transparent text-[#5c4528] antialiased";

/** 治理提案暖底氛围光（与 L0 顶栏 / 订单 L5 暖金同族） */
export const TT_MARKETING_GOVERNANCE_PROPOSALS_WARM_AMBIENT =
  "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(252,164,124,0.11),transparent_52%),radial-gradient(circle_at_96%_12%,rgba(249,215,121,0.08),transparent_42%)]";

/** Console 浅底暖金棕字阶（与 L0 顶栏 `#5c4528` 同族 · 替代默认冷灰 `text-ink-*`） */
export const TT_MARKETING_CONSOLE_WARM_TEXT_TITLE = "text-[#3d2f1e]";
export const TT_MARKETING_CONSOLE_WARM_TEXT_BODY = "text-[#5c4528]";
export const TT_MARKETING_CONSOLE_WARM_TEXT_LEAD = "text-[#6b5340]";
export const TT_MARKETING_CONSOLE_WARM_TEXT_META = "text-[#7a6248]";
export const TT_MARKETING_CONSOLE_WARM_TEXT_MUTED = "text-[#9a8568]";

/** 暖底 Console 内链（替代 `text-ink-800` + travel 蓝底栏链色） */
export const TT_MARKETING_CONSOLE_WARM_INLINE_LINK =
  "font-medium text-[#5c4528] underline underline-offset-2 transition-colors motion-reduce:transition-none hover:text-[#9a5f18]";

/** 治理 Hub 子页内区（与历史 `max-w-* p-8` 对齐） */
export const TT_MARKETING_GOVERNANCE_PAGE_SHELL = `${TT_MARKETING_PRODUCT_PAGE_SHELL} text-ink-800`;

/** 治理提案 Console 暖底子页（列表 / 详情 / 新建 · 与订单 L5 奶油底同族） */
export const TT_MARKETING_GOVERNANCE_CONSOLE_WARM_PAGE_SHELL =
  TT_MARKETING_CONSOLE_WARM_PAGE_SHELL;

export const TT_MARKETING_GOVERNANCE_INNER_3XL = "mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10";

export const TT_MARKETING_GOVERNANCE_INNER_4XL = "mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10";

export const TT_MARKETING_GOVERNANCE_INNER_5XL = "mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10";

export const TT_MARKETING_GOVERNANCE_INNER_6XL = "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10";

/** 86 §6.0.1 · Admin L0 · 同源 `/`/`/orders` cinematic（`#0c0a09` + vignette/glow/dot · 无 Ken Burns） */
export const TT_MARKETING_ADMIN_ZONE_ROOT = TT_MARKETING_ORDERS_PAGE_SHELL;

/** Admin 氛围叠层（与 [`LandingHomeDecorLayers`](../../components/landing/LandingHomeDecorLayers.tsx) 同族 · 无摄影） */
export const TT_MARKETING_ADMIN_ZONE_VIGNETTE = TT_MARKETING_HOME_AMBIENT_SCRIM;
export const TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW = TT_MARKETING_HOME_AMBIENT_GLOW;
/** Admin 点阵 · 较 `/` 降 opacity，避免深壳视觉噪点 */
export const TT_MARKETING_ADMIN_ZONE_DOT_GRID =
  "pointer-events-none fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.06] mix-blend-overlay";

export const TT_MARKETING_ADMIN_SHELL_BAR =
  "sticky top-0 z-50 border-b border-white/10 bg-[#0c0a09]/88 text-slate-100 backdrop-blur-md supports-[backdrop-filter]:bg-[#0c0a09]/80";

export const TT_MARKETING_ADMIN_SHELL_BAR_INNER =
  "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6";

export const TT_MARKETING_ADMIN_INNER_6XL = "mx-auto max-w-6xl p-6 sm:p-8";

export const TT_MARKETING_ADMIN_INNER_5XL = "mx-auto max-w-5xl p-6 sm:p-8";

export const TT_MARKETING_ADMIN_INNER_4XL = "mx-auto max-w-4xl p-6 sm:p-8";

/** Admin 错误边界 / 窄卡片 */
export const TT_MARKETING_ADMIN_ERROR_MAIN =
  "mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main";

export const TT_MARKETING_ADMIN_ERROR_CARD =
  "rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft";

/** AdminShellBar 顶栏 nav（深壳 · 暖金激活 · 同源 `/` L0） */
export const TT_MARKETING_ADMIN_SHELL_NAV_ACTIVE = "font-semibold text-[#ffe8d4]";

export const TT_MARKETING_ADMIN_SHELL_NAV_IDLE =
  "text-slate-300 hover:text-[#ffe8d4] hover:underline";

export const TT_MARKETING_ADMIN_SHELL_SITE_LINK =
  "text-slate-400 hover:text-[#ffe8d4] hover:underline";

export const TT_MARKETING_PRODUCT_PAGE_INNER =
  "mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10";

/** 窄版产品区内区：支付 / 行程新建 / 质押（max-w-2xl） */
export const TT_MARKETING_PRODUCT_PAGE_INNER_NARROW =
  "mx-auto max-w-2xl px-4 py-8 sm:px-12";

/** Auth 整页居中：注册 / 重置 / 验证等（V2 · P3） */
export const TT_MARKETING_AUTH_PAGE_SHELL =
  `${TT_MARKETING_PRODUCT_PAGE_SHELL} flex flex-col items-center justify-center gap-4 p-6 py-10`;

/** Auth loading / 窄卡片骨架全页 */
export const TT_MARKETING_AUTH_PAGE_SHELL_COMPACT =
  `${TT_MARKETING_PRODUCT_PAGE_SHELL} flex items-center justify-center p-6`;

/** 账户 Hub：Me 身份 / 安全 / onboarding（V2 · P3） */
export const TT_MARKETING_ACCOUNT_PAGE_SHELL =
  `${TT_MARKETING_PRODUCT_PAGE_SHELL} px-4 py-8 sm:px-6`;

/** `/me/*` 控制台子页内栏（Hub 在 `/community/me` · W5） */
export const TT_MARKETING_ACCOUNT_INNER_3XL = "mx-auto max-w-3xl";

export const TT_MARKETING_ACCOUNT_INNER_5XL = "mx-auto max-w-5xl space-y-6";

export const TT_MARKETING_ACCOUNT_CARD =
  "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6";

/** 多重身份 Hub 卡片（L5 暗玻璃 · 与 `/me/identities` 同族） */
export const TT_MARKETING_ACCOUNT_IDENTITY_CARD =
  "auth-l5-glass-surface auth-l5-glass-vignette group block rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 p-5 backdrop-blur-2xl outline-none transition-colors hover:border-ref-sun/52 hover:bg-ref-sun/[0.06] focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export const TT_MARKETING_ACCOUNT_ERROR_MAIN = `${TT_MARKETING_PRODUCT_PAGE_SHELL} mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12`;

export const TT_MARKETING_ACCOUNT_ERROR_CARD = TT_MARKETING_ADMIN_ERROR_CARD;

/** `/` 行程结果区（叠在风景底上 · 与 Hero `max-w-5xl` 对齐） */
export const TT_MARKETING_HOME_RESULTS_SECTION =
  "mx-auto max-w-5xl px-4 py-12 pb-[max(2rem,env(safe-area-inset-bottom))] scroll-mt-24";

/** 结果区底图 scrim：忙背景上抬对比与可读性（L5 · 与 Hero 玻璃同系） */
export const TT_MARKETING_HOME_RESULTS_PANEL =
  "relative before:pointer-events-none before:absolute before:inset-x-[-0.75rem] sm:before:inset-x-[-1.5rem] before:inset-y-[-0.5rem] before:-z-10 before:rounded-[var(--radius-xl)] before:bg-gradient-to-b before:from-[#0c0a09]/62 before:via-[#0c0a09]/86 before:to-[#0c0a09]/95 before:backdrop-blur-[4px]";

export const TT_MARKETING_HOME_RESULTS_HEADING =
  `text-h4 font-bold tracking-tight ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

/** 空态预览卡底栏 CTA（禁用态 · 高对比暖金字，勿用低透明度 sun/90） */
export const TT_MARKETING_HOME_PREVIEW_SLOT_FOOTER =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-ref-sun/45 bg-slate-950/70 px-3 text-meta font-semibold text-ref-sun shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.35)]";

/** 空态/生成中预览卡（实线玻璃 · 暖 ring；非 dashed 线框） */
export const TT_MARKETING_HOME_PREVIEW_SLOT_CARD =
  "relative overflow-hidden h-full flex flex-col rounded-[var(--radius-lg)] border border-white/18 bg-gradient-to-b from-ink-950/68 to-black/88 backdrop-blur-md ring-1 ring-ref-sun/24 shadow-warm-card";

/** Hero 筛选 pill · 选中（暖金 · §1.7） */
export const TT_MARKETING_HOME_FILTER_PILL_SELECTED =
  "rounded-full border border-ref-sun/50 bg-ref-sun/18 px-3 py-1.5 text-meta font-semibold text-ref-sun shadow-[0_0_18px_-8px_rgba(252,164,124,0.5)]";

/** 国家 pill · 选中（暖色摄影底上须更高对比：白字 + 更深暖底） */
export const TT_MARKETING_HOME_COUNTRY_PILL_SELECTED =
  "rounded-full border border-ref-sun/55 bg-ref-sun/32 px-3 py-1.5 text-meta font-semibold text-white shadow-[0_0_22px_-6px_rgba(252,164,124,0.65)] ring-1 ring-ref-sun/40";

export const TT_MARKETING_HOME_FILTER_PILL_IDLE =
  "rounded-full border border-white/22 bg-white/10 px-3 py-1.5 text-meta font-medium text-white/85 hover:bg-white/14 hover:border-white/30 transition-colors";

export const TT_MARKETING_HOME_FILTER_PILL_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50";

/** 页脚前摄影收束（`page.tsx` 包裹 `LandingFooter`） */
export const TT_MARKETING_HOME_FOOTER_TOP_FADE =
  "pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent via-[#0c0a09]/78 to-[#0c0a09]";

export type MarketingHomeFilterPillVariant = "default" | "country";

export function ttMarketingHomeFilterPillClasses(
  selected: boolean,
  variant: MarketingHomeFilterPillVariant = "default"
): string {
  const focus = TT_MARKETING_HOME_FILTER_PILL_FOCUS;
  if (!selected) return `${TT_MARKETING_HOME_FILTER_PILL_IDLE} ${focus}`;
  const selectedClass =
    variant === "country"
      ? TT_MARKETING_HOME_COUNTRY_PILL_SELECTED
      : TT_MARKETING_HOME_FILTER_PILL_SELECTED;
  return `${selectedClass} ${focus}`;
}

/** Hero 行程偏好折叠区（小屏默认收起 · 减密度） */
export const TT_MARKETING_HOME_PREFERENCES_DETAILS =
  "mt-8 border-t border-white/15 pt-4 group";

export const TT_MARKETING_HOME_PREFERENCES_SUMMARY =
  "flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-small font-semibold text-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 rounded-[var(--radius-md)] [&::-webkit-details-marker]:hidden";

export const TT_MARKETING_HOME_RESULTS_CARD =
  "group relative overflow-hidden h-full flex flex-col motion-sub transition-[transform,box-shadow] duration-300 hover:-translate-y-1 shadow-warm-card rounded-[var(--radius-lg)] border border-white/16 bg-gradient-to-b from-ink-950/60 to-black/90 backdrop-blur-md ring-1 ring-ref-sun/20 hover:ring-ref-coral/30";

export const TT_MARKETING_HOME_UNLOCK_BTN =
  `rounded-[var(--radius-md)] border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-5 py-2.5 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`;

/** `/` UnlockModal 支付钮（浅色 `bg-bg-console` 上 · 221-C） */
export const TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN =
  `flex-1 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-2 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} hover:brightness-110 motion-sub disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/65 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

/** 首页页脚（深色底 · 冷灰字层级，与截图/mock 一致；Hero 暖金不延伸至此） */
export const TT_MARKETING_HOME_FOOTER =
  "tt-marketing-home-footer relative border-t border-white/12 bg-[#0c0a09]/97 backdrop-blur-md px-6 py-10 sm:py-12 shadow-[0_-16px_48px_rgba(0,0,0,0.55)] [&_a]:no-underline";

export const TT_MARKETING_HOME_FOOTER_HEADING =
  "text-small font-semibold text-slate-200 mb-3";

export const TT_MARKETING_HOME_FOOTER_BODY = "text-meta leading-relaxed text-slate-400";

export const TT_MARKETING_HOME_FOOTER_DIVIDER = "border-t border-white/12";

export const TT_MARKETING_HOME_FOOTER_TECH_CHIP =
  "inline-flex items-center rounded-full border border-[#c5a059]/55 bg-transparent px-2.5 py-1 text-meta font-medium text-slate-300 whitespace-nowrap";

/** 多栏列表链（13/37 · min-h 44px） */
export const TT_MARKETING_HOME_FOOTER_LINK =
  "inline-flex min-h-[44px] items-center text-meta !text-slate-300 visited:!text-slate-300 no-underline hover:!text-slate-100 transition-colors duration-150 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] [color:rgb(203,213,225)] visited:[color:rgb(203,213,225)]";

/** 底栏主链交叉入口（强制冷灰 · 覆盖 travel-600 / ink 蓝灰） */
export const TT_MARKETING_HOME_FOOTER_CROSS_LINK =
  `${TT_MARKETING_HOME_FOOTER_LINK} justify-center`;

/** 我的订单 · 页脚交叉链（比首页脚注再提亮 · 纯黑底可读） */
export const TT_MARKETING_ORDERS_FOOTER_LINK =
  "inline-flex min-h-[44px] items-center text-meta !text-slate-200 no-underline hover:!text-white transition-colors duration-150 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

export const TT_MARKETING_ORDERS_FOOTER_CROSS_LINK =
  `${TT_MARKETING_ORDERS_FOOTER_LINK} justify-center`;

/** 我的订单 · 页脚前摄影收束（别名 `/` `HOME_FOOTER_TOP_FADE`） */
export const TT_MARKETING_ORDERS_FOOTER_TOP_FADE = TT_MARKETING_HOME_FOOTER_TOP_FADE;

/** `/orders/new` · 窄表单内区（居中 · 保留创建页节奏） */
export const TT_MARKETING_ORDERS_NEW_PAGE_INNER =
  "relative z-[1] mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-10 pb-24 md:pb-10";

/** `/orders/new` · 表单暖金外框（同源列表 Hero frame） */
export const TT_MARKETING_ORDERS_NEW_FORM_FRAME =
  `${TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE} animate-fadeUp`;

/** `/orders/new` · 表单玻璃内胆 */
export const TT_MARKETING_ORDERS_NEW_FORM_INNER =
  `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} relative px-4 py-6 sm:px-6 sm:py-7`;

/** `/orders/new` · 表单内胆暖光 */
export const TT_MARKETING_ORDERS_NEW_FORM_INNER_GLOW =
  "pointer-events-none absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(252,164,124,0.14),transparent_50%),radial-gradient(circle_at_100%_40%,rgba(240,168,120,0.12),transparent_45%)]";

/** `/orders/new` · 预填向导 callout */
export const TT_MARKETING_ORDERS_NEW_GUIDE_BANNER =
  `rounded-[var(--radius-sm)] border border-white/15 border-l-4 border-l-ref-sun/70 ${TT_MARKETING_ORDERS_DARK_GLASS_INNER} px-3 py-2.5 space-y-2 shadow-[0_8px_28px_-18px_rgba(0,0,0,0.42)]`;

/** `/orders/new` · 创建成功面板 */
export const TT_MARKETING_ORDERS_NEW_SUCCESS_PANEL =
  `w-full max-w-md rounded-[var(--radius-lg)] ${TT_MARKETING_ORDERS_DARK_GLASS_INNER} p-6 space-y-4 shadow-[0_8px_32px_-18px_rgba(0,0,0,0.48)]`;

/** `/orders/new` · 深色表单控件 focus */
export const TT_MARKETING_ORDERS_FORM_FIELD_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** `/orders/new` · 深色玻璃输入/选择 */
export const TT_MARKETING_ORDERS_FORM_FIELD =
  `${TT_MARKETING_ORDERS_FORM_FIELD_FOCUS} w-full min-h-[44px] rounded-[var(--radius-sm)] border border-white/20 bg-slate-950/50 px-2 py-1.5 text-small text-slate-100 backdrop-blur-sm disabled:opacity-60 placeholder:text-slate-400`;

/** `/orders/new` · 深色玻璃 select */
export const TT_MARKETING_ORDERS_FORM_SELECT =
  `${TT_MARKETING_ORDERS_FORM_FIELD} inline-flex items-center justify-start`;

/** `/orders/new` · 内联链（暖金 · 深色底） */
export const TT_MARKETING_ORDERS_NEW_INLINE_LINK =
  `text-small font-medium text-ref-sun hover:text-ref-coral underline underline-offset-2 transition-colors motion-reduce:transition-none rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`;

/** `/orders/new` · 主提交（暖金 Action · 深字 · 深色 ring-offset） */
export const TT_MARKETING_ORDERS_FORM_SUBMIT_BTN =
  `inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-3 py-2 text-small font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW} transition hover:brightness-110 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-55`;

export const TT_MARKETING_HERO_UNIFIED_SCRIM_CLASS =
  "pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_70%_at_var(--tt-hero-globe-optical-x,50%)_var(--tt-hero-globe-optical-y,50%),transparent_0%,transparent_68%,rgba(12,10,9,0.1)_82%,rgba(12,10,9,0.22)_100%)] lg:bg-[radial-gradient(ellipse_88%_74%_at_var(--tt-hero-globe-optical-x,28%)_var(--tt-hero-globe-optical-y,52%),rgba(252,164,124,0.06)_0%,transparent_58%,rgba(12,10,9,0.08)_72%,rgba(12,10,9,0.2)_100%),radial-gradient(ellipse_52%_48%_at_78%_46%,rgba(255,200,150,0.04)_0%,transparent_58%),linear-gradient(90deg,transparent_0%,transparent_58%,rgba(12,10,9,0.12)_78%,rgba(12,10,9,0.38)_100%)]";

export const TT_MARKETING_HERO_COPY_PANEL_SCRIM_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[min(36%,280px)] bg-[linear-gradient(180deg,transparent_0%,rgba(12,10,9,0.42)_50%,rgba(12,10,9,0.6)_100%)] max-lg:block lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[min(44%,26rem)] lg:bg-[linear-gradient(90deg,transparent_0%,rgba(12,10,9,0.22)_28%,rgba(12,10,9,0.65)_78%)]";

export const TT_MARKETING_HERO_CHIP_ITEM_CLASS =
  "inline-flex min-h-[2.25rem] max-w-[min(100%,15rem)] items-center gap-2 rounded-full border border-ref-sun/22 bg-ink-900/72 px-3 py-2 text-small text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.28)] backdrop-blur-md sm:max-w-none sm:px-3.5";
