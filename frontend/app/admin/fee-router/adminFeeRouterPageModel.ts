export type Summary = {
  total?: number;
  max_block_number?: number | null;
  min_block_number?: number | null;
  latest_inserted_at?: string | null;
  chain_id_filter?: number | null;
};

export type FeeRouteItem = {
  id: string;
  chain_id: number;
  block_number: number;
  log_index: number;
  tx_hash: string;
  token_address: string;
  amount_u256_hex: string;
  to_country_u256_hex: string;
  to_stakers_u256_hex: string;
  to_reserve_u256_hex: string;
  to_ops_u256_hex: string;
  inserted_at: string;
};

export type AdminFeeRouterRes = {
  status?: string;
  summary?: Summary;
  items?: FeeRouteItem[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
  message?: string;
};

export const ADMIN_FEE_ROUTER_PAGE_LIMIT = 25;

export function shortHex(s: string, head = 6, tail = 4): string {
  const t = s.trim();
  if (t.length <= head + tail + 2) return t;
  return `${t.slice(0, head + 2)}…${t.slice(-tail)}`;
}
