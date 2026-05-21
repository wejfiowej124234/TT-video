import { describe, expect, it } from "vitest";
import { traveltrustSectionMotionProps } from "./traveltrustSectionMotion";

describe("traveltrustSectionMotion", () => {
  it("returns distinct motion presets per section", () => {
    const theater = traveltrustSectionMotionProps("theater", false);
    const liquidity = traveltrustSectionMotionProps("liquidity", false);
    expect(theater.initial).not.toEqual(liquidity.initial);
    expect(theater.transition.duration).not.toBe(liquidity.transition.duration);
  });

  it("disables motion when reduced", () => {
    const trust = traveltrustSectionMotionProps("trust", true);
    expect(trust.initial).toBe(false);
    expect(trust.whileInView).toBeUndefined();
  });
});
