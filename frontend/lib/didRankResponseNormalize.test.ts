import { describe, it, expect } from "vitest";
import {
  extractDidRankList,
  normalizeDidRankTravelerRow,
  normalizeDidRankGuideRow,
  normalizeDidRankItineraryRow,
} from "./didRankResponseNormalize";

describe("extractDidRankList", () => {
  it("returns raw array", () => {
    expect(extractDidRankList([{ id: "a" }], "travelers")).toEqual([{ id: "a" }]);
  });
  it("reads keyed array from object", () => {
    expect(extractDidRankList({ travelers: [1, 2] }, "travelers")).toEqual([1, 2]);
    expect(extractDidRankList({ guides: [3] }, "guides")).toEqual([3]);
  });
  it("falls back to items", () => {
    expect(extractDidRankList({ items: ["x"] }, "travelers")).toEqual(["x"]);
  });
  it("returns empty for invalid", () => {
    expect(extractDidRankList(null, "itineraries")).toEqual([]);
    expect(extractDidRankList({}, "travelers")).toEqual([]);
  });
});

describe("normalizeDidRankGuideRow", () => {
  it("uses numeric reception_gross_total when totalAmountUsdt absent", () => {
    const row = normalizeDidRankGuideRow({
      id: "g1",
      rank: 1,
      nickname: "N",
      reception_gross_total: 12.5,
    });
    expect(row?.totalAmountUsdt).toBe(12.5);
  });
  it("parses string reception_gross_total", () => {
    const row = normalizeDidRankGuideRow({
      id: "g1",
      rank: 1,
      nickname: "N",
      reception_gross_total: " 99.25 ",
    });
    expect(row?.totalAmountUsdt).toBe(99.25);
  });
  it("prefers totalAmountUsdt over gross", () => {
    const row = normalizeDidRankGuideRow({
      id: "g1",
      rank: 1,
      nickname: "N",
      totalAmountUsdt: 7,
      reception_gross_total: 100,
    });
    expect(row?.totalAmountUsdt).toBe(7);
  });
  it("maps received_review_count and avg_received_review_score", () => {
    const row = normalizeDidRankGuideRow({
      id: "g1",
      rank: 1,
      nickname: "N",
      reception_gross_total: "0",
      received_review_count: 2,
      avg_received_review_score: 4.5,
    });
    expect(row?.receivedReviewCount).toBe(2);
    expect(row?.avgReceivedReviewScore).toBe(4.5);
  });
  it("preserves explicit null avg_received_review_score", () => {
    const row = normalizeDidRankGuideRow({
      id: "g1",
      rank: 1,
      nickname: "N",
      reception_gross_total: "0",
      received_review_count: 0,
      avg_received_review_score: null,
    });
    expect(row?.receivedReviewCount).toBe(0);
    expect(row?.avgReceivedReviewScore).toBeNull();
  });
});

describe("normalizeDidRankTravelerRow", () => {
  it("returns null when nickname missing", () => {
    expect(normalizeDidRankTravelerRow({ id: "t", rank: 1 })).toBeNull();
  });
  it("normalizes minimal row", () => {
    const row = normalizeDidRankTravelerRow({ id: "t", rank: 2, nickname: "T1" });
    expect(row).toMatchObject({ id: "t", rank: 2, nickname: "T1", totalSpentUsdt: 0 });
  });
});

describe("normalizeDidRankItineraryRow", () => {
  it("builds title from destination and city", () => {
    const row = normalizeDidRankItineraryRow(
      { id: "o1", rank: 1, destination: "JP", city: "Tokyo" },
      "—"
    );
    expect(row?.title).toBe("JP · Tokyo");
  });

  it("parses rank_delta from API row", () => {
    const row = normalizeDidRankItineraryRow({ id: "o1", rank: 2, rank_delta: 1 }, "—");
    expect(row?.rank_delta).toBe(1);
  });
});
