/**
 * `/auth/*` L5 暗壳共享：登录 / 注册等同族底与页壳（非五主路由 · ① 本地）。
 * 登录卡面 token 见 `loginL5.ts`。
 */

export const TT_AUTH_L5_PAGE_SHELL =
  "relative isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0a0a] text-slate-300 flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6 sm:py-14 motion-safe:transition-opacity duration-500";

/** 向导注册等长表单：顶对齐 + 更大底边距 */
export const TT_AUTH_L5_PAGE_SHELL_GUIDE =
  "relative isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0a0a] text-slate-300 flex flex-col items-center gap-8 px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 motion-safe:transition-opacity duration-500";

export const TT_AUTH_L5_PAGE_COLUMN = "relative z-10 flex w-full max-w-[26rem] flex-col items-stretch gap-8";

export const TT_AUTH_L5_CROSS_NAV_SHELL = "w-full border-t border-ref-sun/18 pt-7";

export const TT_AUTH_L5_CROSS_NAV_LABEL =
  "mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ref-sun/55";

/** 机读：auth 暗壳 L5 与登录页同标记 */
export const AUTH_L5_VISUAL_DATA_ATTR = "l5" as const;
