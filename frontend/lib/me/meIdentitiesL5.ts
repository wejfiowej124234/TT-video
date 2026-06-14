/**
 * `/me/identities` · L5 暖金暗玻璃（与 `authL5Form` / `AuthL5PageBackdrop` 同族 · ① 本地）。
 * 机读：`meIdentitiesL5.contract.test.ts` · `meIdentitiesUiFreeze.contract.test.ts` · `meIdentitiesPage.contract.test.ts`
 */
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_AUTH_L5_CROSS_NAV_LABEL, TT_AUTH_L5_CROSS_NAV_SHELL } from "@/lib/auth/authL5Shell";

export const ME_IDENTITIES_L5_VISUAL_DATA_ATTR = "l5" as const;

export const ME_IDENTITIES_L5_ROUTE = "identities" as const;

/** 多重身份 Hub 路由 SSOT（申请流返回 · 顶栏菜单 · 回链） */
export const ME_IDENTITIES_HUB_PATH = "/me/identities" as const;

export const TT_ME_IDENTITIES_L5 = {
  pageShell:
    "relative isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0a0a] text-slate-300 px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 motion-safe:transition-opacity duration-500",
  inner: "relative z-10 mx-auto w-full max-w-3xl",
  headerBlock: "max-w-2xl",
  eyebrow: TT_AUTH_L5_FORM.eyebrow,
  /** 与登录/注册 `titleLogin` 同级渐变主标题 */
  title: TT_AUTH_L5_FORM.titleLogin,
  subtitle: "mt-3 max-w-2xl text-kicker leading-relaxed text-slate-300/95",
  travelerCallout: `${TT_AUTH_L5_FORM.callout} auth-l5-callout-surface mt-6`,
  travelerCalloutTitle: `${TT_AUTH_L5_FORM.calloutStrong} block text-small`,
  travelerCalloutBody: "mt-1.5 block text-meta leading-relaxed text-slate-300/95",
  travelerCalloutActions: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-2",
  travelerCalloutLink: `${TT_AUTH_L5_FORM.footerLinks} !text-ref-sun/90`,
  gridSection: "relative mt-8 border-t border-ref-sun/12 pt-6",
  applySectionTitle: `${TT_AUTH_L5_FORM.sectionTitle} mb-4`,
  gridHalo:
    "auth-login-l5-card-halo pointer-events-none absolute left-1/2 top-[42%] z-0 h-[min(28rem,58vh)] w-[min(100%,40rem)] -translate-x-1/2 -translate-y-1/2",
  grid: "relative z-[1] grid list-none gap-4 p-0 m-0 sm:grid-cols-1 md:grid-cols-2 md:items-stretch",
  gridItem: "flex min-h-0",
  identityCard:
    "auth-l5-glass-surface auth-l5-glass-vignette group relative flex h-full min-h-[168px] w-full flex-col overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 p-5 backdrop-blur-2xl outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none hover:border-ref-sun/52 hover:bg-ref-sun/[0.06] hover:shadow-[0_12px_40px_-20px_rgba(252,164,124,0.32)] focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-[0.995] motion-reduce:active:scale-100",
  cardAmbient:
    "auth-l5-card-ambient pointer-events-none absolute left-1/2 top-1/2 z-0 h-[92%] w-[calc(100%+8px)] max-w-[calc(100%+8px)] -translate-x-1/2 -translate-y-1/2 rounded-xl opacity-70",
  cardSheen: TT_AUTH_L5_FORM.cardSheen,
  cardInnerGlow: TT_AUTH_L5_FORM.cardInnerGlow,
  cardFloor:
    "auth-l5-glass-floor pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-xl bg-gradient-to-t from-ref-sun/[0.05] to-transparent",
  cardBody: "relative z-[1] flex flex-1 flex-col",
  cardTitle:
    "text-h4 font-semibold text-slate-100 transition-colors motion-reduce:transition-none group-hover:text-[#fde9a8]",
  cardDesc:
    "mt-2 block flex-1 text-meta leading-snug text-slate-400/95 transition-colors motion-reduce:transition-none group-hover:text-slate-300/95",
  cardCta:
    "mt-4 inline-flex min-h-[44px] items-center text-small font-semibold text-ref-sun/88 transition-colors motion-reduce:transition-none group-hover:text-ref-sun",
  cardCtaIcon: "ml-1.5 inline-block transition-transform motion-reduce:transition-none group-hover:translate-x-0.5",
  cardStatusRow: "mb-2 flex flex-wrap items-center gap-2",
  cardStatusPillActive:
    "inline-flex items-center rounded-md border border-ref-sun/45 bg-ref-sun/14 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ref-sun",
  cardStatusPillPending:
    "inline-flex items-center rounded-md border border-warning/45 bg-warning/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-warning/95",
  cardStatusPillRestricted:
    "inline-flex items-center rounded-md border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ref-coral/95",
  /** Hub P2-3 · 最多三行 blocked_reason 摘要 */
  cardBlockedReasonList: "mt-2 space-y-1",
  cardBlockedReasonLine: "block text-[11px] leading-snug text-ref-coral/90",
  footerLinks: "mt-10 flex flex-wrap gap-x-6 gap-y-1",
  footerLink:
    "inline-flex min-h-[44px] items-center text-meta font-semibold text-ref-sun/85 underline underline-offset-4 decoration-ref-sun/35 transition-colors motion-reduce:transition-none hover:text-[#fde9a8] hover:decoration-ref-sun/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-lg",
  crossNavShell: TT_AUTH_L5_CROSS_NAV_SHELL,
  crossNavLabel: TT_AUTH_L5_CROSS_NAV_LABEL,
  loadingGrid: "mt-8 grid gap-4 sm:grid-cols-1 md:grid-cols-2",
  loadingCard: `${TT_AUTH_L5_FORM.loadingSkeletonCard} min-h-[152px] p-5`,
  loadingPulse: TT_AUTH_L5_FORM.loadingPulse,
  loadingHeaderTitle: `h-9 w-56 max-w-full ${TT_AUTH_L5_FORM.loadingPulse}`,
  loadingHeaderSub: `mt-3 h-4 w-full max-w-md ${TT_AUTH_L5_FORM.loadingPulse}`,
  loadingCallout: `mt-6 min-h-[88px] ${TT_AUTH_L5_FORM.loadingSkeletonCard} p-4`,
  /** Hub「身份资料」· 横向媒体行（左图右文 · 非 identityCard 纵卡） */
  profileLinkCard:
    "auth-l5-glass-surface auth-l5-glass-vignette group relative flex min-h-[108px] w-full flex-row items-stretch overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 outline-none backdrop-blur-2xl transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none hover:border-ref-sun/52 hover:bg-ref-sun/[0.06] hover:shadow-[0_12px_40px_-20px_rgba(252,164,124,0.32)] focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-[0.995] motion-reduce:active:scale-100",
  profileLinkMediaCol:
    "relative w-[7.25rem] shrink-0 self-stretch sm:w-32 md:w-36",
  profileLinkMediaImg: "absolute inset-0 h-full w-full object-cover",
  profileLinkMediaScrim:
    "pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-[#0c0a09]/95 via-[#0c0a09]/55 to-transparent sm:w-10",
  profileLinkMediaRing:
    "pointer-events-none absolute inset-0 z-[2] ring-1 ring-inset ring-white/10",
  profileLinkBody: "relative z-[1] flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3.5 sm:px-5",
  profileLinkFooter: "mt-2 flex min-h-[44px] items-center justify-between gap-3",
  profileLinkArrow:
    "shrink-0 text-lg font-semibold leading-none text-ref-sun/75 transition-colors motion-reduce:transition-none group-hover:text-ref-sun",
} as const;

export function meIdentitiesL5MainDataAttrs(frozen = false): Record<string, string> {
  return {
    "data-tt-me-identities-l5": "1",
    "data-tt-me-identities-visual": ME_IDENTITIES_L5_VISUAL_DATA_ATTR,
    "data-tt-auth-visual": ME_IDENTITIES_L5_VISUAL_DATA_ATTR,
    "data-tt-me-identities-route": ME_IDENTITIES_L5_ROUTE,
    ...(frozen ? { "data-tt-me-identities-ui-frozen": "1" } : {}),
  };
}
