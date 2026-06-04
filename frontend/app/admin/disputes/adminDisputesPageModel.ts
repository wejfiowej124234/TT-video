export type AdminDispute = {
  id: string;
  order_id: string;
  status: string;
  arbitrator_id?: string;
  refund_ratio?: number | null;
  slash_guide?: boolean | null;
  created_at?: string;
};

export type AdminDisputesRes = {
  status?: string;
  items?: AdminDispute[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export const STATUS_MAX = 128;

export function clampDisputeLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseDisputesListQuery(sp: URLSearchParams): { limit: number; status: string } {
  const limit = clampDisputeLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, STATUS_MAX);
  return { limit, status };
}

export function buildDisputesListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampDisputeLimit(q.limit)));
  const st = q.status.trim().slice(0, STATUS_MAX);
  if (st) sp.set("status", st);
  return `/admin/disputes?${sp.toString()}`;
}
