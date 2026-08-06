/**
 * Batch-11 W07 · Finance ops L5 SSOT
 * HU-396 three-track · HU-398 nav · HU-401 target · HU-402 data-source strip
 * ≠ Production GO · 禁写资金
 */
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";
import {
  ADMIN_SHELL_FINANCE_NAV_LINKS,
  ADMIN_SHELL_FINANCE_PEER_NAV_LINKS,
} from "@/lib/admin/adminShellFinanceNavLinks";
import type { FinanceMeta, FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";

export const FINANCE_OPS_L5_PROBE = "finance-ops-l5-batch11-w07-v1" as const;

export type FinanceThreeTrackLaneId = "usdc" | "stripe" | "growth";

export type FinanceThreeTrackLane = {
  id: FinanceThreeTrackLaneId;
  titleKey: string;
  hintKey: string;
  primaryHref: string;
  secondaryHref?: string;
  secondaryLabelKey?: string;
  badgeKey?: string;
};

/** HU-396 · 财务中心顶栏三轨地图 */
export const FINANCE_THREE_TRACK_LANES: readonly FinanceThreeTrackLane[] = [
  {
    id: "usdc",
    titleKey: "admin_fin_three_track_usdc_title",
    hintKey: "admin_fin_three_track_usdc_hint",
    primaryHref: "/admin/finance-suite",
    secondaryHref: "/admin/finance-reconciliation",
    secondaryLabelKey: "admin_fin_three_track_usdc_secondary",
  },
  {
    id: "stripe",
    titleKey: "admin_fin_three_track_stripe_title",
    hintKey: "admin_fin_three_track_stripe_hint",
    primaryHref: "/admin/onboarding/payment-events",
    secondaryHref: "/admin/onboarding/entitlements",
    secondaryLabelKey: "admin_fin_three_track_stripe_secondary",
  },
  {
    id: "growth",
    titleKey: "admin_fin_three_track_growth_title",
    hintKey: "admin_fin_three_track_growth_hint",
    primaryHref: "/admin/growth/reward-ledger",
    badgeKey: "admin_fin_three_track_growth_badge",
  },
] as const;

/**
 * HU-398 / HU-571 · 套件页折叠磁贴 = peers only（shell 主栏仅 suite）。
 * 默认不吞 primary；若传入并集 SSOT 则仍跳过 `activeExact` hub。
 */
export function financeSuiteNavTiles(
  links: readonly AdminShellNavLinkDef[] = ADMIN_SHELL_FINANCE_PEER_NAV_LINKS,
): AdminShellNavLinkDef[] {
  // Fail-closed: missing/circular PEER export must not throw `… is not iterable` on /admin/finance-suite.
  const src = Array.isArray(links)
    ? links
    : Array.isArray(ADMIN_SHELL_FINANCE_PEER_NAV_LINKS)
      ? ADMIN_SHELL_FINANCE_PEER_NAV_LINKS
      : ADMIN_SHELL_FINANCE_NAV_LINKS.filter((l) => !l.activeExact);
  if (src === ADMIN_SHELL_FINANCE_PEER_NAV_LINKS) return src.slice();
  return src.filter((l) => !l.activeExact);
}

/** HU-401 · Snapshot/Claim 仍为目标态的模块 */
export const FINANCE_MODULE_SNAPSHOT_CLAIM_TARGET_IDS = new Set([
  "fee-router",
  "region-vault",
]);

export function financeModuleHasSnapshotClaimTarget(moduleId: string): boolean {
  return FINANCE_MODULE_SNAPSHOT_CLAIM_TARGET_IDS.has(moduleId);
}

export type FinanceDataSourceTone = "mixed" | "memory" | "unavailable";

export type FinanceDataSourceStrip = {
  tone: FinanceDataSourceTone;
  labelKey: string;
};

/**
 * HU-402 · finance summary 数据源条（fail-closed）
 * memory(chain_off) 订单计数 vs PG 投影混读 → mixed
 */
export function resolveFinanceSummaryDataSourceStrip(
  meta: FinanceMeta | null | undefined,
  summary: FinanceSummary | null | undefined,
): FinanceDataSourceStrip {
  if (!meta || typeof meta.source !== "string" || !meta.source.trim()) {
    return { tone: "unavailable", labelKey: "admin_finance_summary_data_source_unavailable" };
  }
  const hasPgProjection =
    meta.db_order_count != null ||
    meta.fee_router_stats != null ||
    meta.region_vault_stats != null ||
    meta.settlement_router_stats != null ||
    meta.reconciliation_reports_total_count != null;
  const hasMemorySummary = summary != null && typeof summary.order_count === "number";
  if (hasPgProjection && (hasMemorySummary || meta.source === "chain_off")) {
    return { tone: "mixed", labelKey: "admin_finance_summary_data_source_mixed" };
  }
  if (meta.source === "chain_off" || hasMemorySummary) {
    return { tone: "memory", labelKey: "admin_finance_summary_data_source_memory" };
  }
  return { tone: "mixed", labelKey: "admin_finance_summary_data_source_mixed" };
}
