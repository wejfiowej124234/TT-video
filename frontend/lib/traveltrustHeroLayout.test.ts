import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TT_HERO_CONTENT_SHELL_CLASS,
  TT_HERO_GLOBE_VIEWPORT_CLASS,
} from "./traveltrustHeroLayout";
import {
  resolveHeroGlobeOpacityExit,
  resolveHeroGlobeScaleExit,
  resolveHeroSplitLayoutBlend,
  TT_HERO_SPLIT_CAMERA_X,
  TT_HERO_SPLIT_GLOBE_X,
} from "./traveltrustHeroCinematicAlign";

describe("traveltrustHeroLayout (TT-PH1-163)", () => {
  it("includes narrow-viewport safe tokens", () => {
    expect(TT_HERO_CONTENT_SHELL_CLASS).toContain("max-[390px]");
    expect(TT_HERO_CONTENT_SHELL_CLASS).toContain("max-w-7xl");
    expect(TT_HERO_CONTENT_SHELL_CLASS).toContain("lg:grid");
    expect(TT_HERO_CONTENT_SHELL_CLASS).toContain("grid-template-areas");
    expect(TT_HERO_GLOBE_VIEWPORT_CLASS).toContain("grid-area:globe");
    expect(TT_HERO_GLOBE_VIEWPORT_CLASS).toContain("max-[390px]");
    expect(TT_HERO_CONTENT_SHELL_CLASS).toContain("safe-area-inset-bottom");
    expect(TT_HERO_SPLIT_CAMERA_X).toBeGreaterThan(0);
    expect(TT_HERO_SPLIT_GLOBE_X).toBeLessThan(0);
  });

  it("documents hero scroll hint on copy card (TT-PH1-27)", () => {
    const hero = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../components/traveltrust/cinematic/TravelTrustCinematicHero.tsx"),
      "utf8",
    );
    expect(hero).toContain('data-tt-traveltrust-hero-scroll-hint="outside-card"');
    expect(hero).not.toContain('data-tt-traveltrust-hero-scroll-hint="copy-card"');
    expect(hero).not.toContain('data-tt-traveltrust-hero-scroll-hint="globe"');
  });

  it("stages globe scale before opacity exit (smooth handoff to theater)", () => {
    expect(resolveHeroGlobeScaleExit(0.55)).toBeGreaterThan(0.2);
    expect(resolveHeroGlobeOpacityExit(0.55)).toBe(0);
    expect(resolveHeroGlobeScaleExit(0.8)).toBeGreaterThan(resolveHeroGlobeOpacityExit(0.8));
    expect(resolveHeroGlobeOpacityExit(0.98)).toBeGreaterThan(0.85);
  });

  it("hero split blend eases across scroll (no 0.45 hard cut)", () => {
    expect(resolveHeroSplitLayoutBlend(0, false)).toBe(1);
    expect(resolveHeroSplitLayoutBlend(0.5, false)).toBeGreaterThan(0.2);
    expect(resolveHeroSplitLayoutBlend(0.5, false)).toBeLessThan(1);
    expect(resolveHeroSplitLayoutBlend(0.95, false)).toBeLessThan(0.15);
    expect(resolveHeroSplitLayoutBlend(1, false)).toBe(0);
    expect(resolveHeroSplitLayoutBlend(0.5, true)).toBe(0);
  });
});
