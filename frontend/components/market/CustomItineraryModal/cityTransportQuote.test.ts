import { describe, expect, it } from "vitest";
import {
  cityTransportCapacityWarningKey,
  cityTransportFeeForSegment,
  vehiclesNeededForHeadcount,
} from "./cityTransportQuote";

describe("cityTransportQuote", () => {
  it("computes vehicles needed from headcount and capacity", () => {
    expect(vehiclesNeededForHeadcount(1, "sedan")).toBe(1);
    expect(vehiclesNeededForHeadcount(4, "sedan")).toBe(1);
    expect(vehiclesNeededForHeadcount(5, "sedan")).toBe(2);
    expect(vehiclesNeededForHeadcount(6, "suv")).toBe(2);
    expect(vehiclesNeededForHeadcount(9, "van")).toBe(2);
  });

  it("scales city transport fee by vehicle count and days", () => {
    expect(cityTransportFeeForSegment(5, "sedan", 80, 2)).toBe(2 * 80 * 2);
    expect(cityTransportFeeForSegment(3, "suv", 120, 1)).toBe(120);
  });

  it("returns capacity warning i18n keys when headcount exceeds vehicle seats", () => {
    expect(cityTransportCapacityWarningKey(4, "sedan")).toBeNull();
    expect(cityTransportCapacityWarningKey(5, "sedan")).toBe("market_sedanCapacityHint");
    expect(cityTransportCapacityWarningKey(6, "suv")).toBe("market_suvCapacityHint");
    expect(cityTransportCapacityWarningKey(9, "van")).toBe("market_vanCapacityHint");
  });
});
