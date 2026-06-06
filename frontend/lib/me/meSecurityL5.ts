/**
 * `/me/security` · L5 暖金暗玻璃（与 `meSettingsL5` 同族 · ① 本地）
 */
import { authL5FieldClass } from "@/lib/auth/authL5Form";
import { ME_SETTINGS_HUB_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export const ME_SECURITY_PATH = "/me/security" as const;

export const ME_SECURITY_PANEL_IDS = {
  wallet: "me-security-wallet",
  sessions: "me-security-sessions",
  notifications: "me-security-notifications",
} as const;

export type MeSecurityFocus = keyof typeof ME_SECURITY_PANEL_IDS;

export function meSecurityHref(focus?: MeSecurityFocus): string {
  if (!focus) return ME_SECURITY_PATH;
  return `${ME_SECURITY_PATH}?focus=${focus}`;
}

export { ME_SETTINGS_HUB_PATH };

export const TT_ME_SECURITY_L5 = {
  panel: `${TT_ME_SETTINGS_L5.sectionCard} p-4 sm:p-5`,
  panelHeader: "mb-3 flex flex-wrap items-center justify-between gap-2",
  panelTitle: "text-small font-semibold text-slate-100",
  panelToolbar: "flex flex-wrap items-center gap-2",
  errorBanner:
    "rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-small text-danger",
  sessionList: "flex flex-col gap-2",
  sessionCard:
    "rounded-lg border border-ref-sun/16 bg-ref-sun/[0.04] px-3 py-3 text-small text-slate-300",
  sessionMetaGrid: "mt-2 grid gap-1.5 text-meta text-slate-400/95 sm:grid-cols-2",
  sessionMetaLabel: "text-ref-sun/55",
  notifList: "flex flex-col gap-2",
  notifCard:
    "rounded-lg border border-ref-sun/14 bg-ref-sun/[0.03] px-3 py-2.5 text-small text-slate-300",
  notifCardRisk: "border-warning/35 bg-warning/[0.06]",
  notifPayload:
    "mt-2 max-h-48 overflow-auto rounded-lg border border-ref-sun/18 bg-[#0a0a0a]/80 p-2 font-mono text-[11px] leading-5 text-slate-400",
  filterRow: "mb-3 flex flex-wrap items-center gap-2",
  input: authL5FieldClass(false),
  select:
    "rounded-lg border border-ref-sun/28 bg-[#0c0a09]/85 px-2.5 py-1.5 text-small text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40",
  btnSecondary:
    "rounded-lg border border-ref-sun/32 bg-ref-sun/[0.06] px-3 py-1.5 text-small font-medium text-ref-sun/90 transition-colors hover:border-ref-sun/48 hover:bg-ref-sun/10 disabled:opacity-50 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40",
  btnPrimary:
    "rounded-lg border border-ref-sun/45 bg-ref-sun/15 px-4 py-2 text-small font-semibold text-[#fde9a8] transition-colors hover:border-ref-sun/60 hover:bg-ref-sun/22 disabled:opacity-50 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  btnDangerGhost:
    "rounded-lg border border-danger/35 bg-danger/10 px-3 py-1.5 text-small font-medium text-ref-coral hover:border-danger/50 disabled:opacity-50",
  badgeOk: "rounded-full border border-success/35 bg-success/12 px-2 py-0.5 text-meta text-success",
  badgeMuted: "rounded-full border border-ref-sun/22 bg-ref-sun/8 px-2 py-0.5 text-meta text-slate-400",
  checkLabel: "inline-flex items-center gap-1.5 text-meta text-slate-400/95",
} as const;
