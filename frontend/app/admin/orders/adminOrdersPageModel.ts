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
export const ORDER_DATA_ORIGIN_MAX = 64;

export function clampOrderLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseOrdersListQuery(sp: URLSearchParams): {
  limit: number;
  state: string;
  data_origin: string;
} {
  const limit = clampOrderLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const state = (sp.get("state") ?? "").trim().slice(0, STATE_MAX);
  const data_origin = (sp.get("data_origin") ?? "").trim().slice(0, ORDER_DATA_ORIGIN_MAX);
  return { limit, state, data_origin };
}

export function buildOrdersListPath(q: { limit: number; state: string; data_origin?: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOrderLimit(q.limit)));
  const st = q.state.trim().slice(0, STATE_MAX);
  if (st) sp.set("state", st);
  const origin = (q.data_origin ?? "").trim().slice(0, ORDER_DATA_ORIGIN_MAX);
  if (origin) sp.set("data_origin", origin);
  return `/admin/orders?${sp.toString()}`;
}
