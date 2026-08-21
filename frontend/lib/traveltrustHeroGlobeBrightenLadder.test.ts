import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID,
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,
  TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER,
  TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE,
  TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL,
  TRAVELTRUST_HERO_GLOBE_SHADOW_FILL,
} from "./traveltrustHeroGlobeBrighten";
import { HERO_GLOBE_BRIGHTEN_LADDER } from "./traveltrustHeroGlobeBrightenLadder";

describe("traveltrustHeroGlobeBrightenLadder", () => {
  it("active step 8 applies 7b glint tighten for pacific-facing rotation", () => {
    expect(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP).toBe(8);
    expect(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID).toBe(HERO_GLOBE_BRIGHTEN_LADDER[8].id);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintPeakAlpha).toBe(0.08);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintRadiusScale).toBe(0.28);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.saturate).toBe(0.91);
    expect(HERO_GLOBE_BRIGHTEN_LADDER[7].oceanSunGlintPeakAlpha).toBe(0.085);
    expect(HERO_GLOBE_BRIGHTEN_LADDER[7].oceanSunGlintRadiusScale).toBe(0.3);
  });

  it("keeps frozen brightness/sepia at active step", () => {
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.brightness).toBe(1.02);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.sepia).toBe(0.04);
  });
});
