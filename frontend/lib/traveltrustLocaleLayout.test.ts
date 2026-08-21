import { describe, expect, it } from "vitest";
import { getTraveltrustTextDirection, truncateTraveltrustNavLabel } from "./traveltrustLocaleLayout";

describe("traveltrustLocaleLayout", () => {
  it("defaults zh/en to ltr", () => {
    expect(getTraveltrustTextDirection("zh")).toBe("ltr");
    expect(getTraveltrustTextDirection("en")).toBe("ltr");
  });

  it("truncates long nav labels", () => {
    const long = "Stablecoin-Gateway-Vorschau";
    expect(truncateTraveltrustNavLabel(long, 18).endsWith("…")).toBe(true);
    expect(truncateTraveltrustNavLabel("短", 18)).toBe("短");
  });
});
