/**
 * 商家橱窗 / 旅行收购 / BookGuide 等市场弹层共用：**portal 根、遮罩、玻璃面板**（与社区柱式抽屉分列）。
 * 全站「统一 dialog 视觉 tokens」优先在本文件扩展，避免各组件手写 `z-*` / `backdrop-*` 漂移（大壳 ADR 另立项）。
 * 封面/宣传片体限真值：`@/lib/marketStudioMediaLimits`（与 i18n「≤32MB」同读）。
 * 结构壳（portal + scrim + panel 点击分层）：`MarketGlassModalFrame`（如 `BookGuideModal`、`InviteGuideModal`、`CustomItineraryModal`、**橱窗/收购 Studio**、个人中心 `CommunityMeNotesGlassDrawer`）。
 */
import { TT_MARKETING_MARKET_DARK_PATH, TT_MARKETING_MARKET_GLASS_FOCUS_WITHIN } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;

export const marketStudioModalPortalRootClass =
  "fixed inset-0 z-[400] flex items-center justify-center p-4 pt-20 pb-8 sm:pt-16 overflow-y-auto";

/**
 * 未保存丢弃确认：与 Studio 主壳同为 body 级 portal 兄弟时，须 **高于** `z-[400]`，
 * 否则 Confirm 会被橱窗/收购/行程玻璃壳遮住（HU-007-B / Staging Reality #3）。
 */
export const marketStudioDiscardConfirmPortalRootClass =
  "fixed inset-0 z-[410] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm";

export const marketStudioModalScrimClass = "absolute inset-0 bg-black/40 backdrop-blur-sm";

export const marketStudioModalPanelClass = D.studioModalPanelLg;

/** Escrow / 链上签名确认：与历史 z-50 对齐；遮罩与面板分层（无顶栏 pt-20） */
export const escrowModalPortalRootClass =
  "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto";

export const escrowModalScrimClass = "absolute inset-0 bg-black/50";

/**
 * 嵌在 z-[400] 类市场玻璃弹窗内的全屏预览（行程 Detail、向导封面大图等）：
 * z 须高于面板内一般控件，且仍在宿主 stacking context 内。
 */
export const itinNestedImagePreviewPortalRootClass =
  "fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto";

export const itinNestedImagePreviewScrimClass =
  "absolute inset-0 bg-black/60 backdrop-blur-sm";

/** DidRank 页级弹窗：高于站内常规层，与历史 z-[100] 一致 */
export const didRankModalPortalRootClass =
  "fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto";

export const didRankModalScrimClass =
  "absolute inset-0 bg-ink-950/80 backdrop-blur-sm";

/** Admin 内联对话框遮罩：同 z-50，略淡于 escrow */
export const adminModalScrimClass = "absolute inset-0 bg-black/40";

/** Admin 移动端底对齐、宽屏居中（审核处置等） */
export const adminModalPortalRootSheetClass =
  "fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center overflow-y-auto";

/** 社区反馈发帖弹层（压过 z-[100] 级 UI） */
export const communityFeedbackModalPortalRootClass =
  "fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto";

export const communityFeedbackModalScrimClass =
  "absolute inset-0 bg-black/60 backdrop-blur-sm";

/**
 * 社区发布抽屉：与顶栏（`top-16`）+ 底部 FAB 留白对齐，z 与反馈弹层同为 `[200]`。
 * 入场动画的 opacity 由宿主拼接 `opacity-0` / `opacity-100`。
 */
export const communityPublishDrawerPortalRootBaseClass =
  "fixed top-16 left-0 right-0 bottom-0 z-[200] flex items-center justify-center p-4 overflow-auto transition-opacity duration-200 ease-out motion-reduce:opacity-100";

/** 移动端为底部发布钮预留 `bottom-20`；`md` 与顶栏第二行对齐 */
export const communityPublishDrawerScrimClass =
  "absolute inset-0 top-0 bottom-20 bg-ink-950/85 backdrop-blur-sm md:bottom-0 md:top-12";

/** 社区全屏柱式抽屉根（评论 / 帖详情）：仅布局与层级 */
export const communityColumnDrawerPortalRootClass =
  "fixed inset-0 z-50 flex flex-col overflow-hidden";

export const communityColumnDrawerScrim95Class =
  "absolute inset-0 bg-ink-950/95 backdrop-blur-sm";

export const communityColumnDrawerScrim98Class =
  "absolute inset-0 bg-ink-950/98 backdrop-blur-sm";

/** 举报抽屉：高于主导航等 z-50 */
export const communityReportDrawerPortalRootClass =
  "fixed inset-0 z-[100] flex flex-col overflow-hidden";

/** 柱式抽屉内层（叠在遮罩之上，供焦点 trap / 滚动分区） */
export const communityColumnDrawerContentShellClass =
  "relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden";

/** 社区「去登录发布」居中弹层 */
export const communityLoginModalPortalRootClass =
  "fixed inset-0 z-50 flex flex-col items-center justify-center p-4 safe-area-inset-t safe-area-inset-b";

export const communityLoginModalScrimClass =
  "absolute inset-0 bg-ink-950/90 backdrop-blur-sm";

/** ME 快捷链接全屏点击关闭层 */
export const communityMeQuickLinksScrimClass =
  "fixed inset-0 z-[110] bg-black/55 motion-sub";

/** 社区竖屏视频全屏层（须高于 L0 顶栏 z-[300] · 沉浸式盖住全站 chrome） */
export const communityVideoOverlayPortalRootClass =
  "fixed inset-0 z-[320] flex flex-col overflow-hidden text-white safe-area-inset-b";

export const communityVideoOverlayScrimClass = "absolute inset-0 bg-black";

/** Landing hero：日期区间选择器视觉暗层（不拦截点击；关闭靠 document 外点 + Escape，避免挡住 Hero CTA / 页脚链接） */
export const landingHeroCalendarDismissScrimClass =
  "pointer-events-none fixed inset-0 z-[100] bg-black/25 motion-reduce:bg-transparent";

/** Landing hero：日期选择器内联弹出面板（相对触发器定位） */
export const landingHeroCalendarPopoverPanelClass =
  "absolute left-0 top-full z-[110] mt-1 min-w-[280px] rounded-[var(--radius-xl)] border border-white/30 bg-ink-900 px-4 pb-6 pt-4 shadow-strong";

/** 玻璃创作台顶栏（含关闭）：`InviteGuideModal` / 两子站 Studio / 与 `BookGuideModal` 同 `px-6 py-3` 水平刻度（96-16 D9）。 */
export const marketStudioModalChromeHeaderRow = `${D.studioModalHeader} px-6 py-3`;

/** 自定义行程等仅标题+说明、无顶栏关闭时的顶栏块。 */
export const marketStudioModalChromeHeaderTitleOnly = `${D.studioModalHeader} px-6 py-3 bg-transparent`;

/** 玻璃弹窗主滚动区内边距（`space-y-*` 由调用方追加）。 */
export const marketStudioModalChromeBodyScroll = "p-6 overflow-y-auto bg-transparent";

/** Console 面板顶栏：`InviteGuideModal` 等与 `marketStudioModalChromeHeaderRow` 同 **px-6 py-3**，边框用 ink（96-16 D9）。 */
export const marketStudioModalConsoleHeaderRow =
  "shrink-0 flex items-start justify-between gap-3 border-b border-ink-200/80 px-6 py-3";

/** Console 面板主滚动区（与 `marketStudioModalChromeBodyScroll` 同 p-6 纵向起点）。 */
export const marketStudioModalConsoleBodyScroll =
  "min-h-0 flex-1 overflow-y-auto bg-transparent p-6";

/** Console 面板底栏（与正文区 `p-6` 水平对齐）。 */
export const marketStudioModalConsoleFooterRow =
  "shrink-0 border-t border-ink-200 px-6 py-4";

/** 琥珀 / 通用玻璃语境分节 `h3`。 */
export const marketStudioModalSectionHeadingLight = D.studioSectionHeading;

/** 商家橱窗分节 `h3`（与收购/琥珀同族暖金）。 */
export const marketStudioModalSectionHeadingCyan = D.studioSectionHeading;

/**
 * 自定义行程等玻璃弹窗内「选图 / 上传」触发 `label`（触控 **≥44px**；与主表单 **`inputClass` `px-4 py-2.5`** 刻度对齐，96-16 D9）。
 */
export const marketStudioModalGlassFileTriggerLabelInline = `inline-flex min-h-[44px] cursor-pointer items-center justify-start ${D.studioMediaBtn} px-4 py-2.5 ${TT_MARKETING_MARKET_GLASS_FOCUS_WITHIN}`;
