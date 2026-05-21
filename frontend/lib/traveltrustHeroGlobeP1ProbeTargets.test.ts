import { describe, expect, it } from "vitest";
import {
  listHeroGlobeP1PinProbeFractions,
  resolveHeroGlobeP1ProbeResetFraction,
} from "@/lib/traveltrustHeroGlobeP1ProbeTargets";

describe("traveltrustHeroGlobeP1ProbeTargets", () => {
  it("resolveHeroGlobeP1ProbeResetFraction stays away from all pin fractions", () => {
    const pins = listHeroGlobeP1PinProbeFractions();
    const reset = resolveHeroGlobeP1ProbeResetFraction();
    expect(reset.fx).toBeGreaterThan(0.05);
    expect(reset.fx).toBeLessThan(0.95);
    expect(reset.fy).toBeGreaterThan(0.05);
    expect(reset.fy).toBeLessThan(0.95);
    for (const p of pins) {
      const d = Math.hypot(reset.fx - p.fx, reset.fy - p.fy);
      expect(d).toBeGreaterThan(0.06);
    }
  });
});
