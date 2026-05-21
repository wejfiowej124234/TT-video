import { describe, expect, it } from "vitest";
import {
  resolveCinematicCanvasCyanMul,
  resolveCinematicCorridorRingReveal,
  resolveCinematicEnvironmentOpacity,
  resolveCinematicEnvironmentVisible,
  resolveCinematicGlobeDecorFade,
  resolveCinematicScrollWarmBandPeak,
  TRAVELTRUST_CINEMATIC_L5_SPRINT_ID,
  TT_CINEMATIC_PAGE_L5,
} from "./traveltrustCinematicPageL5";

describe("traveltrustCinematicPageL5", () => {
  it("exports sprint id", () => {
    expect(TRAVELTRUST_CINEMATIC_L5_SPRINT_ID).toBe("TT-CINEMATIC-L5-2026-05");
  });

  it("fades environment on hero scroll", () => {
    expect(resolveCinematicEnvironmentOpacity(0, 0)).toBe(1);
    expect(resolveCinematicEnvironmentOpacity(0.7, 0.5)).toBeLessThan(0.2);
    expect(resolveCinematicEnvironmentVisible(0.75, 0.6)).toBe(false);
  });

  it("attenuates canvas cyan scrim on scroll", () => {
    expect(resolveCinematicCanvasCyanMul(0, 0)).toBeCloseTo(0.12, 2);
    expect(resolveCinematicCanvasCyanMul(0.5, 0.4)).toBeLessThan(0.35);
  });

  it("fades globe decor on hero scroll", () => {
    expect(resolveCinematicGlobeDecorFade(0)).toBe(1);
    expect(resolveCinematicGlobeDecorFade(0.8)).toBeLessThan(0.2);
  });

  it("reveals corridor ring during handoff", () => {
    expect(resolveCinematicCorridorRingReveal(0, 0)).toBe(0);
    expect(resolveCinematicCorridorRingReveal(0.5, 0.55)).toBeGreaterThan(0.35);
    expect(resolveCinematicCorridorRingReveal(0.5, 0.55, true)).toBeLessThan(
      resolveCinematicCorridorRingReveal(0.5, 0.55, false),
    );
  });

  it("defines hub markers and route labels", () => {
    expect(TT_CINEMATIC_PAGE_L5.theaterCorridorRing.hubMarkers.length).toBeGreaterThanOrEqual(4);
    expect(TT_CINEMATIC_PAGE_L5.routeArcSvg.labels).toHaveLength(3);
    expect(TT_CINEMATIC_PAGE_L5.routeArcSvg.stop100).not.toContain("110, 105");
    expect(TT_CINEMATIC_PAGE_L5.bloom.intensity).toBeGreaterThan(0);
    expect(TT_CINEMATIC_PAGE_L5.heroTrustChip.itemClass).toContain("ref-sun");
    expect(TT_CINEMATIC_PAGE_L5.horizonArc.gradStop0).toContain("252");
    expect(TT_CINEMATIC_PAGE_L5.heroGlobe.tierGlow.S).toBe("#fca47c");
    expect(TT_CINEMATIC_PAGE_L5.heroGlobe.arc.pulseAccent).toContain("ffd");
  });

  it("peaks warm scroll handoff band mid-page", () => {
    expect(resolveCinematicScrollWarmBandPeak(0, 0)).toBe(0);
    expect(resolveCinematicScrollWarmBandPeak(0.4, 0.5)).toBeGreaterThan(0.35);
    expect(resolveCinematicScrollWarmBandPeak(0.4, 0.85)).toBeLessThan(0.2);
  });
});
