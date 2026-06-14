/**
 * 经营工作台 L5 壳层（与 `meSettingsL5` / `AuthL5PageBackdrop` 同族 · ① 本地）。
 * Guide `/guide` · Merchant `/provider` · Steward `/governance?view=region`
 */
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { traveltrustExperienceL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";

export const WORKSPACE_L5_MARKER = "workspace-workbench-l5-v1" as const;

export type WorkspaceL5Kind = "guide" | "merchant" | "steward";

export function workspaceWorkbenchL5DataAttrs(kind: WorkspaceL5Kind): Record<string, string> {
  const base: Record<string, string> = {
    "data-tt-ui-generation": "v2",
    "data-tt-auth-visual": "l5",
    "data-tt-workspace-l5": WORKSPACE_L5_MARKER,
  };
  if (kind === "guide") {
    return { ...base, ...traveltrustExperienceL5ShellDataAttrs("guide") };
  }
  if (kind === "merchant") {
    return { ...base, ...traveltrustExperienceL5ShellDataAttrs("provider") };
  }
  return { ...base, "data-tt-steward-workspace-page": "1" };
}

export const TT_WORKSPACE_L5 = {
  pageShell: TT_ME_SETTINGS_L5.pageShell,
  pageColumn: "relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6",
  headerCard: TT_ME_SETTINGS_L5.sectionCard + " px-4 py-4 sm:px-6 sm:py-5",
  headerEyebrow: TT_AUTH_L5_FORM.eyebrow,
  headerTitle: TT_AUTH_L5_FORM.title,
  headerSubtitle: TT_ME_SETTINGS_L5.subtitle,
  sectionCard: TT_ME_SETTINGS_L5.sectionCard + " px-4 py-4 sm:px-5 sm:py-5",
  sectionTitle: "text-small font-semibold text-slate-100",
  sectionSubtitle: "text-meta text-slate-400/95 mt-0.5",
  statTile:
    "rounded-xl border border-ref-sun/18 bg-ref-sun/[0.04] px-3 py-3 text-center min-w-[7rem] flex-1",
  statValue: "text-h3 font-bold font-mono tabular-nums text-[#fde9a8]",
  statValueAccent: "text-h3 font-bold font-mono tabular-nums text-ref-sun",
  statLabel: "text-meta text-slate-400/95 mt-0.5",
  inboxSection:
    "auth-l5-glass-surface overflow-hidden rounded-xl border border-ref-sun/50 bg-[#0c0a09]/62 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-2xl shadow-[0_0_28px_rgba(253,200,80,0.07)] ring-1 ring-ref-sun/20",
  nextOrderCard:
    "rounded-xl border border-ref-sun/32 bg-gradient-to-br from-ref-sun/[0.08] via-[#0c0a09]/45 to-[#0a0a0a]/85 px-4 py-4 sm:px-5",
  warningPanel:
    "rounded-xl border border-warning/35 bg-warning/[0.08] px-4 py-5 sm:px-6 backdrop-blur-sm",
  errorPanel: TT_ME_SETTINGS_L5.sectionCard + " px-4 py-4 space-y-4",
  primaryBtn: `${TT_AUTH_L5_FORM.secondaryButton} border-ref-sun/45 bg-ref-sun/15 text-[#fde9a8] hover:bg-ref-sun/22 hover:border-ref-sun/55 font-semibold`,
  secondaryBtn: TT_AUTH_L5_FORM.secondaryButton,
  backLink: TT_ME_SETTINGS_L5.backLink,
  navLink:
    "inline-flex min-h-[44px] items-center rounded-xl border border-ref-sun/28 bg-ref-sun/[0.05] px-4 py-2 text-meta font-medium text-slate-200 hover:border-ref-sun/42 hover:bg-ref-sun/[0.09] motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/42 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  darkProseWrap: "dark text-slate-200",
} as const;
