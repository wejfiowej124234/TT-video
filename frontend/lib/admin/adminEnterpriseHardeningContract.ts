/**
 * V65 Batch3 Cut B · Enterprise Admin Hardening contract (①).
 * Residuals: R049/R051/R056 · R033–R035 · R037/R054 · R015/R042/R043.
 * Markers are staging-smoke / vitest SSOT — do not rename lightly.
 */

/** Row count at/above which Guides (and similar admin lists) may virtualize. */
export const ADMIN_ENTERPRISE_LIST_VIRTUAL_THRESHOLD = 32;

export const ADMIN_ENTERPRISE_LIST_VIRTUAL_ESTIMATE_PX = 52;
export const ADMIN_ENTERPRISE_LIST_VIRTUAL_OVERSCAN = 8;

/** R049 · sitewide lifecycle truth badges (not finance-only REAL/PARTIAL). */
export type AdminEnterpriseLifecycleTone =
  | "ACTIVE"
  | "PARTIAL"
  | "DISABLED"
  | "TARGET"
  | "HISTORICAL";

/** R051 · hub / leaf data-source honesty tones (align Ops leaf strip). */
export type AdminEnterpriseDataSourceTone =
  | "real_db"
  | "memory"
  | "mixed"
  | "unavailable"
  | "declared";

export const ADMIN_ENTERPRISE_HARDENING_MARKERS = {
  /** Root chrome present on Cut B surfaces. */
  root: "data-tt-admin-enterprise-hardening",
  /** R049 lifecycle badge. */
  lifecycleBadge: "data-tt-admin-enterprise-lifecycle-badge",
  lifecycleTone: "data-tt-admin-enterprise-lifecycle-tone",
  /** R051 hub data-source strip. */
  hubDataSourceStrip: "data-tt-admin-enterprise-hub-data-source",
  hubDataSourceTone: "data-tt-admin-enterprise-hub-data-source-tone",
  hubDataSourceSurface: "data-tt-admin-enterprise-hub-surface",
  /** R056 Product FE/API tip honesty (≠ Web3 tip narrative). */
  tipHonestyStrip: "data-tt-admin-enterprise-tip-honesty",
  tipHonestyKind: "data-tt-admin-enterprise-tip-honesty-kind",
  /** R033 content status contrast. */
  contentStatusContrast: "data-tt-admin-enterprise-content-status-contrast",
  /** R034 guides table chrome honesty. */
  guidesTableChrome: "data-tt-admin-enterprise-guides-table-chrome",
  /** R035 guides status filter honesty (select, not free-text). */
  guidesStatusSelect: "data-tt-admin-enterprise-guides-status-select",
  /** R014 guides real filter bar (q/city/country + status). */
  guidesFilterBar: "data-tt-admin-enterprise-guides-filter-bar",
  /** R014 guides status/actions nowrap honesty. */
  guidesTableNowrap: "data-tt-admin-enterprise-guides-table-nowrap",
  /** R037/R054 list virtualization honesty. */
  listVirtual: "data-tt-admin-enterprise-list-virtual",
  listVirtualCount: "data-tt-admin-enterprise-list-virtual-count",
  /** R015 content hub dedupe / publish-audit honesty. */
  contentSurfaceHonesty: "data-tt-admin-enterprise-content-surface-honesty",
  /** R042 orders force-readonly surface. */
  ordersReadonlyHonesty: "data-tt-admin-enterprise-orders-readonly-honesty",
  /** R043 content submodule depth honesty. */
  contentDepthHonesty: "data-tt-admin-enterprise-content-depth-honesty",
} as const;

export type AdminEnterpriseHubSurface = "content" | "official" | "growth" | "orders" | "guides";

export type AdminEnterpriseTipHonestyKind = "product_fe" | "product_api" | "mixed_declared";

/** R049 · lifecycle badge contrast (sitewide; not finance-only REAL/PARTIAL). */
export const ADMIN_ENTERPRISE_LIFECYCLE_TONE_CLASS: Record<AdminEnterpriseLifecycleTone, string> = {
  ACTIVE:
    "inline-flex items-center rounded-md border border-success-600/40 bg-success-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-success-800",
  PARTIAL:
    "inline-flex items-center rounded-md border border-warning-600/45 bg-warning-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning-900",
  DISABLED:
    "inline-flex items-center rounded-md border border-ink-400 bg-ink-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-800",
  TARGET:
    "inline-flex items-center rounded-md border border-ink-500 bg-ink-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-700",
  HISTORICAL:
    "inline-flex items-center rounded-md border border-ink-300 bg-ink-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-600",
};

/** R051 · hub data-source strip tone classes. */
export const ADMIN_ENTERPRISE_HUB_DATA_SOURCE_TONE_CLASS: Record<
  AdminEnterpriseDataSourceTone,
  string
> = {
  real_db: "border-success-600/35 bg-success-50/80 text-success-900",
  memory: "border-warning-600/40 bg-warning-50/90 text-warning-950",
  mixed: "border-ink-400 bg-ink-50 text-ink-900",
  unavailable: "border-danger-500/35 bg-danger-50/80 text-danger-900",
  declared: "border-ink-300 bg-ink-50 text-ink-800",
};

/** Guide directory status options for honest select filter (R035). */
export const ADMIN_GUIDES_STATUS_SELECT_OPTIONS = [
  "",
  "active",
  "suspended",
  "pending_review",
  "rejected",
] as const;

export type AdminGuidesStatusSelectValue = (typeof ADMIN_GUIDES_STATUS_SELECT_OPTIONS)[number];

export function shouldVirtualizeAdminEnterpriseList(count: number): boolean {
  return count >= ADMIN_ENTERPRISE_LIST_VIRTUAL_THRESHOLD;
}

export function adminEnterpriseLifecycleLabelKey(tone: AdminEnterpriseLifecycleTone): string {
  switch (tone) {
    case "ACTIVE":
      return "admin_enterprise_lifecycle_active";
    case "PARTIAL":
      return "admin_enterprise_lifecycle_partial";
    case "DISABLED":
      return "admin_enterprise_lifecycle_disabled";
    case "TARGET":
      return "admin_enterprise_lifecycle_target";
    case "HISTORICAL":
      return "admin_enterprise_lifecycle_historical";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function adminEnterpriseDataSourceLabelKey(tone: AdminEnterpriseDataSourceTone): string {
  switch (tone) {
    case "real_db":
      return "admin_ops_leaf_data_source_real_db";
    case "memory":
      return "admin_ops_leaf_data_source_memory";
    case "mixed":
      return "admin_ops_leaf_data_source_mixed";
    case "unavailable":
      return "admin_ops_leaf_data_source_unavailable";
    case "declared":
      return "admin_enterprise_hub_data_source_declared";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export type AdminEnterpriseContentStatusContrastTone =
  | "published"
  | "in_flight"
  | "archived"
  | "neutral";

/** Content CMS status → contrast tone for R033 badge. */
export function adminEnterpriseContentStatusContrastTone(
  status: string | null | undefined,
): AdminEnterpriseContentStatusContrastTone {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "published" || s === "approved") return "published";
  if (s === "archived") return "archived";
  if (
    s === "draft" ||
    s === "in_review" ||
    s === "review" ||
    s === "generating" ||
    s === "pending" ||
    s === "rejected"
  ) {
    return "in_flight";
  }
  return "neutral";
}

/** High-contrast status badge surfaces (R033 · extends R016). */
export const ADMIN_ENTERPRISE_CONTENT_STATUS_CONTRAST_CLASS: Record<
  AdminEnterpriseContentStatusContrastTone,
  string
> = {
  published: "bg-emerald-100 text-emerald-950 ring-1 ring-inset ring-emerald-300",
  in_flight: "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-300",
  archived: "bg-slate-200 text-slate-900 ring-1 ring-inset ring-slate-400",
  neutral: "bg-ink-200 text-ink-900 ring-1 ring-inset ring-ink-400",
};
