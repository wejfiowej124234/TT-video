import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** `/disputes` 设置族延伸 · 与 MeSettings L5 同壳（①） */
export const DISPUTES_L5_ROUTE_MARKER_LIST = "disputes-list" as const;
export const DISPUTES_L5_ROUTE_MARKER_DETAIL = "disputes-detail" as const;

export const TT_DISPUTES_L5 = {
  listCard:
    "auth-l5-glass-surface rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 p-4 backdrop-blur-2xl",
  listTitle: "text-small font-semibold text-slate-100",
  listMeta: "text-meta text-slate-400/95",
  listLink: `${touchTargetLink44Classes} text-small font-medium text-ref-sun/85 underline-offset-2 hover:text-[#fde9a8] hover:underline transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`,
  arbitratorBanner:
    "rounded-xl border border-ref-sun/28 bg-ref-sun/[0.06] px-4 py-3 text-meta leading-relaxed text-slate-300/95",
  footerLinks: "flex flex-wrap items-center gap-x-3 gap-y-2 text-meta text-slate-400/95",
  footerLink: `${touchTargetLink44Classes} text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`,
  detailSection: `${TT_ME_SETTINGS_L5.sectionCard} p-5 space-y-3`,
  detailHeading: "text-h4 font-semibold text-slate-100",
  detailBody: "text-body text-slate-300/95",
  detailMeta: "text-meta text-slate-400/95",
  sectionHeading: "text-body font-semibold text-slate-100 mb-3",
  sectionBody: "text-small text-slate-300/95",
  sectionMeta: "text-meta text-slate-400/95",
  sectionList: "space-y-2 text-small text-slate-300/95",
  input:
    "min-h-[44px] w-full max-w-full rounded-md border border-ref-sun/28 bg-[#0c0a09]/80 px-3 py-1.5 text-small font-mono text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  btnSecondary:
    "min-h-[44px] rounded-md border border-ref-sun/30 bg-ref-sun/[0.08] px-3 py-1.5 text-small font-medium text-ref-sun/90 hover:bg-ref-sun/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  btnPrimary:
    "min-h-[44px] rounded-md border border-ref-sun/40 bg-ref-sun/20 px-3 py-1.5 text-small font-semibold text-slate-100 hover:bg-ref-sun/30 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  calloutMuted: "rounded-xl border border-ref-sun/22 bg-ref-sun/[0.05] p-5",
  calloutWarning: "rounded-xl border border-warning/30 bg-warning/10 p-5",
  divider: "border-t border-ref-sun/14 pt-3",
} as const;
