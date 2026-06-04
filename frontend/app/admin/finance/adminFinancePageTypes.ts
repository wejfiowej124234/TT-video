import type { LocaleInterpolationVars } from "@/lib/i18n";

/** 与 `useTranslation().t` 同形，便于子组件 props 收口 */
export type AdminFinanceTranslate = (key: string, vars?: LocaleInterpolationVars) => string;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type FinanceMeta = {
  generated_at?: string;
  source?: string;
  /** 与 GET /meta.build 同源（07 §5.7 对账快照与发布追溯） */
  build?: Record<string, unknown>;
  db_order_count?: number | null;
  db_orders_with_escrow_count?: number | null;
  /** Rows in `reconciliation_reports` with type `orders_projection_vs_orders` when PgPool present; else null. */
  orders_projection_reconcile_report_count?: number | null;
  /** All rows in `reconciliation_reports` when PgPool present; else null. */
  reconciliation_reports_total_count?: number | null;
  /** Rows with parsed `summary.stats.issues_total` ≥ 1 (same filter as reconcile-reports `issues_min`); else null. */
  reconciliation_reports_with_open_issues_count?: number | null;
  /** Rows with `summary.stats.projection_reconcile_clean === false` (reconcile-reports filter); else null. */
  reconciliation_reports_projection_unclean_count?: number | null;
  /** Rows with `summary.stats.projection_reconcile_clean === true`; else null. */
  reconciliation_reports_projection_clean_count?: number | null;
  /** API `FEE_ROUTER_ADDRESS` when `ChainConfig` loaded; aligns with `GET /meta.chain.contracts` (07 §5.2A). */
  fee_router_address?: string | null;
  /** `null` = no DB / query failed; object = `fee_router_routed_events` rollup (all `chain_id`). */
  fee_router_stats?: unknown;
  /** API `REGION_VAULT_ADDRESS` when `ChainConfig` loaded. */
  region_vault_address?: string | null;
  /** `null` = no DB / query failed; object = `region_vault_forwarded_events` rollup (all `chain_id`). */
  region_vault_stats?: unknown;
  /** `null` = none; object = latest persisted `orders_projection_vs_orders` report digest. */
  last_stored_orders_projection_reconcile?: unknown;
};

export type FinanceSummary = {
  order_count?: number;
  state_counts?: Record<string, number>;
  total_amount_by_currency?: Record<string, number>;
  escrowed_amount_by_currency?: Record<string, number>;
  dispute_count?: number;
  dispute_status_counts?: Record<string, number>;
  orders_with_escrow_address_count?: number;
  orders_amount_parse_error_count?: number;
};

export type FinanceRes = {
  status?: string;
  meta?: FinanceMeta;
  summary?: FinanceSummary;
  error?: string;
};
