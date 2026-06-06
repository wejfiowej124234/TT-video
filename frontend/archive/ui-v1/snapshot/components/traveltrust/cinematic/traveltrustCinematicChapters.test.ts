import { describe, expect, it } from "vitest";
import {
  blendChapterPresets,
  resolveTravelTrustBlendedChapterPreset,
  TT_CINEMATIC_CHAPTER_PRESETS,
} from "./traveltrustCinematicChapters";

describe("traveltrustCinematicChapters", () => {
  it("blends hero→theater without preset jumps in the overlap band", () => {
    const atStart = resolveTravelTrustBlendedChapterPreset(0, 0);
    expect(atStart.z).toBe(TT_CINEMATIC_CHAPTER_PRESETS.hero.z);

    const mid = resolveTravelTrustBlendedChapterPreset(0.68, 0.1);
    expect(mid.z).toBeGreaterThan(TT_CINEMATIC_CHAPTER_PRESETS.hero.z);
    expect(mid.z).toBeLessThan(TT_CINEMATIC_CHAPTER_PRESETS.theater.z);

    const theater = resolveTravelTrustBlendedChapterPreset(0.9, 0.2);
    expect(theater.z).toBe(TT_CINEMATIC_CHAPTER_PRESETS.theater.z);
  });

  it("blendChapterPresets interpolates all axes", () => {
    const blended = blendChapterPresets(
      TT_CINEMATIC_CHAPTER_PRESETS.hero,
      TT_CINEMATIC_CHAPTER_PRESETS.start,
      0.5,
    );
    const { hero, start } = TT_CINEMATIC_CHAPTER_PRESETS;
    expect(blended.z).toBeCloseTo((hero.z + start.z) / 2, 5);
    expect(blended.fov).toBeCloseTo((hero.fov + start.fov) / 2, 5);
  });
});
