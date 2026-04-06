import { describe, it, expect } from "vitest";
import { formatDidRankGuideReviewLine } from "./didRankGuideReviewDisplay";

const t = (k: string) => k;

describe("formatDidRankGuideReviewLine", () => {
  it("returns null when no count and no avg", () => {
    expect(formatDidRankGuideReviewLine({}, t)).toBeNull();
    expect(formatDidRankGuideReviewLine({ receivedReviewCount: 0, avgReceivedReviewScore: null }, t)).toBeNull();
  });

  it("returns count only when avg missing", () => {
    expect(formatDidRankGuideReviewLine({ receivedReviewCount: 2 }, t)).toBe(
      "2 didRank_receivedReviews_unit",
    );
  });

  it("returns avg and count when both present", () => {
    expect(formatDidRankGuideReviewLine({ receivedReviewCount: 3, avgReceivedReviewScore: 4.25 }, t)).toBe(
      "didRank_avgScore_short 4.3 · 3 didRank_receivedReviews_unit",
    );
  });

  it("returns avg only when count zero but avg present", () => {
    expect(formatDidRankGuideReviewLine({ receivedReviewCount: 0, avgReceivedReviewScore: 5 }, t)).toBe(
      "didRank_avgScore_short 5.0",
    );
  });

  it("treats non-finite avg as absent", () => {
    expect(
      formatDidRankGuideReviewLine({ receivedReviewCount: 1, avgReceivedReviewScore: Number.NaN }, t),
    ).toBe("1 didRank_receivedReviews_unit");
  });
});
