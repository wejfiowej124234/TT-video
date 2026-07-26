export type AdminOrder = {
  id: string;
  state: string;
  amount: string;
  currency: string;
  tourist_id?: string;
  /** 87：与 `tourist_id` 同 UUID（`GET /api/v1/admin/orders`） */
  traveler_id?: string;
  guide_id?: string;
  created_at?: string;
  escrow_address?: string | null;
  data_origin?: string;
};

export type AdminOrdersRes = {
  status?: string;
  items?: AdminOrder[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export const STATE_MAX = 64;
export const ORDER_ID_QUERY_MAX = 64;

export function clampOrderLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseOrdersListQuery(sp: URLSearchParams): {
  limit: number;
  state: string;
  id: string;
  q: string;
} {
  const limit = clampOrderLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const state = (sp.get("state") ?? "").trim().slice(0, STATE_MAX);
  // Batch-13 HU-509 · FO6 · ?id= 精确 · ?q= 子串（兼容仅 id）
  const id = (sp.get("id") ?? "").trim().slice(0, ORDER_ID_QUERY_MAX);
  const q = (sp.get("q") ?? "").trim().slice(0, ORDER_ID_QUERY_MAX);
  return { limit, state, id, q };
}

export function buildOrdersListPath(query: {
  limit: number;
  state: string;
  id?: string;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOrderLimit(query.limit)));
  const st = query.state.trim().slice(0, STATE_MAX);
  if (st) sp.set("state", st);
  const id = (query.id ?? "").trim().slice(0, ORDER_ID_QUERY_MAX);
  if (id) sp.set("id", id);
  const q = (query.q ?? "").trim().slice(0, ORDER_ID_QUERY_MAX);
  if (q) sp.set("q", q);
  return `/admin/orders?${sp.toString()}`;
}
