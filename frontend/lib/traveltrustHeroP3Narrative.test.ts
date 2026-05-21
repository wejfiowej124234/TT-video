import { describe, expect, it } from "vitest";
import {
  buildHeroP3StartStepHref,
  resolveHeroP3NarrativeContext,
} from "./traveltrustHeroP3Narrative";

describe("traveltrustHeroP3Narrative", () => {
  it("resolveHeroP3NarrativeContext maps cn to asia corridor", () => {
    const ctx = resolveHeroP3NarrativeContext("cn", "asia", "match");
    expect(ctx.corridorId).toBe("asia");
    expect(ctx.stepId).toBe("match");
    expect(ctx.regionLabelKey).toBe("traveltrust_phase1_region_cn");
  });

  it("buildHeroP3StartStepHref composes hash without mutating store", () => {
    expect(buildHeroP3StartStepHref("th", "escrow")).toBe("#start?region=th&step=escrow");
  });
});
