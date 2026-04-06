import { describe, it, expect } from "vitest";
import { formatEvenSplitAmount, resolveEvenSplitPerDay } from "./itineraryEvenSplit";

describe("itineraryEvenSplit", () => {
  it("resolveEvenSplitPerDay returns null for invalid inputs", () => {
    expect(resolveEvenSplitPerDay(null, 2)).toBeNull();
    expect(resolveEvenSplitPerDay(undefined, 2)).toBeNull();
    expect(resolveEvenSplitPerDay(100, 0)).toBeNull();
    expect(resolveEvenSplitPerDay(-1, 2)).toBeNull();
    expect(resolveEvenSplitPerDay(NaN, 2)).toBeNull();
  });

  it("accepts numeric string total_budget", () => {
    expect(resolveEvenSplitPerDay("200", 2)).toBe(100);
  });

  it("formatEvenSplitAmount rounds to 2 decimals", () => {
    expect(formatEvenSplitAmount(100)).toBe("100.00");
    expect(formatEvenSplitAmount(33.333)).toBe("33.33");
  });
});
