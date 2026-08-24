/**

 * Auth L5 顶栏 utility 下拉共享壳（用户 / 语言 / 钱包 · ①）。

 * 机读：`headerUtilityMenuL5.contract.test.ts`

 */

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";



/** 顶栏下拉专用 · 勿叠 `[data-tt-auth-visual=l5]` 大卡 inset 阴影（易出穿项横线） */

const DROPDOWN_GLASS =

  "auth-l5-glass-surface header-utility-dropdown-panel isolate overflow-hidden rounded-xl border border-ref-sun/45 bg-[#0c0a09]/96 backdrop-blur-2xl";



const DROPDOWN_POS =

  "absolute left-auto right-0 top-full z-[320] mt-2 box-border flex flex-col outline-none";



export const TT_HEADER_UTILITY_MENU_L5 = {

  dropdown: `${DROPDOWN_GLASS} ${DROPDOWN_POS}`,

  dropdownNarrow: "w-[10.5rem] min-w-[10.5rem] py-1.5",

  dropdownWide: "w-[16rem] min-w-[16rem] py-2",

  dropdownSheen:

    "pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-ref-sun/60 to-transparent",

  dropdownBody: "relative z-[1] flex min-w-0 flex-col overflow-hidden",

  sectionMeta: "px-2 py-1 text-meta font-semibold uppercase tracking-wide text-ref-sun/55",

  item:

    "box-border flex min-h-[44px] w-full min-w-0 max-w-full items-center rounded-lg px-2.5 py-2 text-left text-small leading-snug text-slate-200/95 transition-colors duration-150 motion-reduce:transition-none hover:bg-ref-sun/10 hover:text-[#fde9a8] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40",

  itemWithIcon:

    "box-border flex min-h-[44px] w-full min-w-0 max-w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-small leading-snug text-slate-200/95 transition-colors duration-150 motion-reduce:transition-none hover:bg-ref-sun/10 hover:text-[#fde9a8] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40",

  itemActive: "bg-ref-sun/12 font-semibold text-[#fde9a8]",

  itemLabel: "min-w-0 flex-1 truncate leading-snug",

  itemSelected: "font-semibold text-ref-sun",

  divider: "my-1 h-px w-full shrink-0 border-0 bg-ref-sun/16",

  buttonOpen:

    "ring-2 ring-ref-sun/55 !border-ref-sun/55 bg-ref-sun/14 shadow-[0_0_0_1px_rgba(252,164,124,0.28),0_8px_28px_-12px_rgba(252,164,124,0.38)]",

  field: TT_AUTH_L5_FORM.field,

  fieldError: "px-3 text-meta text-ref-coral/95",

  inlinePrimaryBtn: TT_AUTH_L5_FORM.secondaryButton,

  inlineGhostBtn:

    "inline-flex min-h-[36px] items-center rounded-lg px-2.5 py-1 text-small text-slate-300/95 hover:bg-ref-sun/8 hover:text-ref-sun",

} as const;



export function headerUtilityMenuL5ShellClass(width: "narrow" | "wide"): string {

  return `${TT_HEADER_UTILITY_MENU_L5.dropdown} ${

    width === "wide" ? TT_HEADER_UTILITY_MENU_L5.dropdownWide : TT_HEADER_UTILITY_MENU_L5.dropdownNarrow

  }`;

}


