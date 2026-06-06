export type RegionVaultSummary = {
  total?: number;
  max_block_number?: number | null;
  min_block_number?: number | null;
  latest_inserted_at?: string | null;
  chain_id_filter?: number | null;
};

export type RegionVaultItem = {
  id: string;
  chain_id: number;
  block_number: number;
  log_index: number;
  tx_hash: string;
  vault_address: string;
  token_address: string;
  to_address: string;
  amount_u256_hex: string;
  inserted_at: string;
};

export type AdminRegionVaultRes = {
  status?: string;
  summary?: RegionVaultSummary;
  items?: RegionVaultItem[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
  message?: string;
};

export const REGION_VAULT_PAGE_LIMIT = 25;

/** First-page snapshot extras in list-fetch meta (`useAdminRegionVaultPage`). */
export const ADMIN_REGION_VAULT_SUMMARY_META_KEY = "__adminRegionVaultSummary";
export const ADMIN_REGION_VAULT_PAGE_META_KEY = "__adminRegionVaultPage";

export function shortHex(s: string, head = 6, tail = 4): string {
  const t = s.trim();
  if (t.length <= head + tail + 2) return t;
  return `${t.slice(0, head + 2)}…${t.slice(-tail)}`;
}
