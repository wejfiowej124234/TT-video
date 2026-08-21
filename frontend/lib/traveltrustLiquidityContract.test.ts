import { describe, expect, it } from "vitest";
import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "./traveltrustPageBrief";
import {
  traveltrustLiquidityContractFromBrief,
  TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK,
} from "./traveltrustLiquidityContract";

describe("traveltrustLiquidityContract", () => {
  it("dev fallback matches API liquidity_contract shape", () => {
    expect(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK.liquidity_contract).toEqual(
      TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK,
    );
    expect(TRAVELTRUST_LIQUIDITY_CONTRACT_DEV_FALLBACK.quote_path).toBe(
      "/api/v1/governance/ttg-exchange/quote",
    );
  });

  it("parses brief liquidity_contract", () => {
    const c = traveltrustLiquidityContractFromBrief(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
    expect(c.pair_type).toBe("stablecoin_to_governance_token");
    expect(c.receive_symbol).toBe("TTG");
    expect(c.pay_stablecoins).toEqual(["USDC"]);
  });
});
