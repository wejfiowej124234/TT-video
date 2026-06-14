import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS,
  TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL,
  traveltrustCyclePayStablecoin,
  traveltrustTtgAcquirePreviewPair,
} from "./traveltrustLiquidityGatewayModel";

describe("traveltrustLiquidityGatewayModel", () => {
  it("escrow allowlist is USDC only (01 settlement SSOT)", () => {
    expect(TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS).toEqual(["USDC"]);
  });

  it("preview pair is USDC to TTG, not stable-to-stable", () => {
    expect(traveltrustTtgAcquirePreviewPair("USDC")).toEqual({ from: "USDC", to: "TTG" });
    expect(TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL).toBe("TTG");
  });

  it("cycle pay stablecoin is identity under single-coin SSOT", () => {
    expect(traveltrustCyclePayStablecoin("USDC")).toBe("USDC");
  });
});
