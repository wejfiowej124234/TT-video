import { describe, expect, it } from "vitest";

import { guideStakeAmountsMismatch } from "./compareGuideStakeAmounts";

describe("guideStakeAmountsMismatch", () => {
  it("returns false when either side is missing", () => {
    expect(guideStakeAmountsMismatch(null, "100")).toBe(false);
    expect(guideStakeAmountsMismatch("100", null)).toBe(false);
  });

  it("returns false within tolerance", () => {
    expect(guideStakeAmountsMismatch("1000", "1000")).toBe(false);
    expect(guideStakeAmountsMismatch("1000.005", "1000")).toBe(false);
  });

  it("returns true when materially different", () => {
    expect(guideStakeAmountsMismatch("1000", "500")).toBe(true);
    expect(guideStakeAmountsMismatch("0", "1000")).toBe(true);
  });
});
