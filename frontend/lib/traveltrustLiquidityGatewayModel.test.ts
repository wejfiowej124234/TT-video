import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS,
  TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL,
  traveltrustCyclePayStablecoin,
  traveltrustTtgAcquirePreviewPair,
} from "./traveltrustLiquidityGatewayModel";

describe("traveltrustLiquidityGatewayModel", () => {
  it("escrow allowlist includes USDC and USDT", () => {
    expect(TRAVELTRUST_ESCROW_SETTLEMENT_STABLECOINS).toEqual(["USDC", "USDT"]);
  });

  it("preview pair is stablecoin to TTG, not stable-to-stable", () => {
    expect(traveltrustTtgAcquirePreviewPair("USDC")).toEqual({ from: "USDC", to: "TTG" });
    expect(traveltrustTtgAcquirePreviewPair("USDT")).toEqual({ from: "USDT", to: "TTG" });
    expect(TRAVELTRUST_GOVERNANCE_TOKEN_SYMBOL).toBe("TTG");
  });

  it("cycles pay stablecoin only", () => {
    expect(traveltrustCyclePayStablecoin("USDC")).toBe("USDT");
    expect(traveltrustCyclePayStablecoin("USDT")).toBe("USDC");
  });
});
