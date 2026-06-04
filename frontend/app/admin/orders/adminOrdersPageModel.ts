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
};

export type AdminOrdersRes = {
  status?: string;
  items?: AdminOrder[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export const STATE_MAX = 64;

export function clampOrderLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseOrdersListQuery(sp: URLSearchParams): { limit: number; state: string } {
  const limit = clampOrderLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const state = (sp.get("state") ?? "").trim().slice(0, STATE_MAX);
  return { limit, state };
}

export function buildOrdersListPath(q: { limit: number; state: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOrderLimit(q.limit)));
  const st = q.state.trim().slice(0, STATE_MAX);
  if (st) sp.set("state", st);
  return `/admin/orders?${sp.toString()}`;
}
