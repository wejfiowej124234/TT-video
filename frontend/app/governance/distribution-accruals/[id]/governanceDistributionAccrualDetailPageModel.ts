export type AccrualLine = {
  holder_address: string;
  balance_snapshot_u256_hex: string;
  accrual_u256_hex: string;
};

export type DistributionDetail = {
  id: string;
  chain_id: number;
  token_address: string;
  snapshot_block_number: number;
  total_cash_u256_hex: string;
  created_at: string;
  lines?: unknown[];
  snapshot_binding?: unknown;
};

export type AccrualsDetailRes = {
  status: string;
  data_source?: string;
  items?: unknown[];
};

export function asLine(row: unknown): AccrualLine | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const holder_address = typeof o.holder_address === "string" ? o.holder_address : null;
  const balance_snapshot_u256_hex =
    typeof o.balance_snapshot_u256_hex === "string" ? o.balance_snapshot_u256_hex : null;
  const accrual_u256_hex = typeof o.accrual_u256_hex === "string" ? o.accrual_u256_hex : null;
  if (!holder_address || !balance_snapshot_u256_hex || !accrual_u256_hex) return null;
  return { holder_address, balance_snapshot_u256_hex, accrual_u256_hex };
}

export function asDetail(row: unknown): DistributionDetail | null {
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
    lines: o.lines as unknown[] | undefined,
    snapshot_binding: o.snapshot_binding,
  };
}
