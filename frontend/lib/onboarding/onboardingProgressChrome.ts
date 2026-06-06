import { guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";

/** Auth L5 · 入驻/申请进度条共享 chrome（steward · provider · guide 同族） */
export const TT_AUTH_ONBOARDING_PROGRESS = {
  shell: "rounded-[var(--radius-sm)] border border-ref-sun/15 bg-[#14100d]/40 p-3 backdrop-blur-[2px]",
  headingRow: "mb-2 flex min-h-[44px] items-center justify-between gap-3",
  headingTitle: "min-w-0 text-[11px] font-semibold tracking-[0.14em] text-slate-400",
  toggleBtn: `inline-flex min-h-[44px] shrink-0 items-center px-1 text-meta font-medium text-ref-sun/85 hover:text-ref-sun ${guideRegFocusRing}`,
} as const;
