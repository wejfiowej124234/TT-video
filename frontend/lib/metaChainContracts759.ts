/** 759：`GET /meta` `chain.contracts` · 759 十四键 SSOT（与 API `CHAIN_CONTRACTS_META_TOP_KEYS` / Vitest / Playwright 同源）。 */
import { CHAIN_CONTRACTS_META_TOP_KEYS } from "@/lib/apiClient/meta/topKeysChainAndDomains";

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

/** ① Anvil 本地栈严格门禁：须为 40 位 hex 的协议地址键（治理栈键可为 null）。 */
export const CHAIN_CONTRACTS_759_STRICT_ANVIL_ADDR_KEYS = [
  "guide_staking_address",
  "staking_provider_address",
  "fee_router_address",
  "governance_token_address",
  "registry_address",
  "escrow_factory_address",
  "region_steward_stake_pool_address",
] as const;

export function assertEvmAddress759(label: string, v: unknown): asserts v is string {
  if (typeof v !== "string" || !ADDR_RE.test(v)) {
    throw new Error(`${label}: expected 0x + 40 hex, got ${JSON.stringify(v)}`);
  }
}

export function assertChainContractsTopKeys759(contracts: Record<string, unknown>): void {
  const keys = contracts.chain_contracts_top_keys;
  if (!Array.isArray(keys)) {
    throw new Error(
      "GET /meta: chain.contracts.chain_contracts_top_keys must be a JSON array (759)",
    );
  }
  const got = keys.map((k) => String(k));
  const exp = [...CHAIN_CONTRACTS_META_TOP_KEYS];
  if (got.length !== exp.length || !got.every((k, i) => k === exp[i])) {
    throw new Error(
      `GET /meta: chain_contracts_top_keys order mismatch (759): got ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`,
    );
  }
}

/** 759 严格：ChainConfig 挂载 + 十四键机读 + ① 本地核心协议地址。 */
export function assertMetaChainContracts759Strict(contracts: Record<string, unknown>): void {
  assertChainContractsTopKeys759(contracts);
  for (const key of CHAIN_CONTRACTS_759_STRICT_ANVIL_ADDR_KEYS) {
    assertEvmAddress759(`chain.contracts.${key}`, contracts[key]);
  }
  if (process.env.PLAYWRIGHT_REQUIRE_GOVERNANCE_STACK === "1") {
    assertEvmAddress759("chain.contracts.governor_address", contracts.governor_address);
    assertEvmAddress759("chain.contracts.timelock_address", contracts.timelock_address);
  }
}

/** B-095 / FeeRouter：`fee_router_address` 优先，兼容旧 `escrow_platform_fee_recipient`。 */
export function platformFeeRecipientFromMetaContracts(
  contracts: Record<string, unknown> | null | undefined,
): string | null {
  if (!contracts || typeof contracts !== "object") return null;
  const fee = contracts.fee_router_address;
  if (typeof fee === "string" && fee.trim() && ADDR_RE.test(fee.trim())) {
    return fee.trim();
  }
  const legacy = contracts.escrow_platform_fee_recipient;
  if (typeof legacy === "string" && legacy.trim() && ADDR_RE.test(legacy.trim())) {
    return legacy.trim();
  }
  return null;
}
