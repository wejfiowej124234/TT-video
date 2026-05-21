import { describe, expect, it } from "vitest";
import { formatHeroGlobeOpticalPercent } from "./traveltrustHeroGlobeAlign";

describe("traveltrustHeroGlobeAlign", () => {
  it("clamps optical center ratio into desktop split band", () => {
    expect(formatHeroGlobeOpticalPercent(0.34)).toBe("34.00%");
    expect(formatHeroGlobeOpticalPercent(0.02)).toBe("18.00%");
    expect(formatHeroGlobeOpticalPercent(0.9)).toBe("40.00%");
  });
});
