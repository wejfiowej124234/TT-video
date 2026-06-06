import { describe, expect, it } from "vitest";
import { extractDidRankList, normalizeDidRankSecondaryRow } from "@/lib/didRankResponseNormalize";

describe("didRankResponseNormalize secondary boards", () => {
  it("extracts providers and acquisitions arrays", () => {
    expect(
      extractDidRankList({ providers: [{ id: "a", rank: 1, nickname: "P" }] }, "providers"),
    ).toHaveLength(1);
    expect(extractDidRankList({ acquisitions: [] }, "acquisitions")).toEqual([]);
  });

  it("normalizeDidRankSecondaryRow rejects invalid rows", () => {
    expect(normalizeDidRankSecondaryRow({ id: "x", rank: 1 })).toBeNull();
    expect(normalizeDidRankSecondaryRow({ id: "x", rank: 1, nickname: "Shop" })).toEqual({
      id: "x",
      rank: 1,
      nickname: "Shop",
    });
    expect(
      normalizeDidRankSecondaryRow({
        id: "x",
        rank: 2,
        nickname: "A",
        published_listings: 4,
      }),
    ).toMatchObject({ published_listings: 4 });
    expect(
      normalizeDidRankSecondaryRow({
        id: "u1",
        rank: 1,
        nickname: "Me",
        is_me: true,
        rank_delta: 2,
      }),
    ).toMatchObject({ is_me: true, rank_delta: 2 });
  });
});
