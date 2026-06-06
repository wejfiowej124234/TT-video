/**
 * Auth L5 共享表单/卡片 token（登录 · 注册 · 找回/重置/验证 · loading/error）。
 * 机读：`authRegisterL5` · `authFlowL5` · `loginPageL5` · `authRouteL5` contract tests。
 */
import { TT_MARKETING_ACTION_GRADIENT_FILL } from "@/lib/marketingUi";

export const TT_AUTH_L5_TITLE_GRADIENT =
  "bg-gradient-to-b from-[#fde9a8] via-ref-sun to-[#d4a84b] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(252,164,124,0.22)]";

const TT_AUTH_CONTROL_RADIUS = "rounded-xl";

const TT_AUTH_L5_CARD_GLASS = `auth-l5-glass-surface relative z-[1] w-full min-w-0 overflow-hidden ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/44 bg-[#0c0a09]/62 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0c0a09]/55`;

const TT_AUTH_FIELD_SHELL = `auth-l5-field-control flex min-h-[44px] w-full items-center ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/44 bg-[#14100d]/94 px-4 py-2.5 text-small text-slate-100 placeholder:text-slate-500/80 caret-ref-sun transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-55`;

const TT_AUTH_FIELD_FOCUS =
  "focus:outline-none focus-visible:border-ref-sun/62 focus-visible:shadow-[0_0_0_3px_rgba(252,164,124,0.28),inset_0_1px_0_rgba(252,164,124,0.08)]";

export const TT_AUTH_L5_FORM = {
  cardWrap: "relative flex w-full flex-col items-center",
  cardHalo:
    "auth-login-l5-card-halo pointer-events-none absolute left-1/2 top-[38%] z-0 h-[min(24rem,55vh)] w-[min(100%,32rem)] -translate-x-1/2 -translate-y-1/2",
  card: TT_AUTH_L5_CARD_GLASS,
  cardWide: "max-w-lg",
  cardNarrow: "max-w-sm",
  cardSheen:
    "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/60 to-transparent",
  cardInnerGlow:
    "pointer-events-none absolute inset-0 bg-gradient-to-b from-ref-sun/[0.07] via-transparent to-transparent",
  cardBody: "relative flex flex-col gap-4 p-7 sm:p-8",
  cardBodyLogin: "relative flex flex-col gap-0 p-7 sm:p-8",
  headerBlock: "flex flex-col gap-2.5 pb-6",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.16em] text-ref-sun/70",
  title: `text-h3 font-bold tracking-tight sm:text-h2 ${TT_AUTH_L5_TITLE_GRADIENT}`,
  titleLogin: `text-h2 font-bold tracking-tight sm:text-h1 ${TT_AUTH_L5_TITLE_GRADIENT}`,
  titleCompact: `text-h4 font-bold tracking-tight ${TT_AUTH_L5_TITLE_GRADIENT}`,
  subtitle: "text-small leading-[1.65] text-slate-300/95 max-w-[20rem]",
  bodyText: "text-small text-slate-300/95",
  metaText: "text-meta text-slate-400/95",
  fieldGroup: "flex min-w-0 flex-col gap-2",
  label: "block text-small font-medium tracking-wide text-slate-300",
  field: `${TT_AUTH_FIELD_SHELL} hover:border-ref-sun/48 hover:bg-ref-sun/[0.05]`,
  textarea: `auth-l5-field-control flex min-h-[80px] w-full ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/40 bg-[#14100d]/76 px-4 py-2.5 text-small text-slate-100 placeholder:text-slate-500/90 ${TT_AUTH_FIELD_FOCUS}`,
  fieldInvalid: "border-danger/55 aria-invalid:border-danger/65",
  fieldFocus: TT_AUTH_FIELD_FOCUS,
  formSection: "flex flex-col gap-5 border-t border-ref-sun/12 pt-6",
  rememberRow: "flex items-center gap-3 mb-3",
  rememberRowHit:
    "group flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-xl px-1 -mx-1 mb-1 transition-colors motion-reduce:transition-none hover:bg-ref-sun/[0.05] focus-within:bg-ref-sun/[0.06] focus-within:outline-none focus-within:ring-2 focus-within:ring-ref-sun/35 focus-within:ring-offset-2 focus-within:ring-offset-[#0c0a09]",
  rememberLabel: "text-meta leading-snug text-slate-300/90 select-none cursor-pointer group-hover:text-slate-200",
  primaryCta: `inline-flex min-h-[48px] w-full items-center justify-center gap-2 ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/36 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-3.5 text-small font-semibold text-[#1a120c] shadow-[0_12px_36px_-18px_rgba(252,164,124,0.55)] hover:brightness-[1.03] active:scale-[0.99] motion-safe:transition-[filter,transform] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`,
  primaryCtaLogin: `inline-flex min-h-[48px] w-full items-center justify-center gap-2 ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/36 ${TT_MARKETING_ACTION_GRADIENT_FILL} px-4 py-3.5 text-small font-semibold text-[#1a120c] shadow-[0_12px_36px_-18px_rgba(252,164,124,0.55)] hover:brightness-[1.03] active:scale-[0.99] motion-safe:transition-[filter,transform] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] mt-3`,
  primaryCtaSpinner:
    "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1a120c]/25 border-t-[#1a120c]",
  secondaryButton:
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ref-sun/28 bg-[#14100d]/60 px-4 py-2 text-small font-medium text-slate-200 hover:border-ref-sun/42 hover:bg-ref-sun/[0.06] active:scale-[0.99] motion-safe:transition-[border-color,background-color,transform] motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  backButton:
    "inline-flex min-h-[44px] items-center px-1 text-meta font-medium text-ref-sun/85 hover:text-ref-sun transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] rounded-lg",
  banner:
    "rounded-xl border border-ref-sun/16 bg-ref-sun/[0.06] px-3 py-2.5 text-meta leading-relaxed text-slate-300/95",
  callout:
    "auth-l5-callout-surface rounded-xl border border-ref-sun/22 bg-ref-sun/[0.07] px-3.5 py-3 text-meta leading-[1.6] text-slate-300/95",
  calloutStrong: "font-semibold text-ref-sun",
  walletHint: "mb-6",
  sectionTitle: "text-small font-semibold text-slate-200 border-b border-ref-sun/12 pb-1",
  footerLinks:
    "inline-flex min-h-[44px] items-center text-small font-semibold underline underline-offset-[5px] transition-opacity motion-reduce:transition-none hover:opacity-90",
  footerMeta: "flex flex-wrap items-center justify-center gap-x-5 gap-y-2",
  footerMetaCompact: "flex flex-wrap items-center gap-x-3 gap-y-1 text-meta",
  footerDivider: "mt-5 border-t border-ref-sun/12 pt-5",
  error:
    "rounded-xl border border-danger/38 bg-danger/10 px-3.5 py-2.5 text-small text-ref-coral whitespace-pre-line",
  checkboxTrack:
    "auth-l5-checkbox-track inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] border border-ref-sun/44 bg-[#14100d]/94 shadow-[inset_0_1px_0_rgba(252,164,124,0.08)] transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none",
  checkboxTrackChecked: "border-ref-sun/60 bg-ref-sun/18 shadow-[0_0_0_1px_rgba(252,164,124,0.24)]",
  checkboxTrackFocus:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  checkboxIcon: "h-3 w-3 text-ref-sun",
  passwordHintOk: "text-meta mt-0.5 text-slate-400",
  passwordHintWarn: "text-meta mt-0.5 text-ref-coral/90",
  fileInput: `auth-l5-field-control w-full min-h-[44px] ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/40 bg-[#14100d]/76 px-3 py-2 text-small text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ref-sun/90 file:px-3 file:py-1.5 file:text-small file:font-medium file:text-[#1a120c] ${TT_AUTH_FIELD_FOCUS}`,
  fileMeta: "text-meta text-slate-400/95 mt-0.5",
  fileSelected: "text-meta text-ref-sun/85 mt-0.5",
  agreeText: "text-meta text-slate-300/95",
  passwordToggle: `absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ref-sun/85 hover:text-ref-sun hover:bg-ref-sun/10 transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`,
  passwordFieldWrap: "relative",
  loadingSkeletonCard: `w-full overflow-hidden ${TT_AUTH_CONTROL_RADIUS} border border-ref-sun/36 bg-[#0c0a09]/72 p-7 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(252,164,124,0.08)] ring-1 ring-ref-sun/12`,
  loadingPulse: "animate-pulse rounded-xl bg-ref-sun/14 motion-reduce:animate-none motion-reduce:opacity-80",
  errorPageActions: "mt-4 flex flex-wrap justify-center gap-3",
  errorPageLinks: "mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-slate-400",
  errorPageLink: `font-semibold text-ref-sun underline underline-offset-4 decoration-ref-sun/45 hover:text-[#fde9a8] ${TT_AUTH_FIELD_FOCUS}`,
} as const;

export function authL5FieldClass(invalid: boolean): string {
  return `${TT_AUTH_L5_FORM.field} ${TT_AUTH_L5_FORM.fieldFocus} ${invalid ? TT_AUTH_L5_FORM.fieldInvalid : ""}`;
}
