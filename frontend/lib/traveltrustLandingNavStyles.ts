import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

/** 页内粘性 nav 对比度 token（TT-PH1-162 · ①） */
export const TT_LANDING_NAV_SHELL_CLASS =
  `sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] ${ttZClass(TT_Z.NAV)} -mx-4 mb-1 border-b border-ref-sun/20 bg-[#0a0908] px-4 py-2 shadow-[0_12px_36px_-8px_rgba(252,164,124,0.12),0_12px_36px_rgba(0,0,0,0.68)] backdrop-blur-xl sm:-mx-6 sm:top-14 sm:px-6`;

export const TT_LANDING_NAV_LINK_BASE =
  "inline-flex max-w-[9.5rem] min-h-[40px] items-center truncate rounded-lg px-3 py-1.5 text-meta font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 sm:max-w-[11rem]";

export const TT_LANDING_NAV_LINK_ACTIVE =
  "bg-ref-sun/14 text-white ring-1 ring-ref-sun/40 shadow-[0_0_0_1px_rgba(252,164,124,0.14)]";

export const TT_LANDING_NAV_LINK_IDLE =
  "text-slate-50 hover:bg-white/16 hover:text-white";

const TT_LANDING_NAV_MORE_MENU_BASE =
  "absolute right-0 z-[45] min-w-[11rem] max-h-[min(16rem,50vh)] overflow-y-auto rounded-xl border border-ref-sun/18 bg-[#0a0908]/99 py-1 shadow-[0_14px_44px_-8px_rgba(252,164,124,0.15),0_14px_44px_rgba(0,0,0,0.62)] backdrop-blur-xl";

/** 独立粘性 nav：向下展开 */
export const TT_LANDING_NAV_MORE_MENU_BELOW_CLASS = `${TT_LANDING_NAV_MORE_MENU_BASE} top-full mt-1`;

/** 并入 landing chrome：向上展开，避免挡住首屏文案卡（TT-PH1-155） */
export const TT_LANDING_NAV_MORE_MENU_ABOVE_CLASS = `${TT_LANDING_NAV_MORE_MENU_BASE} bottom-full mb-1 top-auto`;

/** 首屏 compact 时「全部章节」入口（TT-PH1-155 · 融资演示可发现性） */
export const TT_LANDING_NAV_MORE_TRIGGER_COMPACT_CLASS =
  "ring-1 ring-ref-sun/35 bg-ref-sun/10 text-white";
