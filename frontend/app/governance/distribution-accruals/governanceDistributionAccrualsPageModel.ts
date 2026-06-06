/** 04 §3.4 GET /api/v1/governance/investor-distribution-accruals（列表项无 lines） */
export type DistributionSummary = {
  id: string;
  chain_id: number;
  token_address: string;
  snapshot_block_number: number;
  total_cash_u256_hex: string;
  created_at: string;
};

export type AccrualsListRes = {
  status: string;
  data_source?: string;
  items?: unknown[];
  note?: string;
};

export const GOVERNANCE_DISTRIBUTION_ACCRUALS_LIST_LIMIT = 50;

export function asDistributionSummary(row: unknown): DistributionSummary | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const chain_id = typeof o.chain_id === "number" ? o.chain_id : null;
  const token_address = typeof o.token_address === "string" ? o.token_address : null;
  const snapshot_block_number =
    typeof o.snapshot_block_number === "number" ? o.snapshot_block_number : null;
  const total_cash_u256_hex = typeof o.total_cash_u256_hex === "string" ? o.total_cash_u256_hex : null;
  const created_at = typeof o.created_at === "string" ? o.created_at : null;
  if (!id || chain_id == null || !token_address || snapshot_block_number == null || !total_cash_u256_hex || !created_at) {
    return null;
  }
  return {
    id,
    chain_id,
    token_address,
    snapshot_block_number,
    total_cash_u256_hex,
    created_at,
  };
}
