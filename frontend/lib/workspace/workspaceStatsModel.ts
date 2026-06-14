/** W4 Workspace · `GET /me` stats 块旁证（与 `workspace_stats.rs` 对读） */

export type MerchantWorkspaceStats = {
  orders_merchant_total?: number;
  merchant_in_progress_count?: number;
  merchant_period_expected_earnings?: number;
  merchant_period_settled_orders_count?: number;
  billing_period_utc?: string;
};

export type AcquisitionWorkspaceStats = {
  acquisition_orders_as_owner?: number;
  acquisition_orders_as_carrier?: number;
  acquisition_in_progress_count?: number;
  acquisition_listings_published_24h?: number;
};

export type StewardWorkspaceStats = {
  steward_governance_workspace?: string;
  steward_orders_n_a?: boolean;
};

function num(raw: unknown): number | undefined {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

export function parseMerchantWorkspaceStats(stats: Record<string, unknown> | null | undefined): MerchantWorkspaceStats {
  if (!stats) return {};
  return {
    orders_merchant_total: num(stats.orders_merchant_total),
    merchant_in_progress_count: num(stats.merchant_in_progress_count),
    merchant_period_expected_earnings: num(stats.merchant_period_expected_earnings),
    merchant_period_settled_orders_count: num(stats.merchant_period_settled_orders_count),
    billing_period_utc: typeof stats.billing_period_utc === "string" ? stats.billing_period_utc : undefined,
  };
}

export function parseAcquisitionWorkspaceStats(
  stats: Record<string, unknown> | null | undefined,
): AcquisitionWorkspaceStats {
  if (!stats) return {};
  return {
    acquisition_orders_as_owner: num(stats.acquisition_orders_as_owner),
    acquisition_orders_as_carrier: num(stats.acquisition_orders_as_carrier),
    acquisition_in_progress_count: num(stats.acquisition_in_progress_count),
    acquisition_listings_published_24h: num(stats.acquisition_listings_published_24h),
  };
}

export function parseStewardWorkspaceStats(stats: Record<string, unknown> | null | undefined): StewardWorkspaceStats {
  if (!stats) return {};
  return {
    steward_governance_workspace:
      typeof stats.steward_governance_workspace === "string"
        ? stats.steward_governance_workspace
        : undefined,
    steward_orders_n_a: stats.steward_orders_n_a === true,
  };
}
