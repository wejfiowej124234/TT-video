import { describe, expect, it } from "vitest";
import {
  buildStewardAdmissionQuoteDisplay,
  resolveStewardAdmissionPrimaryJurisdiction,
} from "./stewardAdmissionQuoteDisplayModel";

describe("stewardAdmissionQuoteDisplayModel", () => {
  it("resolveStewardAdmissionPrimaryJurisdiction picks first jurisdiction", () => {
    expect(resolveStewardAdmissionPrimaryJurisdiction(["CN", "US"])).toBe("CN");
    expect(resolveStewardAdmissionPrimaryJurisdiction([])).toBe("CN");
  });

  it("buildStewardAdmissionQuoteDisplay shows list price compare for local zero", () => {
    const display = buildStewardAdmissionQuoteDisplay({
      quote: {
        role: "region_steward",
        sku: "region_steward_onboarding_default",
        currency: "USDC",
        amountMinor: 0,
        amountLabel: "0.00 USDC",
        feeScheduleVersion: "fee_schedule_v1",
        expiresAt: null,
        implementationStatus: "stub",
        isStub: true,
      },
      primaryJurisdiction: "CN",
    });
    expect(display.tier).toBe("S");
    expect(display.showListPriceCompare).toBe(true);
    expect(display.listPriceLabel).toBe("499.00 USDC");
  });
});
