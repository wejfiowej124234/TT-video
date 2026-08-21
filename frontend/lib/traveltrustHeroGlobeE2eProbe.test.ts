import { describe, expect, it, beforeEach } from "vitest";
import {
  clearHeroGlobeFocusForProbe,
  registerGlobeCanvasHoverProbeClear,
} from "@/lib/traveltrustHeroGlobeE2eProbe";
import {
  getHeroGlobeP1FocusedRegion,
  setHeroGlobeP1FocusedRegion,
} from "@/lib/traveltrustHeroGlobeP1Link";

describe("traveltrustHeroGlobeE2eProbe", () => {
  beforeEach(() => {
    setHeroGlobeP1FocusedRegion(null);
    registerGlobeCanvasHoverProbeClear(null);
  });

  it("clearHeroGlobeFocusForProbe clears P1 focus and registered canvas hover", () => {
    let hover = "cn";
    registerGlobeCanvasHoverProbeClear(() => {
      hover = "";
    });
    setHeroGlobeP1FocusedRegion("cn");
    clearHeroGlobeFocusForProbe();
    expect(getHeroGlobeP1FocusedRegion()).toBeNull();
    expect(hover).toBe("");
  });
});
