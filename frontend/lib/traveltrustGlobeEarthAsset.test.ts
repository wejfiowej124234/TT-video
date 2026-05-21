import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_GLOBE_A_CLOSURE_ID,
  TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
  TRAVELTRUST_GLOBE_EARTH_LICENSE_DOC,
  resolveHeroWarmInkGlobeTier,
  resolveTraveltrustGlobeRenderTier,
  TT_CINEMATIC_GLOBE_RENDER_TIER,
  TT_GLOBE_EARTH_SURFACE_RADIUS_MUL,
} from "@/lib/traveltrustGlobeEarthAsset";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";

const publicRoot = join(process.cwd(), "public");

describe("traveltrustGlobeEarthAsset (A closure)", () => {
  it("exports frozen closure id", () => {
    expect(TRAVELTRUST_GLOBE_A_CLOSURE_ID).toBe("TT-GLOBE-A-2026-05");
  });

  it("ships bundled earth JPEG and license doc", () => {
    const jpeg = join(publicRoot, TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH.replace(/^\//, ""));
    const license = join(publicRoot, "media/traveltrust", TRAVELTRUST_GLOBE_EARTH_LICENSE_DOC);
    expect(existsSync(jpeg)).toBe(true);
    expect(existsSync(license)).toBe(true);
  });

  it("ships bundled cloud equirect for L4+ layer", () => {
    const clouds = join(
      publicRoot,
      "media/traveltrust/globe-clouds-equirect-1k.png",
    );
    expect(existsSync(clouds)).toBe(true);
  });

  it("resolves render tiers for desktop / mobile / low", () => {
    expect(resolveTraveltrustGlobeRenderTier({ isMobile: false, lowQuality: false })).toBe(
      TT_CINEMATIC_GLOBE_RENDER_TIER.desktop,
    );
    expect(resolveTraveltrustGlobeRenderTier({ isMobile: true, lowQuality: false }).travelArcLite).toBe(
      true,
    );
    expect(resolveTraveltrustGlobeRenderTier({ isMobile: false, lowQuality: true }).texturedEarth).toBe(
      true,
    );
  });

  it("TT_GLOBE_EARTH_SURFACE_RADIUS_MUL aligns mesh with pins/projection", () => {
    expect(TT_GLOBE_EARTH_SURFACE_RADIUS_MUL).toBe(0.998);
  });

  it("resolveHeroWarmInkGlobeTier enables weak PBR, night lights, and hero cloud scale", () => {
    const base = TT_CINEMATIC_GLOBE_RENDER_TIER.desktop;
    const hero = resolveHeroWarmInkGlobeTier(base);
    expect(hero.texturedEarth).toBe(true);
    expect(hero.litEarth).toBe(true);
    expect(hero.nightLights).toBe(true);
    expect(hero.cloudLayer).toBe(true);
    expect(hero.earthSegments).toBe(base.earthSegments);
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkCloudOpacityScale).toBeGreaterThanOrEqual(0.28);
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkCloudOpacityScale).toBeLessThanOrEqual(0.35);
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkNightLightsStrength).toBeGreaterThanOrEqual(0.12);
    expect(TT_CINEMATIC_GLOBE_VISUAL.heroWarmInkNightLightsStrength).toBeLessThanOrEqual(0.18);
  });
});
