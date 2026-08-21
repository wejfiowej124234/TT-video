import { describe, expect, it } from "vitest";
import { traveltrustSectionMotionProps } from "./traveltrustSectionMotion";

describe("traveltrustSectionMotion", () => {
  it("returns distinct motion presets per section", () => {
    const theater = traveltrustSectionMotionProps("theater", false);
    const liquidity = traveltrustSectionMotionProps("liquidity", false);
    const unlock = traveltrustSectionMotionProps("unlock", false);
    expect(theater.initial).not.toEqual(liquidity.initial);
    expect(unlock.initial).toEqual(liquidity.initial);
    const theaterDur = (theater.transition as { duration?: number }).duration;
    const liquidityDur = (liquidity.transition as { duration?: number }).duration;
    expect(theaterDur).not.toBe(liquidityDur);
  });

  it("disables motion when reduced", () => {
    const trust = traveltrustSectionMotionProps("trust", true);
    expect(trust.initial).toBe(false);
    expect(trust.whileInView).toBeUndefined();
  });
});
