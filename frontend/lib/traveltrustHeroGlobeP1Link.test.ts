import { describe, expect, it, beforeEach } from "vitest";
import {
  buildTraveltrustPlanTripHrefWithRegion,
  buildTraveltrustStartHash,
  navigateToStartWithRegion,
  getHeroGlobeP1FocusedRegion,
  parseStartHashParams,
  parseStartRegionFromHash,
  parseStartStepFromHash,
  writeTraveltrustStartHash,
  resolveHeroGlobeActiveRegionId,
  resolveHeroGlobeP1DefaultRegion,
  setHeroGlobeP1FocusedRegion,
  setHeroGlobeP1StartPrefill,
  setHeroGlobeP1StartContext,
} from "./traveltrustHeroGlobeP1Link";

describe("traveltrustHeroGlobeP1Link", () => {
  beforeEach(() => {
    setHeroGlobeP1FocusedRegion(null);
    setHeroGlobeP1StartContext(null, null);
  });

  it("resolveHeroGlobeP1DefaultRegion maps camera bias", () => {
    expect(resolveHeroGlobeP1DefaultRegion("atlantic")).toBe("us");
    expect(resolveHeroGlobeP1DefaultRegion("asia")).toBe("cn");
    expect(resolveHeroGlobeP1DefaultRegion("any")).toBe("cn");
  });

  it("resolveHeroGlobeActiveRegionId prefers DOM hover over P1 focus", () => {
    setHeroGlobeP1FocusedRegion("fr");
    expect(resolveHeroGlobeActiveRegionId("cn")).toBe("cn");
    expect(resolveHeroGlobeActiveRegionId(null)).toBe("fr");
  });

  it("buildTraveltrustPlanTripHrefWithRegion appends region + default step on hash", () => {
    expect(buildTraveltrustPlanTripHrefWithRegion("#start", "th")).toBe("#start?region=th&step=plan");
    expect(buildTraveltrustPlanTripHrefWithRegion("#start", null)).toBe("#start");
  });

  it("parseStartRegionFromHash reads region from hash query", () => {
    expect(parseStartRegionFromHash("start?region=jp")).toBe("jp");
    expect(parseStartRegionFromHash("start")).toBeNull();
    expect(parseStartRegionFromHash("start?region=bad")).toBeNull();
  });

  it("parseStartStepFromHash reads step from hash query", () => {
    expect(parseStartStepFromHash("start?region=cn&step=match")).toBe("match");
    expect(parseStartStepFromHash("start?region=cn")).toBeNull();
    expect(parseStartStepFromHash("start?step=bad")).toBeNull();
  });

  it("buildTraveltrustStartHash composes region and step", () => {
    expect(buildTraveltrustStartHash({ region: "sg", step: "escrow" })).toBe("#start?region=sg&step=escrow");
    expect(parseStartHashParams("#start?region=sg&step=escrow")).toEqual({ region: "sg", step: "escrow" });
  });

  it("setHeroGlobeP1FocusedRegion is readable", () => {
    setHeroGlobeP1FocusedRegion("sg");
    expect(getHeroGlobeP1FocusedRegion()).toBe("sg");
  });

  it("navigateToStartWithRegion sets hash in browser", () => {
    navigateToStartWithRegion("jp");
    expect(window.location.hash).toBe("#start?region=jp&step=plan");
  });

  it("writeTraveltrustStartHash updates location hash", () => {
    window.location.hash = "start?region=th&step=plan";
    writeTraveltrustStartHash({ region: "th", step: "escrow" });
    expect(window.location.hash).toBe("#start?region=th&step=escrow");
  });
});
