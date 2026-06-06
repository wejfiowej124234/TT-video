import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";

export type UnifiedItineraryListChrome = {
  sectionHead: string;
  dayTitle: string;
  body: string;
  metaMed: string;
  metaDim: string;
  label: string;
  strong: string;
  link: string;
  expandBtn: string;
  expandAll: string;
  attrCard: string;
  imgWrap: string;
  thumbGrid: string;
  quoteHeading: string;
  quoteList: string;
  quoteTotal: string;
  priceMeta: string;
};

export function getUnifiedItineraryListChrome(variant: "travel" | "trust" | "did"): UnifiedItineraryListChrome {
  const isTrust = variant === "trust";
  const isDid = variant === "did";
  return {
    sectionHead: isDid ? "text-small font-semibold text-slate-200" : "text-small font-semibold text-ink-800",
    dayTitle: isDid ? "text-small font-semibold text-slate-100" : "text-small font-semibold text-ink-800",
    body: isDid ? "text-small text-slate-300" : "text-small text-ink-700",
    metaMed: isDid ? "text-meta text-slate-300" : "text-meta text-ink-600",
    metaDim: isDid ? "text-meta text-slate-400" : "text-meta text-ink-500",
    label: isDid ? "text-meta font-medium text-slate-300" : "text-meta font-medium text-ink-700",
    strong: isDid ? "font-medium text-slate-100" : "font-medium text-ink-800",
    link: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline motion-sub rounded-[var(--radius-sm)] px-1 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`,
    expandBtn: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 rounded-[var(--radius-sm)] px-1.5 py-0.5 shrink-0 transition-colors duration-200 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS} px-1.5 py-0.5 shrink-0`,
    expandAll: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 hover:underline motion-sub rounded-[var(--radius-sm)] px-1 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta ${TT_MARKETING_CONSOLE_INLINE_LINK} motion-sub ${TT_MARKETING_CONSOLE_LINK_FOCUS}`,
    attrCard: isDid
      ? "flex gap-3 rounded-[var(--radius-sm)] border border-slate-600/50 bg-ink-950/50 p-2.5 text-small text-slate-300"
      : "flex gap-3 rounded-[var(--radius-sm)] border border-ink-200/80 bg-bg-soft/50 p-2.5 text-small text-ink-700",
    imgWrap: isDid
      ? "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-slate-600 bg-ink-900/50"
      : "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ink-200",
    thumbGrid: isDid
      ? "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-slate-600 bg-ink-900/50"
      : "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ink-200 bg-bg-soft",
    quoteHeading: isDid ? "text-small font-semibold text-cyan-200 mb-2" : "text-small font-semibold text-ink-800 mb-2",
    quoteList: isDid ? "text-meta text-slate-300 space-y-0.5" : "text-meta text-ink-600 space-y-0.5",
    quoteTotal: isDid
      ? "font-semibold text-slate-200 pt-1 border-t border-slate-600/50 mt-1"
      : "font-semibold text-ink-800 pt-1 border-t border-ink-200 mt-1",
    priceMeta: isDid ? "text-meta font-medium text-slate-300 shrink-0" : "text-meta font-medium text-ink-700 shrink-0",
  };
}

export function unifiedItineraryListCardClass(variant: "travel" | "trust" | "did"): string {
  const isTrust = variant === "trust";
  const isDid = variant === "did";
  if (isDid) return "rounded-[var(--radius-sm)] border border-cyan-500/25 bg-ink-900/60 backdrop-blur-sm p-4";
  if (isTrust) return "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-4";
  return "rounded-[var(--radius-md)] border border-white/25 bg-white/5 p-4";
}
