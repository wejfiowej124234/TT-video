import { describe, expect, it } from "vitest";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { resolveGlobeSunEquirectCentroid } from "./traveltrustGlobeSun";
import {
  TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS,
  TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER,
  TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE,
  TRAVELTRUST_HERO_GLOBE_HERO_WARM_INK,
  TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID,
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID,
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,
  TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_MULTIPLY_ALPHA,
  TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_RADIUS_UX,
  TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL,
  TRAVELTRUST_HERO_GLOBE_SHADOW_FILL,
  TRAVELTRUST_HERO_GLOBE_SUN_DAYLIGHT_RIM,
  buildTraveltrustGlobeEarthMapEnhanceFilter,
} from "./traveltrustHeroGlobeBrighten";

describe("traveltrustHeroGlobeBrighten Pass A", () => {
  it("keeps earthDisplayBrightness in 1.30–1.32 band", () => {
    expect(TT_CINEMATIC_GLOBE_VISUAL.earthDisplayBrightness).toBe(
      TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS,
    );
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS).toBe(1.3);
  });

  it("uses Pass A map filter with sun-aligned ocean glint (no equator hotspot band)", () => {
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.sepia).toBe(0.04);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.saturate).toBe(0.91);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintRadiusScale).toBe(0.28);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.equatorCoolMultiplyAlpha).toBeLessThan(0.18);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanHighlightPeakAlpha).toBe(0);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintPeakAlpha).toBeGreaterThan(0.05);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintPeakAlpha).toBeLessThan(0.12);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.southernHemisphereMultiplyAlpha).toBeGreaterThan(0.14);
    const sunUv = resolveGlobeSunEquirectCentroid();
    expect(sunUv.v).not.toBeCloseTo(0.5, 1);
    expect(buildTraveltrustGlobeEarthMapEnhanceFilter()).toContain("saturate(0.91)");
  });

  it("exposes hero sun daylight rim for warm-ink globe", () => {
    expect(TRAVELTRUST_HERO_GLOBE_SUN_DAYLIGHT_RIM.intensity).toBeGreaterThan(0.04);
    expect(TRAVELTRUST_HERO_GLOBE_SUN_DAYLIGHT_RIM.power).toBeGreaterThan(3);
  });

  it("raises warm shadow fill without white sky", () => {
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.hemiIntensity).toBeGreaterThan(1.02);
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.ambIntensity).toBeGreaterThan(0.38);
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.hemiGround).not.toBe("#0c0a09");
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.hemiSky).not.toBe("#ffffff");
  });

  it("applies active ladder step (7b glint) without touching frozen brightness/sepia", () => {
    expect(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP).toBe(8);
    expect(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID).toMatch(/STEP-8-GLINT-7B/);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.brightness).toBe(1.02);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER.sepia).toBe(0.04);
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.hemiIntensity).toBe(1.22);
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.hemiGround).toBe("#322a22");
    expect(TRAVELTRUST_HERO_GLOBE_SHADOW_FILL.ambIntensity).toBe(0.52);
    expect(TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL).toBe(0.85);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.landWarmMultiplyAlpha).toBe(0.12);
    expect(TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE.oceanSunGlintPeakAlpha).toBe(0.08);
    expect(TRAVELTRUST_HERO_GLOBE_SUN_DAYLIGHT_RIM.intensity).toBe(0.07);
    expect(TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_MULTIPLY_ALPHA).toBe(0.168);
    expect(TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_RADIUS_UX).toBe(0.16);
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkCloudOpacityScale).toBe(
      TRAVELTRUST_HERO_GLOBE_HERO_WARM_INK.cloudOpacityScale,
    );
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkCloudOpacityScale).toBe(0.32);
  });

  it("exposes material tune id", () => {
    expect(TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID).toMatch(/MATERIAL-TUNE/);
  });
});
