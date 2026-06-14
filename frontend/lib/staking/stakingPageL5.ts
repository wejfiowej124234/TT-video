import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { traveltrustExperienceL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

/** `/staking` · ① 本地 L5（体验深壳 · 对齐首页 `/guide` 暖金暗场） */
export const STAKING_PAGE_L5_MARKER = "staking-page-l5-v2-experience" as const;

export const TT_STAKING_PAGE_L5 = {
  guideScopePageAttrs: {
    ...traveltrustExperienceL5ShellDataAttrs("staking"),
    "data-tt-staking-page": "1",
    "data-tt-staking-page-l5": STAKING_PAGE_L5_MARKER,
    "data-tt-staking-guide-scope": "1",
    "data-tt-ui-frozen": "staking-l5-20260612",
  },
  fullPageAttrs: {
    ...traveltrustExperienceL5ShellDataAttrs("staking"),
    "data-tt-staking-page": "1",
    "data-tt-staking-page-l5": STAKING_PAGE_L5_MARKER,
    "data-tt-ui-frozen": "staking-l5-20260612",
  },
  experienceShell: TT_WORKSPACE_L5.pageShell,
  experienceColumn: TT_WORKSPACE_L5.pageColumn,
  headerCard: TT_WORKSPACE_L5.headerCard,
  headerEyebrow: TT_WORKSPACE_L5.headerEyebrow,
  headerTitle: TT_WORKSPACE_L5.headerTitle,
  headerSubtitle: TT_WORKSPACE_L5.headerSubtitle,
  introNote: TT_ME_SETTINGS_L5.sectionCallout,
  panelStack: "flex flex-col gap-5",
  panelCard: `${TT_WORKSPACE_L5.sectionCard} px-4 py-4 sm:px-5 sm:py-5`,
  panelTitle: TT_WORKSPACE_L5.sectionTitle,
  panelSubtitle: TT_WORKSPACE_L5.sectionSubtitle,
  panelMeta: "mt-1 font-mono text-meta text-slate-500 break-all",
  statGrid: "mt-4 grid gap-3 sm:grid-cols-2",
  statRow: TT_WORKSPACE_L5.statTile + " text-left",
  statLabel: TT_WORKSPACE_L5.statLabel,
  statValue: TT_WORKSPACE_L5.statValue,
  statValueMuted: "text-body font-mono tabular-nums text-slate-300",
  calloutWarn: TT_WORKSPACE_L5.warningPanel,
  calloutDanger:
    "rounded-xl border border-danger/35 bg-danger/[0.08] px-4 py-3 text-body text-red-300 leading-relaxed backdrop-blur-sm",
  calloutInfo: TT_ME_SETTINGS_L5.sectionCallout,
  divider: "mt-6 border-t border-ref-sun/14 pt-4",
  backLink: TT_WORKSPACE_L5.backLink,
  primaryBtn: TT_WORKSPACE_L5.primaryBtn,
  secondaryBtn: TT_WORKSPACE_L5.secondaryBtn,
  navLink: TT_WORKSPACE_L5.navLink,
  disclaimer: "text-meta leading-relaxed text-slate-500/90",
  bodyProse: "text-body text-slate-300/95 leading-relaxed",
  metaProse: "text-meta text-slate-400/95",
  input:
    "mt-1 block min-h-[44px] w-full max-w-xs rounded-lg border border-ref-sun/28 bg-[#0a0a0a]/60 px-3 py-2 text-body text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  inputLabel: "text-small text-slate-300",
  chipBtn: `${TT_WORKSPACE_L5.secondaryBtn} min-h-[44px] px-3 py-2 text-small`,
  submitBtn: TT_ME_SETTINGS_L5.btnPrimary,
  trustSubmitBtn:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ref-sun/45 bg-ref-sun/20 px-5 py-2.5 text-small font-semibold text-[#fde9a8] transition-colors hover:border-ref-sun/60 hover:bg-ref-sun/28 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  amountHero:
    "mt-4 rounded-xl border border-ref-sun/32 bg-gradient-to-br from-ref-sun/[0.08] via-[#0c0a09]/45 to-[#0a0a0a]/85 px-4 py-4 text-center",
  amountHeroLabel: "text-meta font-medium text-ref-sun/70",
  amountHeroValue: TT_WORKSPACE_L5.statValue,
  amountHeroHint: "mt-2 text-meta text-slate-400/95",
  registryDetails:
    "group rounded-xl border border-ref-sun/22 bg-ref-sun/[0.03] px-4 py-3 backdrop-blur-sm",
  registrySummary:
    "cursor-pointer list-none text-small font-medium text-ref-sun/75 marker:content-none [&::-webkit-details-marker]:hidden",
  txConfirmCard:
    "overflow-hidden rounded-xl border border-ref-sun/38 bg-gradient-to-br from-ref-sun/[0.1] via-[#0c0a09]/55 to-[#0a0a0a]/90 shadow-[0_0_32px_rgba(253,200,80,0.08)] ring-1 ring-ref-sun/22",
  txConfirmHeader: "border-b border-ref-sun/18 px-4 py-3 sm:px-5",
  txConfirmBody: "space-y-4 px-4 py-4 sm:px-5 sm:py-5",
  txConfirmStepBadge:
    "inline-flex items-center rounded-full border border-ref-sun/35 bg-ref-sun/12 px-2.5 py-0.5 text-meta font-medium text-ref-sun/85",
  txConfirmTitle: "mt-2 text-body font-semibold text-slate-100",
  txConfirmSubtitle: "mt-1 text-meta leading-relaxed text-slate-400/95",
  txConfirmAmountBlock:
    "rounded-xl border border-ref-sun/28 bg-[#0a0a0a]/55 px-4 py-4 text-center",
  txConfirmAmountValue: "text-h3 font-bold font-mono tabular-nums text-[#fde9a8]",
  txConfirmAmountUnit: "ml-2 text-meta font-normal text-slate-400",
  txConfirmWalletHint:
    "rounded-xl border border-ref-sun/25 bg-ref-sun/[0.06] px-4 py-3 text-meta leading-relaxed text-slate-300/95",
  txConfirmWalletHintTitle: "text-small font-semibold text-ref-sun/80",
  txConfirmTechDetails:
    "group rounded-lg border border-ref-sun/16 bg-[#0a0a0a]/40 px-3 py-2",
  txConfirmTechSummary:
    "cursor-pointer list-none text-meta font-medium text-slate-400 marker:content-none [&::-webkit-details-marker]:hidden",
  txConfirmTechGrid: "mt-2 grid gap-2 text-meta",
  txConfirmTechRow: "grid grid-cols-1 gap-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-2",
  txConfirmTechLabel: "text-slate-500",
  txConfirmTechValue: "font-mono text-small text-slate-300 break-all",
  txConfirmCtaWrap: "border-t border-ref-sun/14 px-4 py-4 sm:px-5",
  txConfirmCtaBtn:
    "inline-flex w-full min-h-[48px] items-center justify-center rounded-xl border border-ref-sun/50 bg-ref-sun/22 px-5 py-3 text-body font-semibold text-[#fde9a8] transition-colors hover:border-ref-sun/65 hover:bg-ref-sun/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  legacyPanel:
    "mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft",
  /** @deprecated 浅壳列宽；体验深壳用 experienceColumn */
  guideScopeShell: TT_WORKSPACE_L5.pageShell,
  guideScopeColumn: TT_WORKSPACE_L5.pageColumn,
  fullShell: TT_WORKSPACE_L5.pageShell,
  fullColumn: TT_WORKSPACE_L5.pageColumn,
} as const;
