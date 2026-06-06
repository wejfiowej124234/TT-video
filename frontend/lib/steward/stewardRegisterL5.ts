import { AUTH_L5_VISUAL_DATA_ATTR, TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL_GUIDE } from "@/lib/auth/authL5Shell";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export const TT_STEWARD_REGISTER_L5 = {
  pageShell: TT_AUTH_L5_PAGE_SHELL_GUIDE,
  pageColumn: `${TT_AUTH_L5_PAGE_COLUMN} max-w-lg`,
  headerBlock: "flex flex-col gap-2 pb-4",
  eyebrow: "text-[11px] font-semibold tracking-[0.12em] text-ref-sun/70",
  title: TT_AUTH_L5_FORM.titleLogin,
  intro: TT_AUTH_L5_FORM.bodyText,
  formSection: TT_AUTH_L5_FORM.formSection,
  stakeCallout: TT_AUTH_L5_FORM.callout,
  hubKicker: "mb-2 text-left text-[11px] font-semibold tracking-[0.14em] text-slate-500",
  jurisdictionChip:
    "inline-flex min-h-[44px] cursor-pointer select-none items-center rounded-xl border-2 px-3 py-2 text-small font-medium transition-[border-color,background-color,color,box-shadow] duration-200 motion-reduce:transition-none",
  jurisdictionChipUnselected:
    "border-slate-600/60 bg-[#14100d]/75 text-slate-400 hover:border-slate-500/80 hover:bg-[#1a1510]/90 hover:text-slate-200",
  jurisdictionChipSelected:
    "border-ref-sun bg-ref-sun/25 font-semibold text-ref-sun shadow-[0_0_18px_rgba(252,164,124,0.4)] ring-2 ring-ref-sun/55",
  jurisdictionEmptyHint:
    "rounded-xl border border-dashed border-ref-sun/22 bg-ref-sun/[0.04] px-3 py-3 text-meta text-slate-400",
  walletStepShell:
    "rounded-xl border border-ref-sun/12 bg-[#14100d]/35 p-3 sm:p-4",
  primaryCtaMuted:
    "inline-flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-600/55 bg-[#14100d]/70 px-4 py-3.5 text-small font-medium text-slate-500 shadow-none",
  ctaBlockedHint: "mb-2 text-center text-meta text-ref-sun/80",
  footerLinks: "mt-6 flex flex-wrap gap-x-4 gap-y-2",
  footerLink: TT_AUTH_L5_FORM.footerLinks,
  statusCardWrap: "w-full max-w-lg",
  pendingStatusBadge:
    "inline-flex min-h-[28px] items-center rounded-full border border-ref-sun/40 bg-ref-sun/12 px-3 text-[11px] font-semibold tracking-wide text-ref-sun shadow-[0_0_12px_rgba(252,164,124,0.14)]",
  pendingActions: "mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
} as const;

/** 用户向质押摘要：百分比 + TTG 数量（不暴露 bps） */
export function formatStewardCumulativeStakeDisplay(bps: number, ttgUnits: number, locale?: string): string {
  const pct = bps / 100;
  const percent =
    Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1).replace(/\.0$/, "")}%`;
  const ttg = ttgUnits.toLocaleString(locale);
  return `${percent} · ${ttg} TTG`;
}

/** 未选辖区时的累计质押占位（用户向 0 态） */
export function formatStewardEmptyStakePreview(): string {
  return formatStewardCumulativeStakeDisplay(0, 0);
}

export function stewardRegisterL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-steward-register-page": "1",
    "data-tt-steward-register-l5": "1",
    "data-tt-steward-register-ui-frozen": "1",
    "data-tt-auth-visual": AUTH_L5_VISUAL_DATA_ATTR,
    "data-tt-auth-route": "steward-register",
  };
}
