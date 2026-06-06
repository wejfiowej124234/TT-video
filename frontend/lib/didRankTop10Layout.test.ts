import { describe, expect, it } from "vitest";
import {
  didRankPodiumVisualOrder,
  didRankTop10RowGridClass,
  splitDidRankTop10,
  splitDidRankTop10RowBand,
} from "@/lib/didRankTop10Layout";

describe("didRankTop10Layout", () => {
  it("orders podium as 2 · 1 · 3 when ranks 1–3 exist", () => {
    const items = [
      { id: "a", rank: 1 },
      { id: "b", rank: 2 },
      { id: "c", rank: 3 },
    ];
    expect(didRankPodiumVisualOrder(items).map((i) => i.rank)).toEqual([2, 1, 3]);
  });

  it("splits row band into five plus centered tail when seven cards", () => {
    const row = [4, 5, 6, 7, 8, 9, 10].map((rank) => ({ id: String(rank), rank }));
    const { head, tail } = splitDidRankTop10RowBand(row);
    expect(head).toHaveLength(5);
    expect(tail.map((i) => i.rank)).toEqual([9, 10]);
  });

  it("splits top10 into podium and row bands", () => {
    const items = [
      { id: "a", rank: 2 },
      { id: "b", rank: 5 },
      { id: "c", rank: 8 },
    ];
    const { podiumVisual, row } = splitDidRankTop10(items);
    expect(podiumVisual.map((i) => i.rank)).toEqual([2]);
    expect(row.map((i) => i.rank)).toEqual([5, 8]);
  });
});
