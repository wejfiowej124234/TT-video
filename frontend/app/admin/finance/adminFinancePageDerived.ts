import { type FinanceMeta, isRecord } from "./adminFinancePageTypes";

export type AdminFinanceDerived = {
  generatedAt: string | null;
  feeRouterStats: Record<string, unknown> | null;
  regionVaultStats: Record<string, unknown> | null;
  lastProjReconcile: Record<string, unknown> | null;
  lastReportId: string;
  projectionClean: unknown;
  issuesTotal: unknown;
  issuesN: number | null;
};

export function resolveAdminFinanceDerived(meta: FinanceMeta | null): AdminFinanceDerived {
  const generatedAt =
    meta?.generated_at && !Number.isNaN(Date.parse(meta.generated_at))
      ? new Date(meta.generated_at).toLocaleString()
      : null;

  const feeRouterStats = meta && isRecord(meta.fee_router_stats) ? meta.fee_router_stats : null;
  const regionVaultStats = meta && isRecord(meta.region_vault_stats) ? meta.region_vault_stats : null;
  const lastProjReconcile =
    meta && isRecord(meta.last_stored_orders_projection_reconcile)
      ? meta.last_stored_orders_projection_reconcile
      : null;
  const lastReportId =
    typeof lastProjReconcile?.report_id === "string" ? lastProjReconcile.report_id.trim() : "";
  const projectionClean = lastProjReconcile?.projection_reconcile_clean;
  const issuesTotal = lastProjReconcile?.issues_total;
  const issuesN = typeof issuesTotal === "number" && Number.isFinite(issuesTotal) ? issuesTotal : null;

  return {
    generatedAt,
    feeRouterStats,
    regionVaultStats,
    lastProjReconcile,
    lastReportId,
    projectionClean,
    issuesTotal,
    issuesN,
  };
}
