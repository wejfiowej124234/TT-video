/**
 * Admin 域 UI 单入口（W4）— 从 `uiSystem` / `marketingUi` 取用，不散写 `travel-*` 链式 class。
 */

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_ADMIN_ERROR_CARD,
  TT_MARKETING_ADMIN_ERROR_MAIN,
  TT_MARKETING_ADMIN_INNER_4XL,
  TT_MARKETING_ADMIN_INNER_5XL,
  TT_MARKETING_ADMIN_INNER_6XL,
  TT_MARKETING_ADMIN_SHELL_BAR,
  TT_MARKETING_ADMIN_SHELL_BAR_INNER,
  TT_MARKETING_ADMIN_SHELL_NAV_ACTIVE,
  TT_MARKETING_ADMIN_SHELL_NAV_IDLE,
  TT_MARKETING_ADMIN_SHELL_SITE_LINK,
  TT_MARKETING_ADMIN_ZONE_ROOT,
  TT_MARKETING_ADMIN_ZONE_VIGNETTE,
  TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW,
  TT_MARKETING_ADMIN_ZONE_DOT_GRID,
  TT_MARKETING_BTN_CONSOLE_TRUST,
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_ERROR_RETRY_BTN,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
} from "@/lib/uiSystem";
import {
  TT_MARKETING_ACTION_GRADIENT_FILL,
  TT_MARKETING_ACTION_GRADIENT_SHADOW,
  TT_MARKETING_ACTION_STAT_EMPHASIS,
  TT_MARKETING_ACTION_TITLE_GRADIENT,
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_BTN_GHOST_WARM_CONSOLE,
  TT_MARKETING_BTN_GHOST_WARM_DARK,
  TT_MARKETING_BTN_PRIMARY_WARM_WIDGET,
  TT_MARKETING_HOME_SECTION_BRIDGE_LINE,
  TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE,
  TT_MARKETING_WARM_L5_CARD_INNER_CONSOLE,
  TT_MARKETING_WARM_L5_CARD_INNER_GLOW_CONSOLE,
  TT_MARKETING_ORDERS_DARK_GLASS_INNER,
  TT_MARKETING_HOME_FORM_INNER_GLOW,
  TT_MARKETING_ORDERS_TEXT_BODY,
  TT_MARKETING_ORDERS_TEXT_META,
  TT_MARKETING_HOME_HERO_PILL_GHOST,
} from "@/lib/marketingUi";

export {
  TT_MARKETING_ADMIN_ERROR_CARD,
  TT_MARKETING_ADMIN_ERROR_MAIN,
  TT_MARKETING_ADMIN_INNER_4XL,
  TT_MARKETING_ADMIN_INNER_5XL,
  TT_MARKETING_ADMIN_INNER_6XL,
  TT_MARKETING_ADMIN_SHELL_BAR,
  TT_MARKETING_ADMIN_SHELL_BAR_INNER,
  TT_MARKETING_ADMIN_SHELL_NAV_ACTIVE,
  TT_MARKETING_ADMIN_SHELL_NAV_IDLE,
  TT_MARKETING_ADMIN_SHELL_SITE_LINK,
  TT_MARKETING_ADMIN_ZONE_ROOT,
  TT_MARKETING_ADMIN_ZONE_VIGNETTE,
  TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW,
  TT_MARKETING_ADMIN_ZONE_DOT_GRID,
  TT_MARKETING_BTN_CONSOLE_TRUST,
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_ERROR_RETRY_BTN,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
};

/** 白底筛选卡 input/select focus */
export const ADMIN_FORM_FIELD_FOCUS_CLASS = TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE;

/** 筛选/表单控件 · sm 圆角（Batch-10 HU-167/220 · 深壳暗填 · 禁奶油 `#faf8f6`） */
export const ADMIN_FORM_CONTROL_SM_CLASS =
  "rounded-[var(--radius-sm)] border border-ref-sun/24 bg-[#0c0a09]/75 text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

/** 筛选/表单控件 · md 圆角 */
export const ADMIN_FORM_CONTROL_MD_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/24 bg-[#0c0a09]/75 text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

/** 暖金 L5 模态 · 奶油底 input/select（`text-slate-*` 避 ink remap · native option 可读） */
export const ADMIN_WARM_L5_MODAL_FORM_CONTROL_CLASS =
  "rounded-[var(--radius-sm)] border border-ref-sun/24 bg-[#faf8f6] text-slate-900 [color-scheme:light] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]";

/** 暖金 L5 模态 · 字段标签（深壳面板） */
export const ADMIN_WARM_L5_MODAL_FORM_LABEL_CLASS = "block text-meta text-slate-300";

/** 按钮 / 非表单控件 focus ring */
export const ADMIN_FOCUS_RING_CORE_CLASS = TT_MARKETING_FOCUS_RING_CONSOLE;

/** 内联链 focus（与 `touchTargetLink44Classes` 联用） */
export const ADMIN_LINK_FOCUS_CLASS = TT_MARKETING_CONSOLE_LINK_FOCUS;

/** `/` 同源 · 暖金 L5 玻璃卡（深 cinematic 壳 · 同源 `HOME_FORM_PANEL` / `/orders`） */
export const ADMIN_WARM_L5_FRAME_CLASS = TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE;
export const ADMIN_WARM_L5_INNER_CLASS = `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} relative overflow-hidden`;
export const ADMIN_WARM_L5_INNER_GLOW_CLASS = `${TT_MARKETING_HOME_FORM_INNER_GLOW} pointer-events-none absolute inset-0 rounded-[calc(var(--radius-xl)-1px)]`;
export const ADMIN_WARM_L5_PAD_CLASS = "relative p-4 sm:p-5";

/** 深壳正文/说明（同源 `/orders`） */
export const ADMIN_TEXT_BODY_CLASS = TT_MARKETING_ORDERS_TEXT_BODY;
export const ADMIN_TEXT_META_CLASS = TT_MARKETING_ORDERS_TEXT_META;

/**
 * 深壳副文 / 磁贴说明（Batch-13 FP-A · AA）
 * 叶页 `text-ink-600` 仍由 `globals.css` zone remap 抬到 slate-300；新码优先本 token。
 */
export const ADMIN_TEXT_SECONDARY_CLASS = "text-slate-300";

/** 深壳 footnote / 诚实句（14px · slate-200 · Batch-11 W14 HU-337） */
export const ADMIN_TEXT_FOOTNOTE_CLASS = "text-small leading-snug text-slate-200";

/** 侧栏 nav 链（可读性 · 44px 触达） */
export const ADMIN_SHELL_SIDEBAR_LINK_CLASS =
  "text-[0.8125rem] leading-snug text-slate-200 hover:text-[#ffe8d4]";
/** Batch-13 FP-A：muted 不用 ORDERS slate-400（AA 下限）→ slate-300 */
export const ADMIN_TEXT_MUTED_CLASS = "text-slate-300";

/** 深壳 · 次 CTA / 幽灵 pill（同源 `/` Hero 暖描边 · 禁止 Console 浅底 ghost） */
export const ADMIN_BTN_GHOST_DARK_CLASS = `${TT_MARKETING_HOME_HERO_PILL_GHOST} text-[#ffe8d4] hover:text-white`;

/** 深壳 · 内嵌面板 / 折叠 / 说明条（禁止 `#faf8f6` 浅底靠色） */
export const ADMIN_DARK_GLASS_PANEL_CLASS =
  "rounded-[var(--radius-md)] border border-white/12 bg-slate-950/50 backdrop-blur-md";

export const ADMIN_DARK_GLASS_PANEL_LG_CLASS =
  "rounded-[var(--radius-lg)] border border-white/12 bg-slate-950/50 backdrop-blur-md";

export const ADMIN_DARK_GLASS_PANEL_XL_CLASS =
  "rounded-[var(--radius-xl)] border border-white/12 bg-slate-950/50 backdrop-blur-md";

/** 表格 / 密集数据区 · 深壳抬升（Batch-10 HU-168 · 禁默认白 sheet） */
export const ADMIN_SURFACE_PLAIN_CLASS =
  "rounded-[var(--radius-lg)] border border-white/12 bg-slate-950/55 shadow-soft backdrop-blur-md";

/** 列表表格外框 · 暖金过渡（深壳） */
export const ADMIN_TABLE_WARM_FRAME_CLASS =
  "rounded-[var(--radius-xl)] border border-ref-sun/20 bg-gradient-to-b from-ref-sun/[0.07] to-ref-sun/[0.02] p-px shadow-[0_0_0_1px_rgba(252,164,124,0.06)]";

/** @deprecated 列表/表格用 `ADMIN_SURFACE_PLAIN_CLASS`；widget 用 `AdminWarmL5Surface` */
export const ADMIN_SURFACE_CARD_CLASS = ADMIN_SURFACE_PLAIN_CLASS;

/** 筛选区（可读抬升 + 暖边/浅暖底 · 列表页头用 `AdminWarmL5Surface`） */
export const ADMIN_FILTER_CARD_CLASS =
  "admin-filter-card rounded-[var(--radius-xl)] border border-ref-sun/18 bg-ref-sun/[0.06] shadow-soft p-4";

/** 筛选区输入 · 深壳暖边（配 `ADMIN_FILTER_CARD` · 非奶油底 `ADMIN_FORM_CONTROL`） */
export const ADMIN_FILTER_INPUT_SM_CLASS = `w-full min-h-[44px] px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS} rounded-[var(--radius-sm)] border border-ref-sun/24 bg-[#0c0a09]/75 text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`;

export const ADMIN_FILTER_INPUT_MD_CLASS = `w-full min-h-[44px] px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS} rounded-[var(--radius-md)] border border-ref-sun/24 bg-[#0c0a09]/75 text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`;

/** P2-5 · 筛选区标题 / 提示 / 字段标签 / 栅格（深暖卡 SSOT · batch57） */
export const ADMIN_FILTER_TITLE_CLASS = "text-body font-medium text-slate-100";
export const ADMIN_FILTER_HINT_CLASS = "mt-2 text-small text-slate-300 leading-relaxed";
export const ADMIN_FILTER_FIELD_LABEL_CLASS = "text-small font-semibold text-slate-200";
export const ADMIN_FILTER_GRID_CLASS = "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-2";
export const ADMIN_FILTER_GRID_3_CLASS = "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
export const ADMIN_FILTER_GRID_4_CLASS = "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
export const ADMIN_FILTER_ACTIONS_CLASS = "mt-3 flex flex-wrap gap-2";

/** 详情/队列处置主内容 · 实现 `AdminDetailContentPanel`（暖金 L5 · 非 `ADMIN_FILTER_CARD`） */

/**
 * 列表页页头卡框 · widget/枢纽仍可复用 Warm L5。
 * List/Detail Chrome 页头已改 flat（Batch-10 W12 · HU-237）。
 */
export const ADMIN_PAGE_HEADER_CARD_CLASS = ADMIN_WARM_L5_FRAME_CLASS;
/** Batch-10 W12 · HU-237/189：列表/详情页头扁平带（去 Warm L5 套娃边） */
export const ADMIN_PAGE_HEADER_FLAT_CLASS = "mb-1 border-b border-white/10 pb-3 lg:pb-4";
/** Batch-10 W12 · Related 默认一行 · 无描边卡 */
export const ADMIN_OPS_RELATED_FOLD_FLAT_CLASS = "py-1";

/** 列表/详情页头 · 深暖壳 title/subtitle（ADM-UX-VIS-13 · batch59） */
export const ADMIN_PAGE_CHROME_TITLE_CLASS = "text-h3 font-semibold text-slate-100";
export const ADMIN_PAGE_CHROME_SUBTITLE_CLASS = "mt-2 max-w-2xl text-body text-slate-300";
export const ADMIN_PAGE_CHROME_SUBTITLE_ID_CLASS = "font-mono text-small text-slate-300 break-all";
export const ADMIN_PAGE_CHROME_SUBTITLE_HINT_CLASS = "mt-1 text-small text-slate-300";

/** 工作台 h1 · 可选金渐变字（全站唯一品牌标题） */
export const ADMIN_WORKSPACE_TITLE_CLASS = `text-h3 font-semibold sm:text-h2 ${TT_MARKETING_ACTION_TITLE_GRADIENT}`;

/** 首页聚焦待办 · 页头标题降噪（Shell 顶栏已有「工作台」） */
export const ADMIN_WORKSPACE_TITLE_FOCUS_CLASS = `text-body-l font-semibold ${TT_MARKETING_ORDERS_TEXT_BODY}`;

/** 区块分隔（同源 `TT_MARKETING_HOME_SECTION_BRIDGE_LINE`） */
export const ADMIN_SECTION_DIVIDER_CLASS = `h-px w-full ${TT_MARKETING_HOME_SECTION_BRIDGE_LINE}`;

/** VIS-01：列表 / 枢纽 / 观测页统一宽度 */
export const TT_ADMIN_PAGE_INNER_LIST = TT_MARKETING_ADMIN_INNER_6XL;

/** VIS-01：详情 / 写表单 / 权限中心统一宽度 */
export const TT_ADMIN_PAGE_INNER_DETAIL = TT_MARKETING_ADMIN_INNER_4XL;

/** layout 注入面包屑与 Shell 条同宽 */
export const TT_ADMIN_LAYOUT_GUTTER = "mx-auto max-w-6xl px-4 sm:px-6";

/** VIS-01：窄写表单（DSAR update 等） */
export const TT_ADMIN_PAGE_INNER_FORM = "mx-auto max-w-2xl p-6 sm:p-8";

/** 86 §6.0.1 · Admin 域根壳（L0 · 同源 `/` cinematic · 非冷灰 bg-main） */
export const TT_ADMIN_ZONE_ROOT = TT_MARKETING_ADMIN_ZONE_ROOT;
export const TT_ADMIN_ZONE_VIGNETTE = TT_MARKETING_ADMIN_ZONE_VIGNETTE;
export const TT_ADMIN_ZONE_AMBIENT_GLOW = TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW;
export const TT_ADMIN_ZONE_DOT_GRID = TT_MARKETING_ADMIN_ZONE_DOT_GRID;

/** Admin 子树内容栈（叠在 `AdminZoneAmbientBackdrop` 之上） */
export const ADMIN_ZONE_CONTENT_STACK_CLASS = "relative z-10 flex min-h-screen flex-1 flex-col";

/** Shell 主内容列（继承 L0 页壳 · 不另铺纯白） */
export const ADMIN_MAIN_CONTENT_COLUMN_CLASS = "min-w-0 flex-1";

/** Admin 路由错误边界版面（`bg-bg-console` 卡片 · ink 文案） */
export const TT_ADMIN_ERROR_MAIN = TT_MARKETING_ADMIN_ERROR_MAIN;
export const TT_ADMIN_ERROR_CARD = TT_MARKETING_ADMIN_ERROR_CARD;

/** 列表表格区外框（L5 · 禁止裸 `bg-white` · 用 `bg-bg-console`） */
export const ADMIN_TABLE_SURFACE_CLASS = `overflow-x-auto ${ADMIN_SURFACE_PLAIN_CLASS}`;

/** 列表表格区外框（含 `mt-6` · 暖框 + 白表） */
export const ADMIN_TABLE_SECTION_CLASS = `mt-6 ${ADMIN_TABLE_WARM_FRAME_CLASS} ${ADMIN_TABLE_SURFACE_CLASS}`;

/** 列表 SWR 刷新中 · 保留旧表 + 轻 opacity（非全屏 skeleton）。 */
export const ADMIN_LIST_REFRESHING_SURFACE_CLASS =
  "opacity-[0.88] transition-opacity duration-150 motion-reduce:transition-none";

/** 链上事件表等 · 锚点滚动 + 表格表面（fee-router / region-vault） */
export const ADMIN_TABLE_SCROLL_SECTION_CLASS = `mt-8 scroll-mt-24 ${ADMIN_TABLE_WARM_FRAME_CLASS} ${ADMIN_TABLE_SURFACE_CLASS}`;

/** 模态/抽屉内容面板（白抬升 · ink 边框） */
export const ADMIN_MODAL_PANEL_CLASS = `${ADMIN_SURFACE_PLAIN_CLASS} p-5 shadow-medium`;

/** 枢纽入口磁贴外框（onboarding/config 等 · 须内层 `ADMIN_HUB_LINK_CARD_INNER_CLASS`） */
export const ADMIN_HUB_LINK_CARD_FRAME_CLASS = ADMIN_WARM_L5_FRAME_CLASS;

/** 枢纽入口磁贴内胆 */
export const ADMIN_HUB_LINK_CARD_INNER_CLASS = `${ADMIN_WARM_L5_INNER_CLASS} ${ADMIN_WARM_L5_PAD_CLASS} block`;

/** 子页 KPI/摘要链式磁贴（与枢纽同源 · 须内层 `ADMIN_HUB_LINK_CARD_INNER_CLASS`） */
export const ADMIN_HUB_KPI_LINK_FRAME_CLASS = ADMIN_HUB_LINK_CARD_FRAME_CLASS;

/** meta.note → observability 深链 */
export const ADMIN_META_NOTE_LINK_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 py-2 text-left text-small text-slate-300 hover:border-ref-sun/30 hover:text-slate-100";

/** Shell 侧栏 flyout / mobile 子菜单 */
export const ADMIN_SHELL_NAV_DROPDOWN_CLASS =
  "mt-1 flex flex-col gap-0.5 border-l border-ref-sun/18 pl-3 sm:absolute sm:z-10 sm:mt-2 sm:min-w-[11rem] sm:rounded-[var(--radius-md)] sm:border sm:border-ref-sun/18 sm:bg-[#faf8f6]/98 sm:p-2 sm:shadow-[0_0_20px_-12px_rgba(252,164,124,0.28)]";

/** Modal / command palette 遮罩（暖棕 · 非冷灰 ink-900） */
export const ADMIN_MODAL_OVERLAY_CLASS = "fixed inset-0 z-[100] bg-[#1a1410]/45";

/** Portal 内联 scrim（`AdminDialogScrim` · 与 `adminModalPortalRootSheetClass` 配对） */
export const ADMIN_MODAL_SCRIM_CLASS = "absolute inset-0 bg-[#1a1410]/45";

/** Phase② 预备/Staging 提示（ref-sun · 非 amber） */
export const ADMIN_PHASE2_STAGING_NOTICE_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/28 bg-gradient-to-r from-ref-sun/12 via-bg-console to-ref-sun/8 p-4";

/** Phase② staging record · 只读代码块 / 折叠 */
export const ADMIN_PHASE2_RECORD_CODE_BLOCK_CLASS =
  "mt-2 block break-all rounded-[var(--radius-sm)] border border-ref-sun/14 bg-[#faf8f6]/95 p-2 font-mono text-meta text-ink-800";

export const ADMIN_PHASE2_RECORD_DETAILS_CLASS =
  "mt-4 rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 p-3";

/** 财务 partial 深度回退条 */
export const ADMIN_FIN_PARTIAL_FALLBACK_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/22 bg-ref-sun/8 p-4";

/** U1 · Admin 顶栏品牌 accent（与五主 Header ref-sun 条同源 · 控制台浅壳） */
export const ADMIN_SHELL_BRAND_ACCENT_CLASS = "border-t-2 border-ref-sun/65";

/** IA-06 · Shell 六角色预览徽章（暖金 · 与 ref-sun 预览条同系） */
export const ADMIN_SHELL_PREVIEW_BADGE_CLASS =
  "rounded-full border border-ref-sun/40 bg-ref-sun/14 px-2 py-0.5 font-medium text-[#9a5f18]";

/** IA-06 · Shell 预览条（首页 collapsible · 深壳暖金内胆） */
export const ADMIN_SHELL_PREVIEW_BANNER_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/28 bg-gradient-to-r from-ref-sun/12 via-slate-950/55 to-ref-sun/8 px-4 py-3 backdrop-blur-md";

/** IA-06 · 全站 Shell 预览顶栏（浅底 · ref-sun 底边） */
export const ADMIN_SHELL_PREVIEW_NOTICE_CLASS =
  "border-b-2 border-dashed border-amber-500/55 bg-gradient-to-r from-amber-400/35 via-ref-sun/20 to-amber-300/25";

/** IA-06 · 登录账号 JWT 角色徽章（暖棕 · 与侧栏激活同族） */
export const ADMIN_SHELL_ACCOUNT_ROLE_BADGE_CLASS =
  "rounded-full border border-ref-sun/28 bg-ref-sun/10 px-2 py-0.5 font-medium text-[#9a5f18]";

/** Shell · DB / 映射角色徽章（顶栏 · 非预览态） */
export const ADMIN_SHELL_DB_ROLE_BADGE_CLASS = ADMIN_SHELL_ACCOUNT_ROLE_BADGE_CLASS;

/** Shell 顶栏 · 元控件 chip（⌘K / 移动导航 / 权限链） */
export const ADMIN_SHELL_META_CHIP_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/6 px-2.5 py-0.5 text-meta font-medium text-ink-800 hover:border-ref-sun/40 hover:bg-ref-sun/10";

/** Shell · 预览条/顶栏次操作（清除预览等） */
export const ADMIN_SHELL_SECONDARY_BTN_CLASS = `${TT_MARKETING_BTN_GHOST_WARM_CONSOLE} px-3 py-1.5 text-meta font-medium`;

/** Modal / wizard · 取消钮（暖金幽灵 · 非 form-control 方框） */
export const ADMIN_MODAL_CANCEL_BTN_CLASS = `${TT_MARKETING_BTN_GHOST_WARM_CONSOLE} inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-small font-medium`;

/** 首页收件箱 · 全队列清空庆祝块（success 语义 · 暖 tint） */
export const ADMIN_INBOX_ALL_CLEAR_CLASS =
  "mt-4 rounded-[var(--radius-lg)] border border-success/28 bg-success/8 px-4 py-4 text-center sm:text-left";

export const ADMIN_INBOX_ALL_CLEAR_ICON_CLASS =
  "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success sm:mx-0";

/** 筛选区 · 重置 / 取消（Console · 暖金幽灵 · 非主 submit） */
export const ADMIN_FILTER_RESET_BTN_CLASS = `${TT_MARKETING_BTN_GHOST_WARM_CONSOLE} px-4 py-2 text-small font-medium`;

/** 错误边界 / Modal · 次操作（与 Shell 次钮同源） */
export const ADMIN_ERROR_SECONDARY_BTN_CLASS = ADMIN_SHELL_SECONDARY_BTN_CLASS;

/** Command palette · 命中行 hover */
export const ADMIN_COMMAND_PALETTE_HIT_CLASS =
  "block rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-ref-sun/10";

/** Command palette · 头部 */
export const ADMIN_COMMAND_PALETTE_HEADER_CLASS = "border-b border-ref-sun/12 p-4";

/** Command palette · 快捷键 `<kbd>` chip（首页 hint / palette 同源） */
export const ADMIN_COMMAND_PALETTE_KBD_CLASS =
  "inline-flex min-h-[1.375rem] items-center rounded-[var(--radius-sm)] border border-ref-sun/28 bg-slate-950/70 px-1.5 py-0.5 font-mono text-meta font-medium text-slate-200";

/** 分页 · 禁用占位钮 */
export const ADMIN_PAGINATION_DISABLED_CLASS =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/12 bg-ref-sun/5 px-3 py-1.5 text-small text-ink-400";

/** 列表行浅槽（财务 depth 等） */
export const ADMIN_LIST_ROW_MUTED_CLASS =
  "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-ref-sun/12 bg-ref-sun/5 px-3 py-2 text-small";

/** 提示/info 圆徽标 */
export const ADMIN_INFO_BADGE_CLASS =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ref-sun/18 bg-ref-sun/10 text-meta font-bold text-[#9a5f18]";

/** 组件内分隔线（替代 border-ink-100 / border-ink-200） */
export const ADMIN_INNER_DIVIDER_CLASS = "border-t border-ref-sun/12";

/** 表格 thead / 行分隔（暖描边 · 数据区白底） */
export const ADMIN_TABLE_ROW_DIVIDER_CLASS = "border-b border-ref-sun/12";

/** 表格 `divide-y` 行分隔（替代 divide-ink-100） */
export const ADMIN_TABLE_DIVIDE_CLASS = "divide-y divide-ref-sun/12";

/** 列表 `<table>` 常用 class 组合 */
export const ADMIN_TABLE_BASE_CLASS = `min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`;

/** 列表 `<tbody>` 常用 class 组合 */
export const ADMIN_TABLE_TBODY_CLASS = `${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`;

/** 详情页字段行分隔 */
export const ADMIN_DETAIL_FIELD_ROW_CLASS =
  "border-b border-ref-sun/12 pb-2 last:border-0 sm:border-0 sm:pb-0";

/** 详情页字段行分隔（无 sm 断点变体） */
export const ADMIN_DETAIL_FIELD_ROW_SIMPLE_CLASS = "border-b border-ref-sun/12 pb-2 last:border-0";

/** 暖色详情面板 · 字段标签 / 值 / 分区标题（slate on dark · batch60） */
export const ADMIN_DETAIL_FIELD_LABEL_CLASS = "text-meta text-slate-300";
export const ADMIN_DETAIL_FIELD_VALUE_CLASS = "mt-0.5 break-all text-small text-slate-200";
export const ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS =
  "mt-0.5 break-all font-mono text-small text-slate-200";
export const ADMIN_DETAIL_SECTION_TITLE_CLASS =
  "text-small font-semibold uppercase tracking-wide text-slate-300";

/** Console 内嵌白底块（modal 子区 / wizard 嵌套 · 替代 border-ink-100） */
export const ADMIN_CONSOLE_INNER_PANEL_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/12 bg-bg-console";

/** 定义列表 / API 对拍 dl（divide + 外框） */
export const ADMIN_DEFINITION_LIST_CLASS = `mt-2 ${ADMIN_TABLE_DIVIDE_CLASS} border border-ref-sun/12 rounded-[var(--radius-md)]`;

/** 面包屑 / 路径分隔符（替代 text-ink-300） */
export const ADMIN_BREADCRUMB_SEPARATOR_CLASS = "text-ref-sun/45";

/** 子页面包屑 · 分组/中间段（batch56 · 差阶提升） */
export const ADMIN_BREADCRUMB_GROUP_CLASS = "text-small font-medium text-slate-300";

/** 子页面包屑 · 当前叶（batch56 · 差阶提升） */
export const ADMIN_BREADCRUMB_LEAF_CLASS = "text-body font-medium text-slate-100";

/** 表单 checkbox / radio 描边 */
export const ADMIN_FORM_CHECKBOX_CLASS =
  "h-4 w-4 rounded border-ref-sun/22 text-ink-700 accent-ref-sun";

/** 路由权限横幅底边 */
export const ADMIN_ROUTE_PERM_BANNER_BORDER_CLASS = "border-b border-ref-sun/10";

/** 子页区块标题底边 */
export const ADMIN_SECTION_HEADER_DIVIDER_CLASS = "border-b border-ref-sun/12 pb-3";

/** loading 骨架控件描边 */
export const ADMIN_SKELETON_CONTROL_BORDER_CLASS = "border border-ref-sun/18";

/** Capability 条（顶栏下 actor · 深玻璃） */
export const ADMIN_CAPABILITY_STRIP_CLASS =
  "group border-b border-white/10 bg-slate-950/45 backdrop-blur-sm";

/** U8 · 待办 KPI / Inbox 卡片（idle · 深玻璃 · ref-sun 描边） */
export const ADMIN_KPI_CARD_IDLE_CLASS =
  "rounded-[var(--radius-lg)] border border-white/15 bg-slate-950/55 backdrop-blur-xl hover:border-ref-sun/35 hover:bg-slate-950/70 hover:shadow-[0_0_16px_-10px_rgba(252,164,124,0.25)]";
export const ADMIN_KPI_CARD_PENDING_CLASS =
  "rounded-[var(--radius-lg)] border-2 border-ref-sun/45 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/60 shadow-[0_0_24px_-8px_rgba(252,164,124,0.35)] hover:border-ref-sun/60";

/** 枢纽 / 观测 / schema 深链磁贴（Console outline · P2-6 · 非深壳 ADMIN_KPI_CARD_IDLE） */
export const ADMIN_HUB_DEPTH_LINK_CONSOLE_TILE_CLASS =
  "block rounded-[var(--radius-md)] border border-ref-sun/22 bg-bg-console p-3 text-left text-ink-800 shadow-soft transition hover:border-ref-sun/38 hover:bg-ref-sun/6 hover:text-ink-900 motion-reduce:transition-none";

export const ADMIN_HUB_DEPTH_LINK_CARD_CLASS = ADMIN_HUB_DEPTH_LINK_CONSOLE_TILE_CLASS;

/** 侧栏分组 `<summary>` · Batch-11：与叶同可读阶 · 禁过灰像禁用。 */
export const ADMIN_SHELL_SIDEBAR_GROUP_SUMMARY_CLASS =
  "flex cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[0.8125rem] font-medium tracking-normal text-slate-300 marker:content-none hover:text-[#ffe8d4] [&::-webkit-details-marker]:hidden";

/** 侧栏叶链接内缩 · 与组头分层 · Batch-11 W14 HU-313 */
export const ADMIN_SHELL_SIDEBAR_LEAF_LIST_CLASS = "mt-1 space-y-1.5 pb-1 pl-3";

/** 侧栏分组块间距 · Batch-11 W14 HU-313 */
export const ADMIN_SHELL_SIDEBAR_GROUP_GAP_CLASS = "mb-4";

/** 侧栏域胶囊 → 首组间距 · Batch-11 W14 HU-319 */
export const ADMIN_SHELL_SIDEBAR_DOMAIN_GAP_CLASS = "mb-4";

/** Meta build / 技术折叠触达卡 */
export const ADMIN_META_BUILD_FOLD_CARD_CLASS = `mt-6 rounded-[var(--radius-xl)] border p-4 text-left text-ink-800 ${ADMIN_KPI_CARD_IDLE_CLASS}`;

/** 深壳页头 · 只读权限徽标（VIS-03） */
export const ADMIN_PAGE_ACCESS_READONLY_BADGE_CLASS =
  "border-white/20 bg-white/6 text-slate-300";

/** Shell · 顶栏角色快切 `<select>`（奶油底 · ref-sun 描边 · `text-slate-*` 避 ink 深壳 remap · light color-scheme） */
export const ADMIN_SHELL_FORM_SELECT_CLASS =
  "max-w-[9rem] truncate rounded-[var(--radius-md)] border border-ref-sun/22 bg-[#faf8f6]/95 px-2 py-0.5 text-meta font-medium text-slate-900 [color-scheme:light]";

/** 侧栏 · 当前域上下文提示 */
export const ADMIN_SHELL_SIDEBAR_HINT_CLASS =
  "rounded-[var(--radius-md)] border border-white/12 bg-slate-950/50 px-2 py-1.5 text-meta text-slate-300";

/** 首页 · 最近访问 chip */
export const ADMIN_RECENT_VISIT_CHIP_CLASS =
  `${TT_MARKETING_BTN_GHOST_WARM_CONSOLE} px-3 py-1.5 text-small font-medium`;

/** Header Admin 模式 · 「返回站点」（深色 cinematic 顶栏 · 暖金描边 + 浅色字 · 非浅底 console ghost） */
export const ADMIN_HEADER_RETURN_SITE_CLASS =
  `${TT_MARKETING_BTN_GHOST_WARM_DARK} !w-auto px-3 text-small font-semibold`;

/** VIS · O10：列表表头 sticky（队列/经营列表共用 · 深壳） */
export const ADMIN_TABLE_THEAD_CLASS =
  "sticky top-0 z-[1] bg-slate-950/90 text-slate-300 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]";

/** 表头单元格 */
export const ADMIN_TABLE_TH_CELL_CLASS = "px-4 py-3";

/** 列表表体单元格（≥12px · P1-8 · 深壳） */
export const ADMIN_TABLE_TD_CELL_CLASS = "px-4 py-3 text-small text-slate-200";

/** 列表表体 ID / 编码列（mono · 12px） */
export const ADMIN_TABLE_TD_MONO_CLASS = "font-mono text-small text-ink-800";

/** 列表表体时间戳等次要列（仅此场景保留 text-meta） */
export const ADMIN_TABLE_TD_TIMESTAMP_CLASS = "text-meta text-ink-500 whitespace-nowrap";

/** 紧凑表体单元格（px-3 · 运维列表） */
export const ADMIN_TABLE_TD_COMPACT_CLASS = "px-3 py-2 text-small text-ink-700";

/** 紧凑表体 mono 列 */
export const ADMIN_TABLE_TD_COMPACT_MONO_CLASS = "px-3 py-2 font-mono text-small text-ink-800";

/** 紧凑表体时间戳列 */
export const ADMIN_TABLE_TD_COMPACT_TIMESTAMP_CLASS =
  "px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap";

/** 表体行最小触达高度 */
export const ADMIN_TABLE_ROW_CLASS = "[&>td]:min-h-[44px] [&>td]:align-middle";

/** U8 · 侧栏/顶栏导航（深壳 · 暖金激活 · Batch-11 W14 HU-315 左轨保留 · Batch-12 HU-468 叶字重 font-medium） */
export const ADMIN_SHELL_NAV_ACTIVE_CLASS =
  "relative font-medium text-[#ffe8d4] border-l-2 border-ref-sun/80 bg-ref-sun/15 pl-[calc(0.5rem-2px)] after:pointer-events-none after:absolute after:inset-x-0.5 after:-bottom-px after:block after:h-[2px] after:rounded-full after:bg-ref-sun/75 after:content-['']";
export const ADMIN_SHELL_NAV_IDLE_CLASS = "text-slate-200 hover:text-[#ffe8d4] hover:underline";

/** U8 · 列表/详情内联操作链（深壳） */
export const ADMIN_INLINE_LINK_CLASS = "text-slate-200 hover:text-[#ffe8d4] hover:underline";

/** Hub · URL 同步 / 深度只读 link 卡（block · mono · Console outline） */
export const ADMIN_HUB_SYNCED_LINK_CARD_CLASS =
  "block rounded-[var(--radius-md)] border border-ref-sun/22 bg-bg-console px-3 py-2 text-left text-small font-mono break-all text-ink-800 shadow-soft transition hover:border-ref-sun/38 hover:bg-ref-sun/6 motion-reduce:transition-none";

/** 待办队列卡 · 有待办（非聚焦 · 暖金描边 · 同源 Hero pill） */
export const ADMIN_INBOX_TASK_PENDING_CARD_CLASS = ADMIN_KPI_CARD_PENDING_CLASS;

/** 待办队列卡 · 聚焦模式（单 inset · 禁止 border-2 叠套） */
export const ADMIN_INBOX_TASK_PENDING_CARD_FOCUS_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/32 bg-slate-950/55 backdrop-blur-xl hover:border-ref-sun/45 hover:bg-slate-950/65";

/** KPI 强调数字（同源 Action 渐变） */
export const ADMIN_KPI_EMPHASIS_COUNT_CLASS = TT_MARKETING_ACTION_STAT_EMPHASIS;

/** 收件箱 / 首页待办 · 「去处理」主 CTA（同源 `/` 暖金实色胶囊 · 非表单方角）。 */
export const ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS = `${TT_MARKETING_BTN_PRIMARY_WARM_WIDGET} w-full`;

/** 首页聚焦条 · 打开收件箱（非全宽，避免宽屏拉满一行） */
export const ADMIN_INBOX_FOCUS_CTA_CLASS = `${TT_MARKETING_BTN_PRIMARY_WARM_WIDGET} inline-flex w-auto max-w-full shrink-0 justify-center px-5`;

/** 首页待办聚焦 · 队列卡 hero 数字（≤ text-h2 · 同源 Action 渐变） */
export const ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS =
  `text-h2 font-bold tabular-nums tracking-tight ${TT_MARKETING_ACTION_STAT_EMPHASIS}`;

/** 首页 KPI / 待办 · 强调数字 scale 上限（与待办卡同源 · 禁止 h1） */
export const ADMIN_HERO_METRIC_COUNT_CLASS = ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS;

/** 收件箱 / 首页待办 · 「查看队列」次 CTA（深壳暖描边 ghost） */
export const ADMIN_INBOX_TASK_CTA_IDLE_CLASS = ADMIN_BTN_GHOST_DARK_CLASS;

/** 聚焦待办 · 队列卡「去处理」（暖描边 outline · 可读 `#ffe8d4` · 非 gradient primary） */
export const ADMIN_INBOX_TASK_CTA_FOCUS_CLASS =
  `${ADMIN_BTN_GHOST_DARK_CLASS} w-full justify-center border-2 border-ref-sun/70 bg-ref-sun/16 font-semibold text-[#fff1e6] hover:border-ref-sun/85 hover:bg-ref-sun/24 hover:text-white`;

/** 聚焦待办 · 收件箱区无 WarmL5 满框（减套盒） */
export const ADMIN_INBOX_FOCUS_SECTION_CLASS = "space-y-3";

/** 首页折叠区 · 紧凑框（聚焦待办 · 无 WarmL5 满框） */
export const ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS =
  "overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-slate-950/40";

/** 次按钮 / 幽灵 pill（与 `ADMIN_INBOX_TASK_CTA_IDLE_CLASS` 同源） */
export const ADMIN_SECONDARY_PILL_BTN_CLASS = ADMIN_INBOX_TASK_CTA_IDLE_CLASS;

/** Shell · 深壳次按钮（预览条 / 顶栏 · 非白卡 Console ghost） */
export const ADMIN_SHELL_BTN_GHOST_DARK_CLASS = `${ADMIN_BTN_GHOST_DARK_CLASS} px-3 py-1.5 text-meta font-medium`;

/** 动线快链 chip · 有待办（深壳 · 暖金描边 · 可读字 `#ffe8d4`） */
export const ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS =
  "inline-flex items-center rounded-full border-2 border-ref-sun/45 bg-ref-sun/16 px-3 py-1.5 text-meta font-medium text-[#ffe8d4] shadow-[0_0_14px_-6px_rgba(252,164,124,0.35)] hover:border-ref-sun/60 hover:bg-ref-sun/22 hover:text-white";

/** 动线快链 chip · 空闲（深壳暖描边 ghost） */
export const ADMIN_INBOX_WORKFLOW_CHIP_IDLE_CLASS = `${ADMIN_BTN_GHOST_DARK_CLASS} px-3 py-1.5 text-meta font-medium`;

/** 首页待办 · 聚焦区内胆（单重 inset · 避免 widget 内三重满框） */
export const ADMIN_INBOX_FOCUS_INSET_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/6 px-4 py-3";

/** 首页待办 · 动线快链编组（与聚焦条同族 inset） */
export const ADMIN_INBOX_WORKFLOW_NAV_PANEL_CLASS = `${ADMIN_INBOX_FOCUS_INSET_CLASS} px-3 py-2.5`;

/**
 * Batch-12 HU-438 · Inbox 聚焦提示条 **次强**（描边金 · 高度≤标题带 · 不压概况）。
 * 禁止满填橙条 / primary 暖按钮抢戏；奶油 `#faf8f6` 仍禁。
 */
export const ADMIN_INBOX_FOCUS_BANNER_CLASS =
  "inline-flex max-w-full items-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-transparent px-2.5 py-1 text-small font-medium leading-snug text-ink-700";

/** Batch-12 HU-438 · 「打开统一收件箱」次强描边 CTA（focus 顶行 · 高度贴标题带） */
export const ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS =
  "inline-flex min-h-[2rem] items-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-transparent px-2.5 py-1 text-small font-medium text-ink-800 hover:border-ref-sun/55 hover:bg-ref-sun/8 hover:text-ink-900";

/** Staging / contract needle · keep literal (names minify). */
export const TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK =
  "tt_admin_inbox_focus_banner_secondary_hu438";

/** 首页模块搜索 · 命中行（深壳玻璃） */
export const ADMIN_HOME_SEARCH_HIT_LINK_CLASS =
  "block rounded-[var(--radius-md)] border border-white/12 bg-slate-950/40 p-3 hover:border-ref-sun/35 hover:bg-slate-950/60";

/** 2FA 策略已启用徽标（与 ADMIN_TIER_SUPER_WRITE_BADGE_CLASS 同系 warning/10） */
export const ADMIN_2FA_POLICY_ACTIVE_BADGE_CLASS =
  "rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-meta text-ink-800";

/** 队列状态 pill · 待处理 / open（审批 / 举报等） */
export const ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS =
  "rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-meta font-medium text-ink-800";

/** 队列状态 pill · 中性 */
export const ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS = "bg-ref-sun/10 text-ink-700";

/** 队列状态 pill · 已通过 */
export const ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS =
  "rounded-full border border-success/28 bg-success/10 px-2 py-0.5 text-meta font-medium text-success";

/** 队列状态 pill · 已驳回 */
export const ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS = "bg-danger/10 text-danger";

/** 首页 / 统一收件箱 · 单通道拉取失败提示（深壳可读 amber） */
export const ADMIN_INBOX_CHANNEL_ERROR_CLASS = "mt-2 text-meta text-amber-200/90";

/** 首页 widget 区编组画布（深壳浅槽 · 暖金描边） */
export const ADMIN_HOME_CANVAS_CLASS =
  "rounded-[var(--radius-xl)] border border-white/12 bg-slate-950/35 p-4 shadow-[0_0_32px_-16px_rgba(252,164,124,0.2)] backdrop-blur-sm sm:p-5";

/** VIS-17 · 聚焦待办时首页页头（无 WarmL5 满框 · 单行 title + ⌘K） */
export const ADMIN_HOME_FOCUS_HEADER_CLASS =
  "mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 pb-3";

/** 聚焦待办 · widget 画布（无外层白描边 · 浅槽） */
export const ADMIN_HOME_FOCUS_CANVAS_CLASS = "rounded-[var(--radius-xl)] bg-slate-950/25 p-3 sm:p-4";

/** 收件箱聚焦 · 主卡旁速览栏（域健康 / 最近访问） */
export const ADMIN_HOME_FOCUS_COMPANION_CLASS =
  "rounded-[var(--radius-lg)] border border-white/10 bg-slate-950/35 p-3 sm:p-4 lg:sticky lg:top-[4.5rem] lg:self-start";

/** 首页系统概览 · KPI 趋势迷你柱图（深壳 slate 轴 · batch58） */
export const ADMIN_SYSTEM_OVERVIEW_TREND_CHART_CLASS = "mt-3 flex gap-2";
export const ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS =
  "flex h-28 flex-col justify-between py-0.5 text-small tabular-nums text-slate-300";
export const ADMIN_SYSTEM_OVERVIEW_TREND_BARS_CLASS = "relative flex h-28 flex-1 items-end gap-1.5";
export const ADMIN_SYSTEM_OVERVIEW_TREND_BAR_COLUMN_CLASS =
  "relative z-[1] flex min-w-0 flex-1 flex-col items-center gap-1";
export const ADMIN_SYSTEM_OVERVIEW_TREND_BAR_AREA_CLASS =
  "relative flex h-[5.5rem] w-full flex-col items-center justify-end";
export const ADMIN_SYSTEM_OVERVIEW_TREND_BAR_VALUE_CLASS =
  "absolute top-0 z-[2] w-full text-center text-small tabular-nums";
export const ADMIN_SYSTEM_OVERVIEW_CHAIN_VALUE_CLASS =
  "mt-auto pt-2 text-small font-mono font-semibold tabular-nums leading-snug text-ink-300";

/** 侧栏桌面列（深玻璃 · 同源 `/orders` toolbar 壳） */
export const ADMIN_SHELL_SIDEBAR_SURFACE_CLASS =
  "hidden w-56 shrink-0 border-r border-white/10 bg-[#0c0a09]/72 backdrop-blur-md lg:block";

/** @deprecated widget 须 `AdminWarmL5Surface`（保留 grep 锚点） */
export const ADMIN_HOME_WIDGET_CARD_CLASS = ADMIN_WARM_L5_FRAME_CLASS;

/** 列表 / 枢纽页内容区浅底画布（与首页 widget 区同源） */
export const ADMIN_LIST_PAGE_BODY_CANVAS_CLASS = `${ADMIN_HOME_CANVAS_CLASS} mt-6 space-y-4`;

/** FIN-02 · partial 深度 · 暖金 L5 外框锚点 */
export const ADMIN_FIN_DEPTH_PANEL_CLASS = `${ADMIN_WARM_L5_FRAME_CLASS} mb-4`;

/** 首页 inbox · 无权限通道行 */
export const ADMIN_INBOX_PERM_DENIED_ROW_CLASS =
  "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-ref-sun/15 bg-ref-sun/5 px-3 py-2 text-meta text-slate-300";

/** 入驻/审批队列行卡（Batch-9 U2 · Warm L5 暗玻璃 · 禁经营面白表主壳） */
export const ADMIN_QUEUE_LIST_ROW_CARD_CLASS = `${ADMIN_WARM_L5_FRAME_CLASS} p-4`;

/** 审批工作台行卡锚点（与队列同源） */
export const ADMIN_APPROVAL_QUEUE_ROW_CARD_CLASS = ADMIN_QUEUE_LIST_ROW_CARD_CLASS;

/** U8 · 队列行 open/pending 高亮 */
export const ADMIN_TABLE_ROW_PENDING_CLASS = "bg-ref-sun/6";

/** U8 · 待办计数 outline 徽标（侧栏/折叠 · 与 gradient 数字/CTA 区分 · VIS-11） */
export const ADMIN_PENDING_COUNT_BADGE_CLASS =
  "inline-flex items-center self-center rounded-full border border-ref-sun/45 bg-slate-950/50 px-2.5 py-0.5 text-meta font-semibold tabular-nums text-[#ffe8d4]";

/** Batch-13 HU-485 · 顶栏 Inbox 次级描边徽标（降橙条权重 · 不压品牌） */
export const ADMIN_PENDING_COUNT_BADGE_SECONDARY_CLASS =
  "inline-flex items-center self-center rounded-full border border-ref-sun/55 bg-transparent px-2 py-0.5 text-meta font-medium tabular-nums text-ref-sun";

/** HU-275 · 财务工作流列表快照（≠ 待办徽标视觉） */
export const ADMIN_FIN_WORKFLOW_SNAPSHOT_BADGE_CLASS =
  "inline-flex items-center self-center rounded-[var(--radius-sm)] border border-slate-600/60 bg-slate-900/40 px-2 py-0.5 text-meta font-medium tabular-nums text-slate-300";

/** U9 · 动效克制（须带 motion-reduce 回退） */
export const ADMIN_MOTION_NAV_CLASS =
  "motion-sub rounded-[var(--radius-sm)] motion-reduce:transition-none";
export const ADMIN_MOTION_COLOR_TRANSITION_CLASS =
  "transition-colors duration-150 motion-reduce:transition-none";
export const ADMIN_MOTION_CARD_HOVER_CLASS =
  "transition-[border-color,background-color] duration-150 motion-reduce:transition-none";
export const ADMIN_MOTION_SKELETON_CLASS = "animate-pulse motion-reduce:animate-none";

/** 主操作按钮（批准 / 处置 / 去审核）— VIS-07 · warm 主色与首页 CTA 对齐 */
export const ADMIN_PRIMARY_ACTION_BTN_CLASS = TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT;

/**
 * Batch-10 W13 · HU-210/242 · 三档 CTA 锁（深壳运营页）
 * primary = 暖金实心 · secondary = 暖描边 ghost · danger = 危险语义
 */
export const ADMIN_BTN_PRIMARY_CLASS = ADMIN_PRIMARY_ACTION_BTN_CLASS;
export const ADMIN_BTN_SECONDARY_CLASS = ADMIN_SHELL_SECONDARY_BTN_CLASS;
export const ADMIN_BTN_DANGER_CLASS =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-danger/35 bg-danger/15 px-4 py-2 text-small font-semibold text-danger hover:bg-danger/25";

/** 列表 quick filter chip（激活 · 同源 `/` 暖金 Tab） */
export const ADMIN_FILTER_CHIP_ACTIVE_CLASS = `border border-ref-sun/40 ${TT_MARKETING_ACTION_GRADIENT_FILL} font-semibold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW}`;

export const ADMIN_FILTER_CHIP_IDLE_CLASS =
  "border-ref-sun/22 bg-ref-sun/6 text-ink-700 hover:border-ref-sun/38 hover:bg-ref-sun/12 hover:text-[#9a5f18]";

export function adminFilterChipClass(active: boolean): string {
  return active ? ADMIN_FILTER_CHIP_ACTIVE_CLASS : ADMIN_FILTER_CHIP_IDLE_CLASS;
}

/** 操作手册步骤圆点 / 时间线节点（暖金实色 · 非 ink-800） */
export const ADMIN_STEP_MARKER_CLASS =
  `flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ref-sun/35 ${TT_MARKETING_ACTION_GRADIENT_FILL} text-small font-bold text-[#0c0a09] ${TT_MARKETING_ACTION_GRADIENT_SHADOW}`;

export const ADMIN_TIMELINE_DOT_CLASS =
  "absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-ref-sun/80";

/** 时间线左侧导轨 */
export const ADMIN_TIMELINE_RAIL_CLASS = "border-l-2 border-ref-sun/22 pl-4";

/** 队列收件条 / inbox strip（深壳暖槽 · Batch-10 W13 HU-220 · 禁奶油 `#faf8f6`） */
export const ADMIN_CONSOLE_INBOX_STRIP_CLASS =
  "rounded-[var(--radius-xl)] border border-ref-sun/18 bg-ref-sun/8 p-4 shadow-[0_0_20px_-12px_rgba(252,164,124,0.18)]";

/** 子路由错误页重试主按钮（暖金 submit · 非 ink-900） */
export const ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS = TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT;

/** 首页搜索高亮 */
export const ADMIN_CONSOLE_SEARCH_MARK_CLASS = "rounded bg-ref-sun/22 px-0.5 font-medium text-ink-900";

/** Shell 部署环境徽章 */
export const ADMIN_DEPLOY_ENV_STAGING_BADGE_CLASS =
  "border-warning/40 bg-warning/10 text-ink-800";

export const ADMIN_DEPLOY_ENV_PRODUCTION_BADGE_CLASS = "border-danger/30 bg-danger/10 text-danger";

export const ADMIN_DEPLOY_ENV_LOCAL_BADGE_CLASS = "border-ref-sun/22 bg-ref-sun/8 text-[#9a5f18]";

/** 路由 loading 骨架按钮块 */
export const ADMIN_CONSOLE_SKELETON_BTN_CLASS =
  "min-h-[44px] h-11 rounded-[var(--radius-sm)] bg-ref-sun/12";

/** 路由 loading · 块骨架（替代 bg-ink-50） */
export const ADMIN_CONSOLE_SKELETON_BLOCK_CLASS = "bg-ref-sun/8";

/** Console · 浅暖槽面板（callout / timeline / inbox hint · 替代 bg-ink-50） */
export const ADMIN_CONSOLE_MUTED_PANEL_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/14 bg-ref-sun/5";

/** Console · 浅暖槽面板 + 内边距（财务 drift 等嵌套块） */
export const ADMIN_CONSOLE_MUTED_PANEL_PAD_CLASS = `${ADMIN_CONSOLE_MUTED_PANEL_CLASS} p-4`;

/** Console · 深壳嵌套块（紧凑 pre · Batch-10 W13 HU-220 · 禁奶油） */
export const ADMIN_CONSOLE_MUTED_BLOCK_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/12 bg-[#0c0a09]/55 text-slate-200";

/** 收购 publish suspend · 状态条 */
export const ADMIN_ACQUISITION_SUSPEND_ACTIVE_STATUS_CLASS =
  "mt-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-3 py-2.5 text-meta text-danger";

export const ADMIN_ACQUISITION_SUSPEND_CLEAR_STATUS_CLASS =
  "mt-3 rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-3 py-2.5 text-meta text-success";

/** 表单字段 · 校验错误描边/文案（保留 danger 语义） */
export const ADMIN_FORM_FIELD_ERROR_BORDER_CLASS = "border-red-400";

export const ADMIN_FORM_FIELD_ERROR_TEXT_CLASS = "mt-1 text-meta text-red-700";

/** 列表 fetch / 表单 / 写操作失败告警（HON-03） */
export const ADMIN_ALERT_ERROR_CLASS =
  "rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-danger";

export const ADMIN_ALERT_ERROR_COMPACT_CLASS =
  "rounded-[var(--radius-sm)] border border-danger/20 bg-danger/5 p-2 text-small text-danger";

export const ADMIN_LIST_FETCH_ERROR_CLASS = `mt-6 ${ADMIN_ALERT_ERROR_CLASS} text-body`;

/** 用户列表 · 收购 publish 已 suspend 行内徽标链 */
export const ADMIN_ACQUISITION_SUSPENDED_ROW_BADGE_CLASS =
  "inline-flex rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 px-2 py-0.5 text-meta font-medium text-danger hover:underline";

/** trust-growth · 警告级 outline 钮 */
export const ADMIN_WARNING_SOFT_BTN_CLASS =
  "rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-2 text-small font-medium text-ink-900 hover:bg-warning/15 disabled:opacity-50";

/** 写操作成功 dismiss 次链（success hover tint） */
export const ADMIN_SUCCESS_DISMISS_LINK_CLASS =
  "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] px-3 text-small text-ink-700 hover:bg-success/15 hover:underline";

/** Console · JSON / telemetry `<pre>`（暖棕深色底 · 非冷灰 ink-900 · 页级滚动 · 勿嵌套 max-h） */
export const ADMIN_CONSOLE_JSON_BLOCK_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/16 bg-[#1a1410]/95 p-3 text-left text-meta text-[#f5ebe3]";

/** Console · JSON 表格容器（audit ops 等） */
export const ADMIN_CONSOLE_JSON_TABLE_WRAPPER_CLASS =
  "overflow-auto rounded-[var(--radius-md)] border border-ref-sun/16 bg-[#1a1410]/95";

export const ADMIN_CONSOLE_JSON_TABLE_CLASS =
  "w-full min-w-[min(100%,36rem)] border-collapse text-left text-meta text-[#f5ebe3]";

export const ADMIN_CONSOLE_JSON_TABLE_THEAD_CLASS =
  "sticky top-0 z-[1] bg-[#1a1410]/98 backdrop-blur-sm";

/** 错误边界内卡片（暖金 L5 内胆 · 非白盒 shadow-soft） */
export const ADMIN_CONSOLE_ERROR_PANEL_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/22 bg-gradient-to-b from-[#faf8f6]/98 to-bg-console p-6 shadow-[0_0_20px_-12px_rgba(252,164,124,0.28)]";

/** 表单 / wizard 步骤级校验错误横幅 */
export const ADMIN_FORM_ERROR_BANNER_CLASS =
  "rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 p-3 text-small text-danger";

/** 软 destructive 描边钮（撤销 entitlement 等） */
export const ADMIN_DESTRUCTIVE_SOFT_BTN_CLASS =
  "rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 px-3 py-2 text-small font-medium text-danger hover:bg-danger/10 disabled:opacity-50";

/** 队列审核 · 通过 / 驳回实心钮（steward / provider 卡片） */
export const ADMIN_SEMANTIC_APPROVE_BTN_CLASS =
  "rounded-[var(--radius-sm)] bg-success px-3 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50";

export const ADMIN_SEMANTIC_REJECT_BTN_CLASS =
  "rounded-[var(--radius-sm)] bg-danger px-3 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50";

/** 权限矩阵 · 「是」列 */
export const ADMIN_PERMISSION_YES_TEXT_CLASS = "text-success";

/** 列表 · 中性状态 pill（订单 state 等） */
export const ADMIN_STATUS_NEUTRAL_BADGE_CLASS =
  "inline-flex rounded-full border border-ref-sun/14 bg-ref-sun/8 px-2 py-0.5 text-meta font-medium text-ink-800";

/** 首页 / 折叠区 chevron 圆钮 */
export const ADMIN_COLLAPSE_CHEVRON_CLASS =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ref-sun/14 bg-ref-sun/10 text-slate-300";

/** 路由 loading · 线骨架（替代 bg-ink-100） */
export const ADMIN_CONSOLE_SKELETON_LINE_CLASS = "bg-ref-sun/12";

/** 路由 loading · 块骨架（较粗 · 替代 bg-ink-200） */
export const ADMIN_CONSOLE_SKELETON_HEAD_CLASS = "bg-ref-sun/20";

/** 财务对账 · aligned 徽标 */
export const ADMIN_FIN_RECON_ALIGNED_BADGE_CLASS =
  "border-ref-sun/22 bg-ref-sun/10 text-ink-800";

/** 财务对账 · misaligned / unknown 徽标 */
export const ADMIN_FIN_RECON_MISALIGNED_BADGE_CLASS =
  "border-warning/40 bg-warning/10 text-ink-900";

/** 财务对账 · alignment 徽标容器 */
export const ADMIN_FIN_RECON_ALIGNMENT_BADGE_BASE_CLASS =
  "rounded-[var(--radius-md)] border px-3 py-2";

/** 权限矩阵 · 图例 diff swatch */
export const ADMIN_ROLE_MATRIX_DIFF_SWATCH_CLASS =
  "inline-block h-3 w-6 rounded border border-ref-sun/14";

/** 权限矩阵 · 当前角色行高亮 */
export const ADMIN_ROLE_MATRIX_CURRENT_ROW_CLASS = "bg-ref-sun/8";

/** 权限矩阵 · 图例 swatch（当前角色） */
export const ADMIN_ROLE_MATRIX_CURRENT_SWATCH_CLASS =
  "inline-block h-3 w-6 rounded border border-ref-sun/18 bg-ref-sun/8";

/** Shell 预览 · 角色快切 chip */
export const ADMIN_SHELL_PREVIEW_ACTIVE_ROLE_CLASS =
  "border-ref-sun/45 bg-ref-sun/16 text-ink-900";
export const ADMIN_SHELL_PREVIEW_CURRENT_ROLE_CLASS =
  "border-ref-sun/28 bg-ref-sun/10 text-ink-800";
export const ADMIN_SHELL_PREVIEW_IDLE_ROLE_CLASS =
  "border-ref-sun/14 bg-bg-console text-ink-700 hover:border-ref-sun/28";

/** Shell 预览 · 侧栏分组可见性 chip */
export const ADMIN_SHELL_PREVIEW_GROUP_VISIBLE_CLASS =
  "border-ref-sun/18 bg-ref-sun/8 text-ink-800";
export const ADMIN_SHELL_PREVIEW_GROUP_HIDDEN_CLASS =
  "border-ref-sun/12 bg-ref-sun/5 text-ink-500";

/** 信息 callout 面板（角色条 / 财务深度链等 · 暖金浅槽） */
export const ADMIN_CONSOLE_CALLOUT_PANEL_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/16 bg-ref-sun/5 p-4";

/** 枢纽内嵌卡（白底表单/表格内 · 奶油抬升） */
export const ADMIN_NESTED_CALLOUT_CARD_CLASS =
  "rounded-[var(--radius-lg)] border border-ref-sun/12 bg-[#faf8f6]/90 p-4";

/** 深壳枢纽内嵌 KPI / 台账（WarmL5 内 · 非奶油 `#faf8f6`） */
export const ADMIN_HUB_NESTED_KPI_CARD_CLASS =
  `${ADMIN_DARK_GLASS_PANEL_CLASS} border-ref-sun/18 bg-[#0c0a09]/62 text-slate-100`;

/** Console 浅底 KPI / 台账嵌套卡（白底上下文 · 非 WarmL5 深壳） */
export const ADMIN_KPI_CARD_CONSOLE_IDLE_CLASS = ADMIN_NESTED_CALLOUT_CARD_CLASS;

export const ADMIN_CONSOLE_CALLOUT_LINK_CLASS = `${TT_MARKETING_BTN_GHOST_WARM_CONSOLE} px-3 py-1.5 text-small font-medium`;

/** meta build 注脚左边线 */
export const ADMIN_META_NOTE_ACCENT_BORDER_CLASS = "border-l-2 border-ref-sun/35 pl-3 pr-1";

/** 深壳页头 · 可写权限徽标（VIS-03 · 浅色暖金字 · 非 `#9a5f18` 深棕） */
export const ADMIN_PAGE_ACCESS_WRITABLE_BADGE_CLASS =
  "border-ref-sun/40 bg-ref-sun/14 text-[#e8c96a]";

/** 权限矩阵 super-only 徽标 */
export const ADMIN_TIER_SUPER_WRITE_BADGE_CLASS =
  "ml-2 rounded-full border border-warning/30 bg-warning/10 px-1.5 text-meta text-ink-800";

/** trust-growth 变体条 · control 色（暖棕深底 · 非冷灰 ink-700） */
export const ADMIN_VARIANT_BAR_CONTROL_CLASS = "bg-[#3d2f25]";

/** trust-growth 变体条 · minimal_delayed */
export const ADMIN_VARIANT_BAR_MINIMAL_CLASS = "bg-ref-sun/55";

/** 争议状态时间线 · 当前步 pill */
export const ADMIN_DISPUTE_STATUS_ACTIVE_CLASS = `rounded-full border border-ref-sun/35 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-2 py-0.5 text-meta font-semibold text-[#0c0a09]`;

/** VIS-05：警告 / 只读范围提示（ink-800 on warning/10） */
export const ADMIN_NOTICE_WARNING_CLASS =
  "rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-3 text-body text-ink-800";

/** VIS-05 · 琥珀/attention 面板（权限横幅 · 入驻队列 · 首页 tier 提示 · 暖金 tint） */
export const ADMIN_ATTENTION_CALLOUT_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/28 bg-ref-sun/8 p-3 text-small text-ink-800";

/** RP-011 · meta.build git_sha unknown 诚实披露（Observability 链） */
export const ADMIN_META_BUILD_GIT_UNKNOWN_CLASS =
  "mt-2 rounded-[var(--radius-md)] border border-ref-sun/22 bg-ref-sun/6 px-3 py-2.5 text-small text-ink-700";

/** 列表页 applied_filters 回显横幅（card / inline / panel · SSOT） */
export const ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/15 bg-ref-sun/5 p-3 text-small text-ink-700";

export const ADMIN_APPLIED_FILTERS_BANNER_INLINE_CLASS =
  "text-meta text-slate-300 font-mono break-all";

export const ADMIN_APPLIED_FILTERS_BANNER_PANEL_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/15 bg-ref-sun/5 p-3 text-small text-ink-700";

/** indexer 运维提示链卡 */
export const ADMIN_INDEXER_OPS_HINT_CARD_CLASS =
  "rounded-[var(--radius-xl)] border border-ref-sun/22 bg-ref-sun/6 p-4 text-left text-ink-800 transition hover:border-ref-sun/35 hover:bg-ref-sun/10";

/** 顶栏下全宽 attention 条（无 approve 权限等 · 暖金 tint） */
export const ADMIN_ATTENTION_STRIP_CLASS = "border-b border-ref-sun/22 bg-ref-sun/8";

export const ADMIN_ATTENTION_STRIP_TEXT_CLASS = "text-small font-medium text-ink-800";

/** 路由缺省权限横幅容器（叠在 callout 外） */
export const ADMIN_ROUTE_PERM_BANNER_WRAP_CLASS = "mx-auto max-w-6xl px-4 sm:px-6 mt-3";

/** RBAC-04 · 六角色矩阵与当前角色 diff 高亮 */
export const ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS = "bg-warning/10";

export const ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS = "font-medium text-ink-800";

/** 首页/侧栏卡片 tier · 高权限（深壳 · 浅色字） */
export const ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS =
  "border-amber-400/40 bg-amber-400/12 text-amber-200";

export const ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS =
  "border-ref-sun/40 bg-ref-sun/14 text-[#e8c96a]";

export const ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS =
  "border-white/18 bg-white/6 text-slate-300";

/** 占位模块徽标（深壳 · 实线边框 · 非 dashed · 非奶油底） */
export const ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS =
  "border-white/12 bg-white/5 text-slate-400";

/** FIN-02 · 工作流步骤内卡（WarmL5 深嵌 · 非奶油 `#faf8f6` · batch57） */
export const ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS =
  `${ADMIN_HUB_NESTED_KPI_CARD_CLASS} rounded-[var(--radius-md)] p-3`;

/** ① 财务 partial / PSP 诚实折叠（深壳暖边 · 非 amber-50 奶油） */
export const ADMIN_FIN_PHASE_HONESTY_FOLD_CLASS =
  "mt-6 rounded-[var(--radius-lg)] border border-ref-sun/22 bg-[#0c0a09]/55 p-4 text-slate-200";

/** 财务枢纽 partial 模块格（与 `ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS` 同源） */
export const ADMIN_FIN_SUITE_DEPTH_MODULE_CLASS = ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS;

/** 观测 / ADM-U01 预备 / 首页 inbox 工作流折叠等 · 步骤内嵌块 */
export const ADMIN_WORKFLOW_INNER_CARD_CLASS = ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS;

/** 首页 inbox 等工作流说明折叠（`<details>` · 深壳玻璃） */
export const ADMIN_WORKFLOW_FOLD_PANEL_CLASS = `${ADMIN_DARK_GLASS_PANEL_CLASS} px-3 py-2`;

/** 首页维护者 / 技术 / REST 对照折叠（`<details>` · 深壳玻璃） */
export const ADMIN_HOME_MAINTAINER_FOLD_CLASS = `${ADMIN_DARK_GLASS_PANEL_XL_CLASS} p-4`;

export const ADMIN_HOME_TECH_FOLD_CLASS = `${ADMIN_DARK_GLASS_PANEL_XL_CLASS} p-4`;

export const ADMIN_HOME_DEV_API_FOLD_CLASS = `mt-10 ${ADMIN_DARK_GLASS_PANEL_XL_CLASS} p-4`;

/** KPI 经营快照 · 列表上限诚实说明（深壳玻璃） */
export const ADMIN_KPI_SCOPE_NOTE_CLASS =
  `mt-3 flex items-start gap-2 border-l-2 border-ref-sun/35 ${ADMIN_DARK_GLASS_PANEL_CLASS} px-3 py-2.5`;

/** 首页 embedded KPI 折叠 · summary 左 accent（配重 · VIS-19） */
export const ADMIN_KPI_EMBEDDED_FOLD_SUMMARY_CLASS = "border-l-2 border-ref-sun/35 pl-3";

/** 审计对拍轻量互链条 */
export const ADMIN_AUDIT_COMPARE_LINKS_CLASS =
  "mt-4 rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 px-3 py-2.5 text-small text-ink-700";

/** 统一收件箱 · 任务内联详情区（深壳玻璃） */
export const ADMIN_UNIFIED_INBOX_TASK_DETAIL_CLASS = `mt-4 ${ADMIN_DARK_GLASS_PANEL_CLASS} p-3 text-small outline-none`;

/** 社区子页 · 相关链接折叠 */
export const ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 px-3 py-2";

/** 多源对拍 · 槽位页内跳转 nav（暖 L5 · 非白条 · batch54） */
export const ADMIN_CROSS_CHECK_SLOTS_JUMP_NAV_CLASS =
  "border-b border-ref-sun/14 bg-ref-sun/5 px-4 py-3 sm:px-5";

/** 权限页 · 维护者预备区折叠 */
export const ADMIN_PERMISSIONS_MAINTAINER_FOLD_CLASS =
  `mt-6 ${ADMIN_CONSOLE_MUTED_PANEL_CLASS} p-3`;

/** IA-04 · super 权限引导条 */
export const ADMIN_SUPER_HINT_BANNER_CLASS =
  `mt-4 rounded-[var(--radius-md)] border border-ref-sun/14 bg-ref-sun/5 p-3 text-small text-ink-700`;

/** Phase② runbook 条 · 内嵌命令卡 */
export const ADMIN_PHASE2_RUNBOOK_STRIP_CLASS = `mt-4 ${ADMIN_CONSOLE_CALLOUT_PANEL_CLASS}`;

export const ADMIN_PHASE2_RUNBOOK_ITEM_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/14 bg-bg-console p-3";

/** 列表 loading 骨架 · 链上事件表形态 */
export const ADMIN_TABLE_LOADING_SKELETON_CLASS = `mt-8 ${ADMIN_TABLE_SURFACE_CLASS}`;

/** 审批详情 · 批准/驳回双栏处置区 */
export const ADMIN_APPROVAL_APPROVE_ACTION_CLASS =
  "rounded-[var(--radius-lg)] border border-success/28 bg-success/8 p-4";

/** 审批详情 · 批准区标题 */
export const ADMIN_APPROVAL_APPROVE_HEADING_CLASS = "text-small font-semibold text-success";

/** 审批详情 · 驳回 outline 钮 */
export const ADMIN_APPROVAL_REJECT_OUTLINE_BTN_CLASS =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-danger bg-bg-console px-4 py-2 text-small font-medium text-danger hover:bg-danger/10 disabled:opacity-50";

export const ADMIN_APPROVAL_REJECT_ACTION_CLASS =
  "rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-4";

/** 域健康 · 正常（深壳可读） */
export const ADMIN_DOMAIN_HEALTH_OK_CARD_CLASS =
  "border-success/35 bg-success/12 text-emerald-100";

export const ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS = "bg-success";

export const ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS =
  "border-ref-sun/40 bg-ref-sun/12 text-[#ffe8d4]";

export const ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS = "bg-ref-sun";

/** 域健康 · 中性（深壳） */
export const ADMIN_DOMAIN_HEALTH_NEUTRAL_CARD_CLASS =
  "border-white/14 bg-slate-950/55 text-slate-200";

export const ADMIN_DOMAIN_HEALTH_NEUTRAL_DOT_CLASS = "bg-slate-400";

/** 域健康 · 未知 / 无数据 · Batch-11 HU-321：禁白底灰字 */
export const ADMIN_DOMAIN_HEALTH_UNKNOWN_CARD_CLASS =
  "border-white/12 bg-slate-950/60 text-slate-200";

export const ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS = "bg-slate-500";

export const ADMIN_NOTICE_WARNING_LG_CLASS =
  "rounded-[var(--radius-lg)] border border-warning/30 bg-warning/10 p-4 text-body text-ink-800";

/** trust-growth / 告警条 · warn 级 */
export const ADMIN_ALERT_WARN_ITEM_CLASS =
  "rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3 py-2 text-small text-ink-900";

/** trust-growth / 告警条 · critical 级 */
export const ADMIN_ALERT_CRITICAL_ITEM_CLASS =
  "rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 px-3 py-2 text-small text-danger";

/** VIS-05：中性 info 提示 */
export const ADMIN_NOTICE_INFO_CLASS =
  "rounded-[var(--radius-md)] border border-ref-sun/16 bg-ref-sun/6 p-3 text-body text-ink-800";

/** VIS-05 / HON-03：写操作成功反馈 */
export const ADMIN_NOTICE_SUCCESS_CLASS =
  "rounded-[var(--radius-md)] border border-success/25 bg-success/10 p-3 text-body text-success";

/** 首页 Inbox 待办计数徽标（U8 · 与 ADMIN_PENDING_COUNT_BADGE_CLASS 同源） */
export const ADMIN_INBOX_PENDING_BADGE_CLASS = ADMIN_PENDING_COUNT_BADGE_CLASS;

/** FIN-02 · ① 模块深度标签（非 ② 页内闭环） */
export type AdminFinanceSuiteModuleStatus = "active" | "partial" | "placeholder";

export const ADMIN_FIN_SUITE_STATUS_ACTIVE_CLASS =
  "inline-flex rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-meta font-medium text-ink-800";

export const ADMIN_FIN_SUITE_STATUS_PARTIAL_CLASS =
  "inline-flex rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-meta font-medium text-ink-800";

export const ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS =
  "inline-flex rounded-full border border-ref-sun/16 bg-ref-sun/6 px-2 py-0.5 text-meta font-medium text-slate-300";

/** FIN-02 · 财务套件深链导出区聚焦环 */
export const ADMIN_FIN_SUITE_EXPORT_FOCUS_RING_CLASS =
  "rounded-[var(--radius-md)] ring-2 ring-ref-sun/35 ring-offset-2";

/** 举报处置向导步骤 chip */
export const ADMIN_WIZARD_STEP_ACTIVE_CLASS = "border-ref-sun/40 bg-ref-sun/12 text-ink-900";

export const ADMIN_WIZARD_STEP_DONE_CLASS =
  "border-success/28 bg-success/8 text-success";

export const ADMIN_WIZARD_STEP_IDLE_CLASS = "border-ref-sun/14 bg-ref-sun/5 text-slate-300";

export function adminWizardStepClass(active: boolean, done: boolean): string {
  if (active) return ADMIN_WIZARD_STEP_ACTIVE_CLASS;
  if (done) return ADMIN_WIZARD_STEP_DONE_CLASS;
  return ADMIN_WIZARD_STEP_IDLE_CLASS;
}

/** AdminShellBar / 子页顶栏 nav（U8 ink · U9 motion-reduce） */
export function adminShellNavLinkClass(active: boolean): string {
  return `${touchTargetLink44Classes} font-medium ${ADMIN_MOTION_NAV_CLASS} ${
    active ? ADMIN_SHELL_NAV_ACTIVE_CLASS : ADMIN_SHELL_NAV_IDLE_CLASS
  } ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
}

/** Shell 顶栏 / 分组内链 class 片段（与 adminShellNavLinkClass 同色） */
export function adminShellTopNavLinkClass(active: boolean): string {
  return active ? ADMIN_SHELL_NAV_ACTIVE_CLASS : ADMIN_SHELL_NAV_IDLE_CLASS;
}

/** 表内 / 列表内联链（U8） */
/** 白卡表格内链：须用 travel/ink 色，勿复用深壳 `ADMIN_INLINE_LINK_CLASS`（slate-200 在 `#faf8f6` 上不可读）。 */
export const ADMIN_TABLE_INLINE_LINK_CLASS =
  "text-travel-700 hover:text-travel-900 hover:underline";

export function adminTableInlineLinkClass(): string {
  return `${touchTargetLink44Classes} font-medium whitespace-nowrap ${ADMIN_TABLE_INLINE_LINK_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`;
}

/** 列表行内主操作（紧凑 warm pill · 与页面级 PRIMARY 同系 · HU-210） */
export const ADMIN_TABLE_PRIMARY_ACTION_BTN_CLASS =
  "inline-flex min-h-[36px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-gradient-to-r from-ref-sun/95 via-ref-coral/90 to-ref-sun/95 px-3 py-1.5 text-small font-semibold text-[#0c0a09] shadow-warm-up transition hover:brightness-110 motion-sub motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-55";

/** 列表行内次操作（文本链 · 与白表主 pill 配对 · batch57） */
export const ADMIN_TABLE_SECONDARY_ACTION_BTN_CLASS =
  "inline-flex min-h-[36px] items-center px-1 text-small font-medium text-travel-700 underline-offset-2 hover:text-travel-900 hover:underline motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-55";

/** 列表行操作列布局（主 pill + 次链 · 横排） */
export const ADMIN_TABLE_ROW_ACTIONS_CLASS =
  "flex flex-wrap items-center gap-x-3 gap-y-1.5";

export function adminTableRowPrimaryActionClass(): string {
  return `${touchTargetLink44Classes} ${ADMIN_TABLE_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`;
}

export function adminTableRowSecondaryActionClass(): string {
  return `${touchTargetLink44Classes} ${ADMIN_TABLE_SECONDARY_ACTION_BTN_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`;
}

/** 子页 header / 面包屑旁内联跳转（U8 ink · U9） */
export function adminPageNavLinkClass(): string {
  return `${touchTargetLink44Classes} font-medium underline-offset-2 ${ADMIN_INLINE_LINK_CLASS} ${ADMIN_MOTION_COLOR_TRANSITION_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`;
}

/** 子页 KPI 磁贴 link（外框 + 暖金 hover · 须内层 `ADMIN_HUB_LINK_CARD_INNER_CLASS`） */
export function adminHubKpiLinkClass(): string {
  return `${touchTargetLink44Classes} !flex-col !items-stretch overflow-hidden ${ADMIN_HUB_KPI_LINK_FRAME_CLASS} text-ink-800 transition motion-reduce:transition-none hover:border-ref-sun/40 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`;
}

/** 枢纽入口磁贴 link（config / onboarding 等） */
export function adminHubEntryLinkClass(): string {
  return `${touchTargetLink44Classes} !flex-col !items-stretch !justify-start overflow-hidden ${ADMIN_HUB_LINK_CARD_FRAME_CLASS} text-ink-800 transition motion-reduce:transition-none hover:border-ref-sun/40 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`;
}

/** Admin 错误边界主按钮 */
export const adminErrorRetryBtnClass = TT_MARKETING_ERROR_RETRY_BTN;

/** Admin 错误边界次按钮（回首页等） */
export const adminErrorSecondaryBtnClass = TT_MARKETING_BTN_SECONDARY_CONSOLE;
