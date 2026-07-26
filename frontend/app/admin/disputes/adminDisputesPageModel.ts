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
export const ORDER_ID_QUERY_MAX = 64;
export const DISPUTE_ID_QUERY_MAX = 64;
export const DISPUTE_Q_QUERY_MAX = 64;

export function clampDisputeLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseDisputesListQuery(sp: URLSearchParams): {
  limit: number;
  status: string;
  orderId: string;
  disputeId: string;
  q: string;
} {
  const limit = clampDisputeLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, STATUS_MAX);
  // Batch-13 FO7 / FD6 · 订单深链 ?orderId= · 精确 order_id
  const orderId = (sp.get("orderId") ?? sp.get("order_id") ?? "")
    .trim()
    .slice(0, ORDER_ID_QUERY_MAX);
  const disputeId = (sp.get("id") ?? sp.get("disputeId") ?? "")
    .trim()
    .slice(0, DISPUTE_ID_QUERY_MAX);
  const q = (sp.get("q") ?? "").trim().slice(0, DISPUTE_Q_QUERY_MAX);
  return { limit, status, orderId, disputeId, q };
}

export function buildDisputesListPath(opts: {
  limit: number;
  status: string;
  orderId?: string;
  disputeId?: string;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampDisputeLimit(opts.limit)));
  const st = opts.status.trim().slice(0, STATUS_MAX);
  if (st) sp.set("status", st);
  const oid = (opts.orderId ?? "").trim().slice(0, ORDER_ID_QUERY_MAX);
  if (oid) sp.set("orderId", oid);
  const did = (opts.disputeId ?? "").trim().slice(0, DISPUTE_ID_QUERY_MAX);
  if (did) sp.set("id", did);
  const needle = (opts.q ?? "").trim().slice(0, DISPUTE_Q_QUERY_MAX);
  if (needle) sp.set("q", needle);
  return `/admin/disputes?${sp.toString()}`;
}
