import { describe, expect, it } from "vitest";

import { CHAIN_CONTRACTS_META_TOP_KEYS } from "@/lib/apiClient/meta/topKeysChainAndDomains";
import { chainIdFromMeta, parseChainIdFromMetaValue } from "@/lib/governanceChainMeta";
import {
  assertChainContractsTopKeys759,
  platformFeeRecipientFromMetaContracts,
} from "@/lib/metaChainContracts759";

describe("parseChainIdFromMetaValue", () => {
  it("parses string chain_id from API", () => {
    expect(parseChainIdFromMetaValue("31337")).toBe(31337);
  });

  it("parses numeric chain_id", () => {
    expect(parseChainIdFromMetaValue(11155111)).toBe(11155111);
  });

  it("returns null for invalid", () => {
    expect(parseChainIdFromMetaValue(null)).toBeNull();
    expect(parseChainIdFromMetaValue("")).toBeNull();
  });
});

describe("chainIdFromMeta", () => {
  it("reads string chain.chain_id (759 API)", () => {
    expect(chainIdFromMeta({ chain: { chain_id: "31337" } })).toBe(31337);
  });

  it("falls back to legacy contracts.chain_id_configured", () => {
    expect(
      chainIdFromMeta({
        chain: { chain_id: "31337", contracts: { chain_id_configured: 11155111 } },
      }),
    ).toBe(11155111);
  });
});

describe("platformFeeRecipientFromMetaContracts", () => {
  it("prefers fee_router_address", () => {
    expect(
      platformFeeRecipientFromMetaContracts({
        fee_router_address: "0x1111111111111111111111111111111111111111",
        escrow_platform_fee_recipient: "0x2222222222222222222222222222222222222222",
      }),
    ).toBe("0x1111111111111111111111111111111111111111");
  });

  it("falls back to escrow_platform_fee_recipient", () => {
    expect(
      platformFeeRecipientFromMetaContracts({
        escrow_platform_fee_recipient: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    ).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });
});

describe("assertChainContractsTopKeys759", () => {
  it("accepts API 759 top_keys order", () => {
    const contracts: Record<string, unknown> = {
      chain_contracts_top_keys: [...CHAIN_CONTRACTS_META_TOP_KEYS],
    };
    expect(() => assertChainContractsTopKeys759(contracts)).not.toThrow();
  });
});
