/**
 * `/governance/proposals*` · L5 暖金产品 Console（① · 与首页 `/` + `/orders` 同源）。
 * 机读：`governanceProposalsPage.contract.test.ts`
 */
import {
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_CALLOUT_LEFT_ACCENT,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_ORDERS_CALLOUT_PANEL,
  TT_MARKETING_ORDERS_DARK_GLASS_INNER,
  TT_MARKETING_ORDERS_DOT_GRID,
  TT_MARKETING_ORDERS_FILTER_BAR,
  TT_MARKETING_ORDERS_FILTER_TAB_IDLE,
  TT_MARKETING_ORDERS_FILTER_TAB_SELECTED,
  TT_MARKETING_ORDERS_FOOTER_CROSS_LINK,
  TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  TT_MARKETING_ORDERS_FOOTER_WRAP,
  TT_MARKETING_ORDERS_HERO_CTA,
  TT_MARKETING_ORDERS_LIST_CARD_FRAME,
  TT_MARKETING_ORDERS_LIST_CARD_INNER,
  TT_MARKETING_ORDERS_LIST_COUNT_BADGE,
  TT_MARKETING_ORDERS_PAGE_AMBIENT,
  TT_MARKETING_ORDERS_PAGE_HERO_FRAME,
  TT_MARKETING_ORDERS_PAGE_HERO_INNER,
  TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW,
  TT_MARKETING_ORDERS_PAGE_INNER,
  TT_MARKETING_ORDERS_PAGE_KICKER,
  TT_MARKETING_ORDERS_PAGE_SECTION_BRIDGE_LINE,
  TT_MARKETING_ORDERS_PAGE_SHELL,
  TT_MARKETING_ORDERS_PAGE_TITLE,
  TT_MARKETING_ORDERS_PAGE_VIGNETTE,
  TT_MARKETING_ORDERS_TEXT_BODY,
  TT_MARKETING_ORDERS_TEXT_META,
  TT_MARKETING_ORDERS_TEXT_MUTED,
  TT_MARKETING_ORDERS_TOOLBAR_INNER_FLAT,
  TT_MARKETING_ORDERS_TOOLBAR_SHELL,
  TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE,
  TT_MARKETING_WARM_L5_CARD_INNER_GLOW_CONSOLE,
} from "@/lib/marketingUi";
import { traveltrustProductL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export const GOV_PROPOSALS_L5_VISUAL_DATA_ATTR = "l5" as const;
export const GOV_PROPOSALS_L5_SSOT_ID = "TT-GOV-PROPOSALS-L5-2026-06" as const;

const FILTER_TAB_BASE =
  "inline-flex min-h-[40px] items-center justify-center rounded-[var(--radius-md)] px-3.5 py-1.5 text-small font-medium transition motion-reduce:transition-none motion-sub motion-safe:active:scale-[0.98] motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** 治理提案 · L5 token 表（深色 cinematic + 暖金玻璃 · 同源 `/orders`） */
export const GOV_PROPOSALS_L5 = {
  pageShell: `${TT_MARKETING_ORDERS_PAGE_SHELL} relative isolate overflow-x-clip`,
  pageVignette: TT_MARKETING_ORDERS_PAGE_VIGNETTE,
  pageInner: `${TT_MARKETING_ORDERS_PAGE_INNER} relative z-[1] pb-24 md:pb-0`,
  pageInnerNarrow: "relative z-[1] mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 pb-24 md:pb-0",
  ambient: TT_MARKETING_ORDERS_PAGE_AMBIENT,
  dotGrid: TT_MARKETING_ORDERS_DOT_GRID,
  page: "relative",
  pageHeaderWrap: "mb-3 space-y-3",
  heroFrame: TT_MARKETING_ORDERS_PAGE_HERO_FRAME,
  heroInner: TT_MARKETING_ORDERS_PAGE_HERO_INNER,
  heroInnerGlow: TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW,
  heroKicker: TT_MARKETING_ORDERS_PAGE_KICKER,
  heroTitle: TT_MARKETING_ORDERS_PAGE_TITLE,
  heroLead: `mt-3 max-w-2xl text-body leading-relaxed ${TT_MARKETING_ORDERS_TEXT_BODY}`,
  heroBridge: TT_MARKETING_ORDERS_PAGE_SECTION_BRIDGE_LINE,
  bridgeLine: TT_MARKETING_ORDERS_PAGE_SECTION_BRIDGE_LINE,
  panelFrame: TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE,
  panelInner: `${TT_MARKETING_ORDERS_DARK_GLASS_INNER} relative overflow-hidden`,
  panelGlow: `${TT_MARKETING_WARM_L5_CARD_INNER_GLOW_CONSOLE} opacity-90`,
  panelBody: "relative z-[1] p-4 sm:p-5",
  noticeSoft: `${TT_MARKETING_ORDERS_CALLOUT_PANEL} ${TT_MARKETING_CALLOUT_LEFT_ACCENT}`,
  toolbarShell: TT_MARKETING_ORDERS_TOOLBAR_SHELL,
  toolbarInnerFlat: TT_MARKETING_ORDERS_TOOLBAR_INNER_FLAT,
  filterBar: TT_MARKETING_ORDERS_FILTER_BAR,
  filterTabActive: `${FILTER_TAB_BASE} ${TT_MARKETING_ORDERS_FILTER_TAB_SELECTED}`,
  filterTabIdle: `${FILTER_TAB_BASE} ${TT_MARKETING_ORDERS_FILTER_TAB_IDLE}`,
  createCta: `${touchTargetLink44Classes} ${TT_MARKETING_ORDERS_HERO_CTA}`,
  personaSelect:
    "min-h-[40px] rounded-[var(--radius-md)] border border-white/15 bg-slate-950/55 px-3 text-small text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:border-ref-sun/45 focus:outline-none focus:ring-2 focus:ring-ref-sun/35 [color-scheme:dark]",
  listSectionTitle: `text-small font-semibold uppercase tracking-[0.12em] ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  listCountBadge: TT_MARKETING_ORDERS_LIST_COUNT_BADGE,
  proposalCardFrame: TT_MARKETING_ORDERS_LIST_CARD_FRAME,
  proposalCardInner: `${TT_MARKETING_ORDERS_LIST_CARD_INNER} p-4 sm:p-5`,
  proposalTitle: `text-body font-semibold text-slate-50 underline-offset-4 hover:underline`,
  proposalMeta: `mt-1.5 text-meta ${TT_MARKETING_ORDERS_TEXT_META}`,
  accordion:
    "rounded-[var(--radius-lg)] border border-white/12 bg-slate-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
  accordionSummary: `cursor-pointer list-none px-4 py-3 text-small font-medium ${TT_MARKETING_ORDERS_TEXT_BODY} [&::-webkit-details-marker]:hidden`,
  footerNav: `flex flex-wrap gap-x-5 gap-y-2 border-t border-ref-sun/14 pt-4 text-small ${TT_MARKETING_ORDERS_TEXT_BODY}`,
  footerLink: `${touchTargetLink44Classes} ${TT_MARKETING_ORDERS_FOOTER_CROSS_LINK}`,
  statusPillActive:
    "rounded-full border border-ref-sun/40 bg-gradient-to-r from-ref-sun/20 to-ref-coral/15 px-2.5 py-0.5 text-meta font-semibold text-[#ffe8d4] shadow-[0_0_12px_-6px_rgba(252,164,124,0.35)]",
  statusPillPending:
    "rounded-full border border-white/15 bg-slate-950/60 px-2.5 py-0.5 text-meta font-semibold text-slate-300",
  voteBarTrack:
    "mt-3 flex h-2.5 overflow-hidden rounded-full border border-white/12 bg-slate-950/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
  voteBarYes: "bg-gradient-to-r from-emerald-400/90 to-emerald-500/80",
  voteBarNo: "bg-gradient-to-r from-rose-400/85 to-rose-500/75",
  voteBarAbstain: "bg-gradient-to-r from-slate-500/80 to-slate-600/70",
  voteLegend: `mt-2 flex flex-wrap gap-x-4 gap-y-1 text-meta ${TT_MARKETING_ORDERS_TEXT_META}`,
  cardHint: `mt-2 text-small ${TT_MARKETING_ORDERS_TEXT_BODY}`,
  cardCta: "mt-3 inline-flex min-h-[40px] items-center text-small font-semibold text-ref-sun/95 underline-offset-4 hover:text-ref-sun hover:underline",
  sectionHeading: `text-small font-semibold uppercase tracking-[0.1em] ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  detailTitle: `text-h3 font-bold tracking-tight text-slate-50 sm:text-[1.35rem]`,
  wizardStepActive:
    "rounded-full border border-ref-sun/35 bg-gradient-to-r from-ref-sun/18 to-ref-coral/12 px-3 py-1 font-semibold text-[#ffe8d4] shadow-[0_0_12px_-8px_rgba(252,164,124,0.45)]",
  wizardStepDone: "rounded-full border border-ref-sun/15 bg-ref-sun/[0.08] px-3 py-1 text-slate-300",
  wizardStepIdle: "rounded-full border border-transparent bg-slate-950/45 px-3 py-1 text-slate-400",
  templateCardActive:
    "rounded-[var(--radius-md)] border border-ref-sun/40 bg-gradient-to-br from-ref-sun/[0.14] to-slate-950/80 p-4 text-left shadow-[0_0_24px_-12px_rgba(252,164,124,0.35)]",
  templateCardIdle:
    "rounded-[var(--radius-md)] border border-white/12 bg-slate-950/45 p-4 text-left hover:border-ref-sun/28 hover:bg-ref-sun/[0.06]",
  crossNavWrap: `mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  crossNavSep: "text-slate-500 select-none",
  crossNavLink: `${touchTargetLink44Classes} ${TT_MARKETING_ORDERS_FOOTER_CROSS_LINK}`,
  footerWrap: TT_MARKETING_ORDERS_FOOTER_WRAP,
  footerTopFade: TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  inlineLink: `${TT_MARKETING_ORDERS_FOOTER_CROSS_LINK} !inline-flex !min-h-0 !px-0 font-medium underline underline-offset-2`,
  linkFocus: `${TT_MARKETING_FOCUS_RING_CONSOLE} focus-visible:ring-offset-[#0c0a09]`,
  metaNote: `text-meta ${TT_MARKETING_ORDERS_TEXT_META}`,
  mutedNote: `text-meta ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  filterEmptyPanel:
    "mt-6 rounded-[var(--radius-lg)] border border-ref-sun/22 bg-slate-950/55 px-4 py-3 text-body text-slate-200 backdrop-blur-md",
  loadingPanel: `${TT_MARKETING_ORDERS_CALLOUT_PANEL} space-y-3`,
  retryBtn: `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/40 bg-slate-950/55 px-4 py-2 text-small font-semibold text-slate-100 hover:border-ref-sun/55 hover:bg-ref-sun/10 focus-visible:ring-offset-[#0c0a09]`,
  primarySubmit: `${touchTargetLink44Classes} ${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} rounded-[var(--radius-md)] px-5 py-2 text-small font-semibold focus-visible:ring-offset-[#0c0a09]`,
  formField:
    "w-full rounded-[var(--radius-md)] border border-white/15 bg-slate-950/55 px-3 py-2 text-body text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:border-ref-sun/45 focus:outline-none focus:ring-2 focus:ring-ref-sun/35",
  formLabel: `block text-small font-medium ${TT_MARKETING_ORDERS_TEXT_BODY}`,
  formHint: `mt-1 text-meta ${TT_MARKETING_ORDERS_TEXT_META}`,
} as const;

export function governanceProposalsL5MainDataAttrs(): Record<string, string> {
  return {
    ...traveltrustProductL5ShellDataAttrs("governance-proposals"),
    "data-tt-governance-proposals-l5": GOV_PROPOSALS_L5_VISUAL_DATA_ATTR,
    "data-tt-governance-proposals-l5-ssot": GOV_PROPOSALS_L5_SSOT_ID,
  };
}
