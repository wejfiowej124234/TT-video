import { describe, expect, it } from "vitest";
import { pickMetaTransparencySlice } from "./buildTransparencyBundle";

describe("pickMetaTransparencySlice", () => {
  it("extracts chain_id and indexer hash prefix", () => {
    const slice = pickMetaTransparencySlice({
      api_version: "1",
      service: "api",
      chain: { chain_id: 11155111, contracts: { Escrow: "0xabc" } },
      indexer: { memory: { last_block_hash_prefix: "0xdead" } },
    });
    expect(slice.api_version).toBe("1");
    expect(slice.chain).toEqual({ chain_id: 11155111, contracts_config_present: true });
    expect(slice.indexer_last_block_hash_prefix).toBe("0xdead");
  });
});
