export type IndexerHealthRes = {
  status?: string;
  error?: string;
  health?: Record<string, unknown>;
  meta?: unknown;
};

/** Indexer health object stashed in list-fetch meta by `useAdminIndexerPage`. */
export const ADMIN_INDEXER_HEALTH_META_KEY = "__adminIndexerHealth";

export type LastStoredReconciliation = {
  report_id?: string;
  report_type?: string;
  created_at?: string;
  chain_id?: number | null;
  projection_reconcile_clean?: boolean | null;
  issues_total?: number | null;
};

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}
