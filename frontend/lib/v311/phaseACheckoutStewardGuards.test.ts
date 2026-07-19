import { describe, expect, it } from "vitest";
import {
  checkoutShowsPrincipalFeeGas,
  forbidMulticountryPhase1Split,
  stewardApplyShowsStakeAndAccessFee,
  V311_PLATFORM_ACCESS_FEE_USDC,
} from "./phaseACheckoutStewardGuards";

describe("Phase A FE-01/02/03 V3.1.1 guards", () => {
  it("FE-01 checkout shows principal + fee", () => {
    expect(
      checkoutShowsPrincipalFeeGas({
        principalUsdc: 1000,
        platformServiceFeeUsdc: 50,
        estimatedGasEth: 0.001,
      })
    ).toBe(true);
    expect(
      checkoutShowsPrincipalFeeGas({
        principalUsdc: 0,
        platformServiceFeeUsdc: 50,
      })
    ).toBe(false);
  });

  it("FE-02 steward apply shows stake + 300k access fee", () => {
    expect(
      stewardApplyShowsStakeAndAccessFee({
        stakeMinimumTtg: 400_000,
        accessFeeUsdc: V311_PLATFORM_ACCESS_FEE_USDC,
      })
    ).toBe(true);
    expect(
      stewardApplyShowsStakeAndAccessFee({
        stakeMinimumTtg: 400_000,
        accessFeeUsdc: 0,
      })
    ).toBe(false);
  });

  it("FE-03 forbids multicountry phase1 split", () => {
    expect(forbidMulticountryPhase1Split(["JP"])).toBe(true);
    expect(forbidMulticountryPhase1Split(["JP", "jp"])).toBe(true);
    expect(forbidMulticountryPhase1Split(["JP", "CN"])).toBe(false);
  });
});
