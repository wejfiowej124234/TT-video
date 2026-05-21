import { describe, expect, it } from "vitest";
import {
  blendChapterPresets,
  resolveTravelTrustBlendedChapterPreset,
  resolveTravelTrustCinematicChapter,
  resolveTravelTrustCinematicChapterForUi,
  TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS,
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
    expect(TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS.theater).toContain("theater");
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

  it("maps scroll progress to narrative chapter keys", () => {
    expect(resolveTravelTrustCinematicChapter(0, 0)).toBe("hero");
    expect(resolveTravelTrustCinematicChapter(0.8, 0.2)).toBe("theater");
    expect(resolveTravelTrustCinematicChapter(0.2, 0.75)).toBe("start");
    expect(TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS.start).toContain("start");
  });

  it("prefers section anchor for ui chapter when deep in page", () => {
    expect(resolveTravelTrustCinematicChapterForUi(0.1, 0.8, "start")).toBe("start");
    expect(resolveTravelTrustCinematicChapterForUi(0.1, 0.8, "roles")).toBe("theater");
  });
});
