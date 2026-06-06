import { describe, expect, it } from "vitest";
import {
  attachDidRankRankDeltas,
  mergeDidRankRowDelta,
  resetDidRankRankDeltaSnapshots,
} from "@/lib/didRankRankDelta";

describe("didRankRankDelta", () => {
  it("computes positive delta when rank improves on second snapshot", () => {
    resetDidRankRankDeltaSnapshots();
    const a = [{ id: "u1", rank: 2, nickname: "a" }];
    attachDidRankRankDeltas(a, "week");
    const b = [{ id: "u1", rank: 1, nickname: "a" }];
    const out = attachDidRankRankDeltas(b, "week");
    expect(out[0]?.rank_delta).toBe(1);
  });

  it("prefers API rank_delta over client snapshot diff", () => {
    const prev = new Map([["u1", 5]]);
    const row = { id: "u1", rank: 3, rank_delta: -2 } as { id: string; rank: number; rank_delta: number };
    const merged = mergeDidRankRowDelta(row, prev);
    expect(merged.rank_delta).toBe(-2);
  });
});
