/** 04 §3.4 GET /api/v1/governance/vault-forwards；RegionVault RegionVaultForwarded 投影 */
export type VaultForwardItem = {
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

export type VaultForwardsRes = {
  status: string;
  items?: VaultForwardItem[];
  page?: { has_more?: boolean; next_cursor?: string | null };
  note?: string;
};

export type GovernanceVaultForwardsMetaJson = {
  chain?: {
    chain_id?: string;
    contracts?: {
      chain_id_configured?: number;
      region_vault_address?: string | null;
    } | null;
  };
};

export const VAULT_FORWARDS_PAGE_LIMIT = 20;

export function resolveConfiguredChainId(meta: GovernanceVaultForwardsMetaJson | null): number | null {
  if (!meta?.chain) return null;
  const c = meta.chain.contracts?.chain_id_configured;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  const raw = meta.chain.chain_id;
  if (raw == null) return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

function governanceMetaHttpErrorDetail(body: unknown): string | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const m = o.message;
  const e = o.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (typeof e === "string" && e.trim()) return e.trim();
  return null;
}

export function governanceMetaHttpErrorLine(status: number, body: unknown, t: (k: string) => string): string {
  const base = t("governance_meta_http_error").replace("{{status}}", String(status));
  const detail = governanceMetaHttpErrorDetail(body);
  return detail ? `${base} — ${detail}` : base;
}
