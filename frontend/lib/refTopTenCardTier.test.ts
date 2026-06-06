import { describe, expect, it } from "vitest";
import { refTopTenCardTier } from "@/lib/refTopTenCardTier";
import { refTopThreeTier } from "@/lib/refTopThreeStyles";

describe("refTopTenCardTier", () => {
  it("uses top3 tiers for ranks 1–3", () => {
    expect(refTopTenCardTier(1, "traveler").rankText).toBe(refTopThreeTier(1, "traveler").rankText);
    expect(refTopTenCardTier(3, "guide").shell).toBe(refTopThreeTier(3, "guide").shell);
  });

  it("uses ghost row tier for ranks 4–10", () => {
    const row = refTopTenCardTier(7, "traveler");
    expect(row.shell).toContain("border-transparent");
    expect(row.shell).not.toBe(refTopThreeTier(2, "traveler").shell);
  });
});
