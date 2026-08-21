import { describe, expect, it } from "vitest";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import {
  TT_HERO_SPLIT_GLOBE_SCALE_MUL,
  TT_HERO_SPLIT_GLOBE_X,
} from "@/lib/traveltrustHeroCinematicAlign";
import { TT_HERO_GLOBE_OPTICAL_FALLBACK } from "@/lib/traveltrustHeroGlobeAlign";
import {
  TRAVELTRUST_HERO_GLOBE_ARC_MAX_COUNT,
  TRAVELTRUST_HERO_GLOBE_ARC_NON_PRIMARY_OPACITY_MUL,
} from "@/lib/traveltrustGlobeHeroTuning";
import {
  TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS,
  TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER,
} from "@/lib/traveltrustHeroGlobeBrighten";
import {
  TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL,
  TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX,
  TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL,
  TT_HERO_L5_DIRECTOR_GLOBE_X,
  TT_HERO_L5_DIRECTOR_NORTH_AFRICA_GRADE,
  TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK,
  TRAVELTRUST_HERO_L5_DIRECTOR_FINAL_PASS_ID,
} from "./traveltrustHeroL5DirectorFinalPass";

describe("traveltrustHeroL5DirectorFinalPass", () => {
  it("exposes director pass id and lens tokens", () => {
    expect(TRAVELTRUST_HERO_L5_DIRECTOR_FINAL_PASS_ID).toMatch(/DIRECTOR-FINAL-PASS/);
    expect(TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL).toBeCloseTo(0.84 * 1.06, 4);
    expect(TT_HERO_L5_DIRECTOR_GLOBE_X).toBeLessThan(-0.36);
    expect(TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK).toBe("24%");
    expect(TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX).toBeGreaterThanOrEqual(24);
    expect(TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX).toBeLessThanOrEqual(32);
  });

  it("wires lens tokens into hero align and arc tuning", () => {
    expect(TT_HERO_SPLIT_GLOBE_SCALE_MUL).toBe(TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL);
    expect(TT_HERO_SPLIT_GLOBE_X).toBe(TT_HERO_L5_DIRECTOR_GLOBE_X);
    expect(TT_HERO_GLOBE_OPTICAL_FALLBACK).toBe(TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK);
    expect(TRAVELTRUST_HERO_GLOBE_ARC_MAX_COUNT).toBe(8);
    expect(TRAVELTRUST_HERO_GLOBE_ARC_NON_PRIMARY_OPACITY_MUL).toBe(
      TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL,
    );
  });

  it("keeps Pass A global filter frozen while north africa regional grade is set", () => {
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS).toBe(1.3);
    expect(TT_CINEMATIC_GLOBE_VISUAL.earthDisplayBrightness).toBe(1.3);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.sepia).toBe(0.04);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.saturate).toBe(0.9);
    expect(TT_HERO_L5_DIRECTOR_NORTH_AFRICA_GRADE.multiplyAlpha).toBeGreaterThanOrEqual(0.1);
    expect(TT_HERO_L5_DIRECTOR_NORTH_AFRICA_GRADE.multiplyAlpha).toBeLessThanOrEqual(0.15);
  });

  it("targets weak corridor opacity band against travelArcOpacity", () => {
    const weak = TT_CINEMATIC_GLOBE_VISUAL.travelArcOpacity * TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL;
    expect(weak).toBeGreaterThanOrEqual(0.28);
    expect(weak).toBeLessThanOrEqual(0.35);
  });
});
