/** 从 `GET /meta` 解析链上治理展示用字段（与 `health_meta` `chain` 对象一致；无则 null）。 */

/** 与 `CHAIN_CONTRACTS_META_TOP_KEYS` / 759 同源；仅含协议七键 + `rule`（本对象不返回 rule）。 */
export type ChainContractsSnapshot = {
  guide_staking_address?: string | null;
  staking_provider_address?: string | null;
  governor_address?: string | null;
  timelock_address?: string | null;
  governance_token_address?: string | null;
  fee_router_address?: string | null;
  treasury_address?: string | null;
};

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** `GET /meta` → `chain.contracts`（非对象或非快照时返回 null）。 */
export function chainContractsFromMeta(m: Record<string, unknown>): ChainContractsSnapshot | null {
  const ch = m.chain;
  if (!ch || typeof ch !== "object") return null;
  const contracts = (ch as Record<string, unknown>).contracts;
  if (!contracts || typeof contracts !== "object") return null;
  const c = contracts as Record<string, unknown>;
  return {
    guide_staking_address: strOrNull(c.guide_staking_address),
    staking_provider_address: strOrNull(c.staking_provider_address),
    governor_address: strOrNull(c.governor_address),
    timelock_address: strOrNull(c.timelock_address),
    governance_token_address: strOrNull(c.governance_token_address),
    fee_router_address: strOrNull(c.fee_router_address),
    treasury_address: strOrNull(c.treasury_address),
  };
}

export function governorAddressFromMeta(m: Record<string, unknown>): string | null {
  return chainContractsFromMeta(m)?.governor_address ?? null;
}

/** 解析 `chain.chain_id` 或 legacy `contracts.chain_id_configured`（API 常为字符串）。 */
export function parseChainIdFromMetaValue(id: unknown): number | null {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string" && id.trim()) {
    const n = parseInt(id.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function chainIdFromMeta(m: Record<string, unknown>): number | null {
  const ch = m.chain;
  if (!ch || typeof ch !== "object") return null;
  const chain = ch as Record<string, unknown>;
  const contracts = chain.contracts;
  if (contracts && typeof contracts === "object") {
    const legacy = parseChainIdFromMetaValue(
      (contracts as Record<string, unknown>).chain_id_configured,
    );
    if (legacy != null) return legacy;
  }
  return parseChainIdFromMetaValue(chain.chain_id);
}
