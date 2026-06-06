import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE,
} from "@/lib/marketingUi";
import {
  TT_ESCROW_PROTOCOL_PANEL_PADDED,
  escrowProtocolCompactInputClass,
  escrowProtocolCompactSelectClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolPillFocusClass,
  escrowProtocolSubheadingClass,
} from "@/lib/escrowProtocolUi";

export function reviewBlockPillFocusClass(isDid: boolean) {
  return isDid ? escrowProtocolPillFocusClass : `${TT_MARKETING_FOCUS_RING_CONSOLE}`;
}

export function reviewBlockShellClass(isDid: boolean) {
  return isDid
    ? `${TT_ESCROW_PROTOCOL_PANEL_PADDED} space-y-3`
    : "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft space-y-3";
}

export function reviewBlockHClass(isDid: boolean) {
  return isDid ? escrowProtocolSubheadingClass : "text-body font-semibold text-ink-800";
}

export function reviewBlockLoadingClass(isDid: boolean) {
  return isDid ? `text-small ${escrowProtocolMetaClass}` : "text-small text-ink-500";
}

export function reviewBlockErrClass(isDid: boolean) {
  return isDid ? "text-small text-warning/95" : "text-small text-warning dark:text-warning/90";
}

export function reviewBlockRetryClass(isDid: boolean) {
  return isDid
    ? `${touchTargetLink44Classes} text-small ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} text-small ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
}

export function reviewBlockListMetaSummaryClass(isDid: boolean) {
  return isDid
    ? `${touchTargetLink44Classes} cursor-pointer select-none ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} cursor-pointer select-none ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
}

export function reviewBlockBreakdownSummaryClass(isDid: boolean) {
  return isDid
    ? `${touchTargetLink44Classes} cursor-pointer font-medium ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} cursor-pointer font-medium ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
}

export function reviewBlockUlClass(isDid: boolean) {
  return isDid ? `space-y-1 text-small ${escrowProtocolMetaClass}` : "space-y-1 text-small text-ink-700";
}

export function reviewBlockEmptyLiClass(isDid: boolean) {
  return isDid ? escrowProtocolMetaClass : "text-ink-500";
}

export function reviewBlockGroupBorderClass(isDid: boolean) {
  return isDid ? "border-t border-ref-sun/14" : "border-t border-ink-200";
}

export function reviewBlockLabelClass(isDid: boolean) {
  return isDid ? `block text-meta ${escrowProtocolMetaClass}` : "block text-meta text-ink-500";
}

export function reviewBlockSelectClass(isDid: boolean) {
  return isDid
    ? escrowProtocolCompactSelectClass
    : `inline-flex min-h-[44px] items-center justify-start border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-bg-console text-ink-800 ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`;
}

export function reviewBlockInputClass(isDid: boolean) {
  return isDid
    ? `block w-full ${escrowProtocolCompactInputClass}`
    : `block w-full border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-bg-console text-ink-800 placeholder:text-ink-500 ${TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE}`;
}

export function reviewBlockLowHintClass(isDid: boolean) {
  return isDid ? `text-meta ${escrowProtocolMetaClass}` : "text-meta text-ink-600";
}

export function reviewBlockMetaDetailsClass(isDid: boolean) {
  return isDid ? `text-meta ${escrowProtocolMetaClass} mt-2` : "text-meta text-ink-600 mt-2";
}

export function reviewBlockSubmitBreakdownShellClass(isDid: boolean) {
  return isDid
    ? "rounded-[var(--radius-md)] border border-ref-sun/15 bg-black/20 px-3 py-2 text-small text-slate-300"
    : "rounded-[var(--radius-md)] border border-ink-200 bg-bg-soft px-3 py-2 text-small text-ink-700";
}
