import { describe, expect, it } from "vitest";
import {
  didRankPodiumColumnClass,
  didRankPodiumGlowClass,
  didRankPodiumPedestalClass,
  didRankPodiumSlotClass,
  didRankPodiumStageWrapClass,
} from "@/lib/didRankPodiumStage";

function pedestalStepHeight(rank: number): number {
  const m = didRankPodiumPedestalClass(rank).match(/\bh-(\d+(?:\.\d+)?)/);
  return m ? Number.parseFloat(m[1]!) : 0;
}

describe("didRankPodiumStage", () => {
  it("orders slot #1 center elevated without scale (crisp text)", () => {
    expect(didRankPodiumSlotClass(1)).toContain("order-2");
    expect(didRankPodiumStageWrapClass(1)).toContain("sm:-mt-2");
    expect(didRankPodiumStageWrapClass(1)).not.toContain("scale-");
  });

  it("provides pedestal and glow only for top 3", () => {
    expect(didRankPodiumPedestalClass(1)).not.toBe("");
    expect(didRankPodiumGlowClass(2)).not.toBe("");
    expect(didRankPodiumPedestalClass(4)).toBe("");
    expect(didRankPodiumGlowClass(11)).toBe("");
  });

  it("pedestal step heights follow rank 1 > 2 > 3 (fixes #2 shorter than #3)", () => {
    expect(pedestalStepHeight(1)).toBeGreaterThan(pedestalStepHeight(2));
    expect(pedestalStepHeight(2)).toBeGreaterThan(pedestalStepHeight(3));
  });

  it("podium column enforces min height and flex column", () => {
    expect(didRankPodiumColumnClass(2)).toContain("min-h-[");
    expect(didRankPodiumColumnClass(2)).toContain("flex-col");
    expect(didRankPodiumSlotClass(2)).toContain("sm:min-w-");
  });
});
