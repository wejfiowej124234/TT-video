import { describe, expect, it } from "vitest";
import {
  TT_CINEMATIC_GLOBE_VISUAL,
  TT_CINEMATIC_HERO_LETTERBOX,
  TT_HERO_LETTERBOX_TOP_UNIFIED_CLASS,
  TT_HERO_LETTERBOX_WARM_BOTTOM_UNIFIED_CLASS,
  TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY,
  buildPageCinematicCanvasOverlayLayers,
} from "@/lib/traveltrustCinematicVisual";

describe("traveltrustCinematicVisual", () => {
  it("builds overlay layers from scroll params", () => {
    const layers = buildPageCinematicCanvasOverlayLayers({
      heroT: 0.1,
      pageT: 0.5,
      heroSplitBlend: 0.5,
      heroBridgeEase: 0.2,
      trustBand: 0.5,
      globeOpticalX: "26%",
    });
    expect(layers.length).toBeGreaterThan(3);
    expect(layers.some((l) => l.includes("linear-gradient(180deg"))).toBe(true);
    expect(layers.some((l) => l.includes("255,178,108"))).toBe(true);
    expect(layers.some((l) => l.includes("at 50% 38%"))).toBe(true);
  });

  it("exports globe visual tokens for 3D scene", () => {
    expect(TT_CINEMATIC_GLOBE_VISUAL.phase1MarkerOpacity).toBeGreaterThan(0.5);
    expect(TT_CINEMATIC_GLOBE_VISUAL.travelArcOpacity).toBeGreaterThan(0.2);
    expect(TT_CINEMATIC_GLOBE_VISUAL.phase1TierScale.S).toBeGreaterThan(
      TT_CINEMATIC_GLOBE_VISUAL.phase1TierScale.B,
    );
  });

  it("exports unified letterbox warm overlay (TT-PH1-150 L5)", () => {
    expect(TT_HERO_LETTERBOX_WARM_BOTTOM_UNIFIED_CLASS).toContain("252,164,124");
  });

  it("letterbox tokens avoid pure-black bars (TT-PH1-150)", () => {
    expect(TT_CINEMATIC_HERO_LETTERBOX.unified.topPeak).toBeLessThan(0.5);
    expect(TT_HERO_LETTERBOX_TOP_UNIFIED_CLASS).not.toMatch(/bg-black/);
    expect(TT_HERO_LETTERBOX_TOP_UNIFIED_CLASS).toContain("linear-gradient");
    expect(TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY.join(" ")).not.toMatch(/#000|rgba\(0,0,0/);
  });
});
