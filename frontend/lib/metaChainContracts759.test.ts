import { describe, expect, it } from "vitest";

import { CHAIN_CONTRACTS_META_TOP_KEYS } from "@/lib/apiClient/meta/topKeysChainAndDomains";
import { assertMetaChainContracts759Strict } from "@/lib/metaChainContracts759";

describe("assertMetaChainContracts759Strict", () => {
  it("passes for ① Anvil-like contracts snapshot", () => {
    const contracts: Record<string, unknown> = {
      guide_staking_address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      staking_provider_address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      governor_address: null,
      timelock_address: null,
      governance_token_address: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
      fee_router_address: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
      treasury_address: null,
      registry_address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      escrow_factory_address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      region_steward_stake_pool_address: "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf",
      rule: "759",
      chain_contracts_top_keys: [...CHAIN_CONTRACTS_META_TOP_KEYS],
      chain_contracts_top_keys_contract_759: "759",
    };
    expect(() => assertMetaChainContracts759Strict(contracts)).not.toThrow();
  });

  it("rejects old twelve-key staking_address-only shape", () => {
    const contracts: Record<string, unknown> = {
      staking_address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      registry_address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      chain_contracts_top_keys: ["staking_address", "registry_address"],
    };
    expect(() => assertMetaChainContracts759Strict(contracts)).toThrow();
  });
});
