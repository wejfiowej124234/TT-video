import { describe, expect, it } from "vitest";
import { didRankTop3GlowLayerClass } from "@/lib/didRankTop3Glow";

describe("didRankTop3GlowLayerClass", () => {
  it("maps ranks 1-3 to glow layer utilities (behind card, not on text)", () => {
    expect(didRankTop3GlowLayerClass(1)).toContain("animate-did-glow-sun");
    expect(didRankTop3GlowLayerClass(2)).toContain("animate-did-glow");
    expect(didRankTop3GlowLayerClass(3)).toContain("animate-did-glow-fuchsia");
    expect(didRankTop3GlowLayerClass(4)).toBe("");
  });
});
