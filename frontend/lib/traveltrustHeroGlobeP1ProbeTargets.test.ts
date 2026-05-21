import { describe, expect, it } from "vitest";
import { listHeroGlobeP1PinProbeFractions } from "./traveltrustHeroGlobeP1ProbeTargets";

describe("traveltrustHeroGlobeP1ProbeTargets", () => {
  it("lists 10 phase1 regions with normalized canvas fractions", () => {
    const targets = listHeroGlobeP1PinProbeFractions();
    expect(targets).toHaveLength(10);
    expect(targets[0]?.regionId).toBe("cn");
    for (const t of targets) {
      expect(t.fx).toBeGreaterThan(0.02);
      expect(t.fx).toBeLessThan(0.98);
      expect(t.fy).toBeGreaterThan(0.05);
      expect(t.fy).toBeLessThan(0.95);
    }
  });
});
