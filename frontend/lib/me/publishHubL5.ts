/**
 * `/me/publish` · L5 暖金暗玻璃（与 `meSettingsL5` / `meIdentitiesL5` 同族 · ① 本地）。
 * SSOT：`evidence/GO_local_auth_l5/PUBLISH-HUB-L5-DESIGN.md`（FROZEN）
 */
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import {
  PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE,
  PUBLISH_HUB_PAGE_L5_FROZEN_MARKER,
} from "@/lib/me/publishHubL5ClosureSprintModel";
import { publishHubIaBoundaryPageDataAttrs } from "@/lib/me/publishHubIaBoundaryFreezeModel";

export const PUBLISH_HUB_L5_VISUAL_DATA_ATTR = "l5" as const;

export const PUBLISH_HUB_PATH = "/me/publish" as const;

export const PUBLISH_HUB_L5_ROUTE = "publish" as const;

export const PUBLISH_HUB_DESIGN_SSOT_PATH =
  "evidence/GO_local_auth_l5/PUBLISH-HUB-L5-DESIGN.md" as const;

export function publishHubL5MainDataAttrs(): Record<string, string> {
  return {
    "data-tt-publish-hub": "1",
    "data-tt-publish-hub-ui-frozen": "1",
    "data-tt-auth-visual": PUBLISH_HUB_L5_VISUAL_DATA_ATTR,
    "data-tt-publish-hub-route": PUBLISH_HUB_L5_ROUTE,
    "data-tt-publish-hub-l5-closure-probe": PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE,
    "data-tt-ui-frozen": PUBLISH_HUB_PAGE_L5_FROZEN_MARKER,
    ...publishHubIaBoundaryPageDataAttrs(),
  };
}

export const TT_PUBLISH_HUB_L5 = {
  pageShell:
    "relative isolate min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0a0a] text-slate-300 px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 motion-safe:transition-opacity duration-500",
  pageColumn: "relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6",
  headerBlock: "text-center sm:text-left",
  eyebrow: TT_AUTH_L5_FORM.eyebrow,
  title: TT_AUTH_L5_FORM.titleLogin,
  subtitle: "mt-3 max-w-2xl text-kicker leading-relaxed text-slate-300/95",
  filterRow: "flex flex-wrap gap-2",
  filterChip:
    "inline-flex min-h-[44px] items-center rounded-full border border-ref-sun/25 bg-ref-sun/[0.04] px-4 py-2 text-meta font-medium text-slate-300 transition-colors hover:border-ref-sun/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  filterChipActive:
    "inline-flex min-h-[44px] items-center rounded-full border border-ref-sun/55 bg-ref-sun/14 px-4 py-2 text-meta font-semibold text-ref-sun transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
  filterChipDisabled: "opacity-45 cursor-not-allowed pointer-events-none",
  railSection: "rounded-xl border border-ref-sun/18 bg-[#0c0a09]/55 p-4 sm:p-5 backdrop-blur-xl",
  railTitle: "text-small font-semibold text-slate-100",
  railSubtitle: "mt-1 text-meta leading-relaxed text-slate-400/95",
  railPlaceholder: "mt-3 rounded-lg border border-dashed border-ref-sun/20 bg-ref-sun/[0.03] px-4 py-6 text-center",
  crossNav: "mt-2 flex flex-wrap gap-x-4 gap-y-2 text-meta",
  crossNavLink:
    "font-medium text-ref-sun/85 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 rounded-sm",
  summaryStrip: "flex flex-wrap gap-2 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.04] px-3 py-3",
  summaryChip:
    "inline-flex min-h-[36px] items-center rounded-full border border-ref-sun/25 bg-[#0c0a09]/70 px-3 py-1 text-meta font-medium text-slate-300",
  itemCard:
    "flex items-stretch gap-3 rounded-xl border border-ref-sun/15 bg-ref-sun/[0.03] p-2.5 sm:gap-4 sm:p-3",
  itemBody: "min-w-0 flex-1 py-0.5",
  itemTitleRow: "flex flex-wrap items-center gap-x-2 gap-y-1",
  itemTitle: "text-small font-medium text-slate-100 line-clamp-2",
  itemSubtitle: "text-meta text-slate-500 mt-1 line-clamp-1",
  itemActions: "flex shrink-0 flex-col items-end justify-center gap-1.5 sm:flex-row sm:items-center",
  itemPrimaryAction: "shrink-0 min-h-[44px] px-3 py-1.5 text-meta",
  itemSecondaryAction: "shrink-0 min-h-[44px] px-3 py-1.5 text-meta",
  itemThumbImage: "h-16 w-16 shrink-0 rounded-lg object-cover border border-ref-sun/15 bg-[#0c0a09]/80",
  itemThumbFallback:
    "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-ref-sun/20 text-meta font-semibold tracking-wide text-ref-sun/85",
} as const;

const ITEM_STATUS_BADGE_BASE =
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

const ITEM_STATUS_BADGE_TONE: Record<
  import("@/lib/me/publishHubItemModel").PublishHubItemStatusTone,
  string
> = {
  success: "border-success/40 bg-success/15 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning/95",
  danger: "border-danger/40 bg-danger/15 text-danger/90",
  neutral: "border-ref-sun/25 bg-ref-sun/[0.06] text-slate-400",
};

const ITEM_THUMB_RAIL_TONE: Record<
  import("@/lib/me/publishHubModel").PublishHubContentRail,
  string
> = {
  trip: "bg-sky-500/10 border-sky-400/25",
  guide: "bg-emerald-500/10 border-emerald-400/25",
  merchant: "bg-ref-sun/10 border-ref-sun/30",
  acquisition: "bg-violet-500/10 border-violet-400/25",
  governance: "bg-amber-500/10 border-amber-400/25",
};

export function publishHubL5ItemStatusBadgeClass(
  tone: import("@/lib/me/publishHubItemModel").PublishHubItemStatusTone,
): string {
  return `${ITEM_STATUS_BADGE_BASE} ${ITEM_STATUS_BADGE_TONE[tone]}`;
}

export function publishHubL5ItemThumbFallbackRailClass(
  rail: import("@/lib/me/publishHubModel").PublishHubContentRail,
): string {
  return ITEM_THUMB_RAIL_TONE[rail];
}
