import { describe, expect, it } from "vitest";
import { layoutHeroGlobeLabels } from "@/lib/traveltrustHeroGlobeLabelLayout";

describe("traveltrustHeroGlobeLabelLayout", () => {
  it("separates overlapping labels with distinct offsets", () => {
    const layout = layoutHeroGlobeLabels([
      { id: "a", leftPct: 50, topPct: 40, tier: "S" },
      { id: "b", leftPct: 51, topPct: 41, tier: "A" },
    ]);
    expect(layout.a.offsetPx.dy).toBe(0);
    expect(layout.b.offsetPx.dy).toBeLessThan(0);
    expect(layout.a.baseOpacity).toBeGreaterThan(layout.b.baseOpacity);
  });
});
