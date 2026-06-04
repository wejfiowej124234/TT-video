export type OverviewBody = {
  status?: string;
  error?: string;
  /** 与 Admin 列表接口一致：顶层 meta.build 同 GET /meta.build */
  meta?: unknown;
  overview?: {
    chain_id?: string;
    /** 与 GET /meta.build 同源（07 · 5.6C / 120 / 140） */
    build?: Record<string, unknown>;
    indexer?: Record<string, unknown>;
    rate_limits?: Record<string, unknown>;
    alerts?: Record<string, unknown>;
    audit?: Record<string, unknown>;
  };
  actor?: Record<string, unknown>;
};

export type LastStoredReconciliation = {
  report_id?: string;
  report_type?: string;
  chain_id?: number | null;
  created_at?: string;
  projection_reconcile_clean?: boolean | null;
  issues_total?: number | null;
};

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}
