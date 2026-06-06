/** `/me/onboarding` Console L5 · 与 `accountUi` / `TT_MARKETING_ACCOUNT_*` 同族 */

import { TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT } from "@/lib/marketingUi";

export const TT_ME_ONBOARDING_L5 = {
  pageAttrs: {
    "data-tt-me-onboarding-page": "1",
    "data-tt-me-onboarding-console-l5": "1",
    "data-tt-me-onboarding-ui-frozen": "1",
    "data-tt-marketing-account-shell": "1",
  },
  sectionCard:
    "rounded-[var(--radius-sm)] border border-ink-200/75 bg-gradient-to-br from-[#faf8f6] via-bg-console to-[#f3ece4] p-6 shadow-soft",
  progressShell:
    "rounded-[var(--radius-sm)] border border-ink-200/90 bg-gradient-to-br from-[#faf8f6] via-white to-[#f5f0ea] p-3 shadow-soft",
  progressHeading: "text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500",
  progressStepDone:
    "bg-ref-sun/90 text-[#1a120c]",
  progressStepActive:
    "border border-ref-sun/70 bg-ref-sun/10 text-travel-900",
  progressStepPending:
    "border border-ink-200 text-ink-400",
  progressToggle: "text-meta text-travel-800 hover:text-travel-950",
  writeStage:
    "mt-4 rounded-[var(--radius-sm)] border border-ink-100 bg-gradient-to-br from-ink-50/80 via-white to-[#faf8f6] p-4",
  writeStageActive:
    "border-ref-sun/45 bg-gradient-to-br from-ref-sun/12 via-white to-[#faf8f6] shadow-[inset_0_0_0_1px_rgba(252,164,124,0.35)]",
  gatePrimaryCta: `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} inline-flex min-h-[44px] w-full items-center justify-center no-underline sm:w-auto`,
  gateDeferLink:
    "inline-flex min-h-[44px] items-center text-small font-semibold text-travel-800 underline decoration-travel-300/80 underline-offset-4 hover:text-travel-950",
  twoColSection: "h-full flex flex-col",
  writeStageDone: "border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-[#faf8f6]",
  writeStagesRail: "mt-4 flex items-stretch gap-3",
  writeStagesContent: "flex min-w-0 flex-1 flex-col gap-3",
  writeStageHeader: "flex items-start gap-3",
  writeStageTitle: "text-small font-semibold text-ink-900",
  writeStageHint: "mt-1 text-meta leading-relaxed text-ink-600",
  rolePillSelected:
    "border-ref-sun/55 bg-gradient-to-br from-ref-sun/20 via-ref-sun/10 to-white text-travel-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-ref-sun/30",
  rolePillIdle:
    "border-ink-200/90 bg-white/80 text-ink-700 hover:border-ref-sun/35 hover:bg-ref-sun/[0.04]",
  stripePanel:
    "mt-3 rounded-[var(--radius-sm)] border border-ref-sun/20 bg-white p-4 shadow-soft",
  actionStack: "mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
  actionPrimaryBlock: `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} w-full sm:w-auto`,
  nextStepCta:
    "mt-3 inline-flex min-h-[44px] items-center text-small font-semibold text-travel-800 underline decoration-travel-300/80 underline-offset-4 hover:text-travel-950 hover:decoration-ref-sun/60",
  summaryGrid: "mt-4 grid gap-3 sm:grid-cols-2",
  summaryRow:
    "rounded-[var(--radius-sm)] border border-ink-100/90 bg-white/70 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
  summaryLabel: "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500",
  summaryValue: "mt-1.5 text-small font-semibold leading-snug text-ink-900 break-words",
  summaryMeta: "mt-1 text-[11px] font-normal leading-relaxed text-ink-500 break-words",
  quotePackageEyebrow: "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500",
  statusPillBase: "inline-flex min-h-[28px] items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide",
  statusPillPaid: "bg-emerald-100 text-emerald-800",
  statusPillPending: "bg-amber-100 text-amber-900",
  statusPillNeutral: "bg-ink-100 text-ink-700",
  emptyState:
    "mt-4 rounded-[var(--radius-sm)] border border-ink-100 bg-gradient-to-br from-ink-50/90 via-white to-[#faf8f6] px-4 py-6 text-center shadow-soft",
  emptyStateActions: "mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center",
  journeyBridge:
    "mt-3 rounded-[var(--radius-sm)] border border-ref-sun/25 bg-gradient-to-r from-ref-sun/8 via-white to-ref-sun/5 px-3.5 py-3 text-small text-ink-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  entitlementsSyncingShell:
    "mt-4 rounded-[var(--radius-sm)] border border-ref-sun/20 bg-gradient-to-br from-ref-sun/6 via-white to-[#faf8f6] px-4 py-6 text-center shadow-soft",
  confirmBlockedCallout:
    "mt-3 rounded-[var(--radius-sm)] border border-amber-200/90 bg-amber-50/80 px-3.5 py-2.5 text-meta leading-relaxed text-amber-950",
  actionPrimaryLocked: `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} w-full sm:w-auto opacity-50 cursor-not-allowed saturate-[0.85] shadow-none hover:brightness-100`,
  confirmLockedBadge:
    "mr-2 inline-flex min-h-[22px] items-center rounded-full border border-ink-200/90 bg-ink-50 px-2 text-[10px] font-semibold uppercase tracking-wide text-ink-600",
  nextStepShell:
    "rounded-[var(--radius-sm)] border border-travel-200/80 bg-gradient-to-r from-ref-sun/8 via-white to-travel-50/80 px-4 py-3 shadow-soft",
  nextStepEyebrow: "text-[11px] font-semibold uppercase tracking-[0.12em] text-travel-700",
  nextStepTitle: "mt-1 text-small font-semibold text-ink-900",
  amountHero:
    "mt-4 rounded-[var(--radius-sm)] border border-ref-sun/30 bg-gradient-to-br from-ref-sun/10 via-white to-[#faf8f6] px-4 py-4 text-center shadow-soft",
  amountHeroDemo:
    "mt-4 rounded-[var(--radius-sm)] border border-ink-200/70 bg-gradient-to-br from-ink-50/90 via-white to-[#faf8f6] px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  amountHeroValue: "text-h3 font-semibold tracking-tight text-ink-900",
  amountHeroValueDemo: "text-h3 font-semibold tracking-tight text-ink-500",
  nextStepShellIntegrated:
    "rounded-[var(--radius-sm)] border border-ref-sun/30 bg-gradient-to-br from-ref-sun/10 via-white to-travel-50/80 px-4 py-3 shadow-soft",
  amountHeroBadge:
    "mt-2 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900",
  technicalDetails:
    "mt-3 rounded-[var(--radius-sm)] border border-ink-100 bg-ink-50/40 text-meta text-ink-600",
  donePanel:
    "mt-4 rounded-[var(--radius-sm)] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-[#f8faf8] px-4 py-4 shadow-soft",
  donePanelTitle: "text-small font-semibold text-emerald-900",
  donePanelPrimaryCta: `${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} no-underline`,
  donePanelSecondaryCta:
    "inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-200 bg-white px-4 text-small font-semibold text-ink-800 hover:bg-ink-50",
  footerBackLink:
    "inline-flex min-h-[44px] items-center text-small font-semibold text-travel-800 hover:text-travel-950",
  sessionProbeBanner:
    "rounded-[var(--radius-sm)] border border-ink-200/90 bg-white/80 px-3 py-2 text-meta text-ink-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  sessionContextBanner:
    "rounded-[var(--radius-sm)] border border-ref-sun/30 bg-gradient-to-r from-ref-sun/10 via-white to-[#faf8f6] px-4 py-3 shadow-soft",
  gateLockedShell:
    "mt-4 flex flex-1 flex-col items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-ink-200/90 bg-gradient-to-br from-ink-50/60 via-white to-[#faf8f6] px-4 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  pageSectionStack: "mx-auto max-w-3xl space-y-6",
} as const;
