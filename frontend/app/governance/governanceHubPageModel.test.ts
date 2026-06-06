import { describe, expect, it } from "vitest";
import {
  governanceCountryPoolRootChainSsot,
  governancePoolIsChainReadRow,
  governanceTreasuryErc20PoolRootChainSsot,
  governanceTreasuryPoolRootChainSsot,
} from "./governanceHubPageModel";

describe("governanceHubPageModel · C-GOV-001 type guards", () => {
  it("governancePoolIsChainReadRow requires data_source chain_read", () => {
    expect(governancePoolIsChainReadRow({ status: "ok", data_source: "chain_read" })).toBe(true);
    expect(governancePoolIsChainReadRow({ status: "ok", data_source: "placeholder" })).toBe(false);
    expect(governancePoolIsChainReadRow(null)).toBe(false);
  });

  it("country pool SSOT guard requires chain_read + is_chain_ssot + non-empty hex", () => {
    expect(
      governanceCountryPoolRootChainSsot({
        status: "ok",
        country_pool_data_source: "chain_read",
        country_pool_is_chain_ssot: true,
        country_pool: "0x01",
      })
    ).toBe(true);
    expect(
      governanceCountryPoolRootChainSsot({
        status: "ok",
        country_pool_data_source: "chain_read",
        country_pool_is_chain_ssot: false,
        country_pool: "0x01",
      })
    ).toBe(false);
    expect(
      governanceCountryPoolRootChainSsot({
        status: "ok",
        country_pool_data_source: "placeholder",
        country_pool_is_chain_ssot: true,
        country_pool: "0x01",
      })
    ).toBe(false);
  });

  it("treasury native SSOT guard requires chain_read + is_chain_ssot + non-empty wei hex", () => {
    expect(
      governanceTreasuryPoolRootChainSsot({
        status: "ok",
        treasury_pool_data_source: "chain_read",
        treasury_pool_is_chain_ssot: true,
        treasury_pool: "0xabc",
      })
    ).toBe(true);
    expect(
      governanceTreasuryPoolRootChainSsot({
        status: "ok",
        treasury_pool_data_source: "chain_read",
        treasury_pool_is_chain_ssot: true,
        treasury_pool: "",
      })
    ).toBe(false);
  });

  it("treasury erc20 SSOT guard requires chain_read + is_chain_ssot + non-empty hex", () => {
    expect(
      governanceTreasuryErc20PoolRootChainSsot({
        status: "ok",
        treasury_erc20_pool_data_source: "chain_read",
        treasury_erc20_pool_is_chain_ssot: true,
        treasury_erc20_pool: "0x10",
      })
    ).toBe(true);
    expect(
      governanceTreasuryErc20PoolRootChainSsot({
        status: "ok",
        treasury_erc20_pool_data_source: "chain_read",
        treasury_erc20_pool_is_chain_ssot: true,
        treasury_erc20_pool: "   ",
      })
    ).toBe(false);
  });
});
