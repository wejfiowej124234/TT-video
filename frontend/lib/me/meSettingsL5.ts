/**
 * `/me/settings` · L5 暖金暗玻璃（与 `meIdentitiesL5` / `authL5Form` 同族 · ① 本地）。
 * 机读：`meSettingsL5.contract.test.ts` · `meSettingsPageI18nKeys.test.ts`
 */
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export const ME_SETTINGS_L5_VISUAL_DATA_ATTR = "l5" as const;

export const ME_SETTINGS_HUB_PATH = "/me/settings" as const;

export const ME_SETTINGS_PASSWORD_PATH = "/me/password" as const;

export const ME_SETTINGS_LANGUAGE_PATH = "/me/settings/language" as const;

export const ME_SETTINGS_PRIVACY_PATH = "/me/settings/privacy" as const;

/** 社区身份编辑（头像/昵称/简介 · 原 `/community/me` Hub） */
export const ME_SETTINGS_PROFILE_PATH = "/me/settings/profile" as const;

/** 机读闸 JSON（与 `meSettingsPageTracker` 对拍） */
export const ME_SETTINGS_L5_LOCAL_GATE_JSON_PATH =
  "evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json" as const;

export function meSettingsL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-me-settings-ui-frozen": "1",
    "data-tt-auth-visual": ME_SETTINGS_L5_VISUAL_DATA_ATTR,
    "data-tt-me-settings-route": "hub",
  };
}

export const TT_ME_SETTINGS_L5 = {
  pageShell:
    "relative isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0a0a] text-slate-300 px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 motion-safe:transition-opacity duration-500",
  pageColumn: "relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6",
  headerBlock: "text-center sm:text-left",
  eyebrow: TT_AUTH_L5_FORM.eyebrow,
  title: TT_AUTH_L5_FORM.titleCompact,
  subtitle: "mt-2 max-w-xl text-meta leading-relaxed text-slate-400/95 sm:mx-0 mx-auto",
  profileCard:
    "auth-l5-glass-surface group flex w-full items-center gap-4 overflow-hidden rounded-xl border border-ref-sun/40 bg-[#0c0a09]/62 p-4 backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-ref-sun/55 hover:bg-ref-sun/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  profileAvatar:
    "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ref-sun/35 bg-ref-sun/[0.08]",
  profileBody: "min-w-0 flex-1 text-left",
  profileName: "block truncate text-body font-semibold text-slate-100 group-hover:text-[#fde9a8]",
  profileMeta: "mt-0.5 block truncate text-meta text-slate-400/95",
  profileRole:
    "mt-1 inline-flex rounded-md border border-ref-sun/30 bg-ref-sun/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ref-sun/85",
  profileChevron: "flex h-8 w-8 shrink-0 items-center justify-center text-ref-sun/55 group-hover:text-ref-sun",
  section: "space-y-2",
  sectionsStack: "flex flex-col gap-5",
  sectionTitle: "px-1 text-small font-medium text-ref-sun/70",
  sectionCallout:
    "rounded-xl border border-ref-sun/22 bg-ref-sun/[0.05] px-4 py-3 text-meta leading-relaxed text-slate-400/95",
  subsectionTitle: "px-1 pt-2 text-meta font-medium text-ref-sun/55",
  sectionCard:
    "auth-l5-glass-surface overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0c0a09]/55",
  row: "group flex min-h-[48px] w-full items-center gap-3 border-b border-ref-sun/10 px-4 py-2.5 text-left transition-colors motion-reduce:transition-none last:border-b-0 hover:bg-ref-sun/[0.05] focus:outline-none focus-visible:bg-ref-sun/[0.07] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40",
  rowStatic:
    "flex min-h-[48px] w-full items-center gap-3 border-b border-ref-sun/10 px-4 py-2.5 text-left last:border-b-0 bg-ref-sun/[0.02]",
  rowSoon:
    "flex min-h-[48px] w-full items-center gap-3 border-b border-ref-sun/10 px-4 py-2.5 text-left last:border-b-0 opacity-90",
  rowIcon:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ref-sun/22 bg-ref-sun/[0.06] text-ref-sun/90",
  rowBody: "min-w-0 flex-1",
  rowLabel: "text-small font-medium text-slate-100",
  rowDesc: "mt-0.5 line-clamp-1 text-meta leading-snug text-slate-400/95",
  rowChevron: "h-4 w-4 shrink-0 text-ref-sun/45 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5 group-hover:text-ref-sun/75",
  rowExternalIcon: "h-3.5 w-3.5 shrink-0 text-ref-sun/40 group-hover:text-ref-sun/70",
  badgeSoon:
    "shrink-0 rounded-md border border-ref-sun/28 bg-ref-sun/12 px-2 py-0.5 text-[10px] font-semibold text-ref-sun/90",
  logoutSection: "border-t border-ref-sun/14 pt-6",
  logoutWrap: "",
  logoutBtn:
    "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-small font-semibold text-ref-coral transition-colors motion-reduce:transition-none hover:border-danger/50 hover:bg-danger/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  footerMinimal: "border-t border-ref-sun/12 pt-6 text-center",
  backLink: `${TT_AUTH_L5_FORM.backButton} self-start`,
  confirmOverlay:
    "fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in duration-200",
  confirmPanel:
    "auth-l5-glass-surface relative w-full max-w-md rounded-xl border border-ref-sun/40 bg-[#0c0a09]/92 p-5 shadow-[0_0_40px_rgba(251,191,36,0.08)] ring-1 ring-ref-sun/20 sm:p-6",
  confirmTitle: "text-body font-semibold text-slate-100",
  confirmDesc: "mt-2 text-meta leading-snug text-slate-300/95",
  confirmActions: "mt-5 flex flex-wrap gap-3",
  confirmBtnCancel: `${TT_AUTH_L5_FORM.secondaryButton} min-h-[44px] flex-1`,
  confirmBtnPrimary:
    "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-ref-sun/45 bg-ref-sun/15 px-4 py-2 text-small font-semibold text-[#fde9a8] hover:border-ref-sun/60 hover:bg-ref-sun/22 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50",
  confirmBtnDanger:
    "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-danger/55 bg-danger/10 px-4 py-2 text-small font-semibold text-red-300 hover:border-danger/70 hover:bg-danger/16 hover:text-red-200 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50",
  toggleRow:
    "flex min-h-[48px] w-full items-center gap-3 border-b border-ref-sun/10 px-4 py-2.5 text-left last:border-b-0",
  toggleSwitch:
    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-ref-sun/35 bg-ref-sun/[0.06] transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50",
  toggleSwitchOn: "border-ref-sun/55 bg-ref-sun/25",
  toggleThumb:
    "pointer-events-none inline-block h-5 w-5 translate-x-0.5 rounded-full bg-slate-200 shadow transition-transform motion-reduce:transition-none",
  toggleThumbOn: "translate-x-[22px] bg-[#fde9a8]",
  visibilityOption:
    "flex min-h-[48px] w-full cursor-pointer items-center gap-3 border-b border-ref-sun/10 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ref-sun/[0.05] focus-within:bg-ref-sun/[0.06]",
  visibilityRadio:
    "h-4 w-4 shrink-0 border-ref-sun/45 text-ref-sun focus:ring-ref-sun/40 focus:ring-offset-[#0a0a0a]",
  /** `/me/settings/profile` 身份卡 · 与 Hub profileCard 同族、可展开编辑区 */
  profilePageStack: "flex flex-col gap-5",
  profileIdentityCard: "auth-l5-glass-surface overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 p-5 backdrop-blur-2xl sm:p-6",
  profileIdentityRow: "flex items-start gap-4 sm:gap-5",
  profileIdentityAvatar:
    "relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-ref-sun/40 bg-ref-sun/[0.08] sm:h-20 sm:w-20",
  profileIdentityAvatarInitial: "text-h3 font-semibold text-ref-sun/90 sm:text-h2",
  profileIdentityAvatarBtn:
    "absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-ref-sun/90 text-[#1a120c] shadow-[0_4px_14px_rgba(252,164,124,0.35)] hover:brightness-105 motion-sub disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  profileIdentityBody: "min-w-0 flex-1",
  profileIdentityName: "text-h4 font-semibold tracking-tight text-slate-100 sm:text-h3",
  profileIdentityBio: "mt-2 text-small leading-relaxed text-slate-400/95 whitespace-pre-wrap break-words",
  profileIdentityBioEmpty: "mt-2 text-meta text-slate-500/95",
  profileIdentityLink:
    "mt-1 inline-flex min-h-[44px] items-center text-meta font-medium text-ref-sun/85 underline underline-offset-4 decoration-ref-sun/35 hover:text-[#fde9a8] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm",
  profileIdentityActions: "mt-4 flex flex-wrap items-center gap-2 border-t border-ref-sun/12 pt-4",
  profileIdentityEditBtn: `${TT_AUTH_L5_FORM.secondaryButton} w-auto px-5 py-2.5 min-h-[44px] text-meta`,
  profileAvatarLoadFailed:
    "rounded-lg border border-warning/30 bg-warning/10 px-2 py-2 text-left text-meta text-slate-400/95 max-w-[9rem] mx-auto",
  profileStatsGrid:
    "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2",
  profileStatCell:
    "flex min-h-[72px] flex-col items-center justify-center rounded-xl border border-ref-sun/12 bg-ref-sun/[0.03] px-2 py-3 text-center transition-colors hover:border-ref-sun/28 hover:bg-ref-sun/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  profileStatValue: "text-h4 font-bold tabular-nums text-[#fde9a8]",
  profileStatValueMuted: "text-h4 font-bold tabular-nums text-slate-500",
  profileStatLabel: "mt-1 text-meta text-slate-400/95",
  profileDetailsCard: "auth-l5-glass-surface overflow-hidden rounded-xl border border-ref-sun/38 bg-[#0c0a09]/62 backdrop-blur-2xl",
  profileSectionHint: "px-1 pb-2 text-meta leading-relaxed text-slate-500/95",
  profileFieldGroupTitle: "text-meta font-semibold uppercase tracking-wide text-ref-sun/55",
  profileFieldLabel: "text-meta font-medium text-ref-sun/65",
  profileFieldValue: "text-small text-slate-100",
  profileFieldValueMono: "text-meta font-mono text-slate-300",
  profileFieldHint: "mt-1 text-meta text-slate-500/95",
  profileBadgeOk:
    "inline-flex rounded-md border border-ref-sun/35 bg-ref-sun/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ref-sun/90",
  profileBadgeWarn:
    "inline-flex min-h-[32px] items-center rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta font-medium text-warning hover:text-[#fde9a8] underline underline-offset-2",
  profileEditFormWrap: "border-t border-ref-sun/12 px-4 py-4 sm:px-5 sm:py-5 space-y-4",
  profileCompletenessWrap: "space-y-2",
  profileCompletenessPct: "text-meta font-semibold tabular-nums text-[#fde9a8]",
  profileCompletenessTrack: "h-1.5 overflow-hidden rounded-full bg-ref-sun/10",
  profileCompletenessFill: "h-full rounded-full bg-gradient-to-r from-ref-sun/70 to-[#fde9a8]/90 motion-safe:transition-[width] duration-300",
  profileCompletenessList: "flex flex-wrap gap-x-4 gap-y-1 px-1 text-meta text-slate-400/95",
  profileCompletenessItem: "inline-flex items-center gap-1.5 text-slate-500",
  profileCompletenessItemDone: "inline-flex items-center gap-1.5 text-ref-sun/80",
  profileAvatarUploadHint: "mt-2 text-center text-meta text-ref-sun/55",
} as const;

export const ME_SETTINGS_L5_CONFIRM_DATA_ATTR = "me-settings-confirm" as const;
