export type AdminAuditOperationsRes = {
  status?: string;
  error?: string;
  operations?: unknown[];
  catalog_total?: number;
  returned?: number;
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
};

export function isAuditOpRow(v: unknown): v is { code: string; mutating: boolean } {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.code === "string" && typeof o.mutating === "boolean";
}

export function clampOpsLimit(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

export function parseOpsListQuery(sp: URLSearchParams): { limit: number } {
  return { limit: clampOpsLimit(Number.parseInt(sp.get("limit") ?? "50", 10)) };
}

export function buildOpsListPath(q: { limit: number }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOpsLimit(q.limit)));
  return `/admin/audit/operations?${sp.toString()}`;
}
