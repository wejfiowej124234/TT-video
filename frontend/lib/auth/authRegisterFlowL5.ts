import { guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** Auth L5 · 身份申请流（steward / provider register）共享令牌 */
export const TT_AUTH_REGISTER_FLOW_L5 = {
  hubKicker: "mb-2 text-center text-[11px] font-semibold tracking-[0.14em] text-slate-500",
  backToHub: `${touchTargetLink44Classes} mb-3 inline-flex text-small font-medium text-slate-400 hover:text-ref-sun ${guideRegFocusRing}`,
  pendingStatusSection: "space-y-2.5 border-t border-ref-sun/10 pt-5",
  pendingHintStack: "space-y-2 text-meta leading-relaxed text-slate-400",
  pendingActions: "mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
  pendingCrossNav: "mt-8 w-full border-t border-ref-sun/10 pt-7",
} as const;
