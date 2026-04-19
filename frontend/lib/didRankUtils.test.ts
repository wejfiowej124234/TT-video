/**
 * DID 排行榜 · 分页与 period 解析单测（项目优化清单 2.1）
 */
import { describe, it, expect } from "vitest";
import {
  parsePeriodParam,
  parseGuideSortParam,
  parseDidRankBoardParam,
  getTotalPages,
  getPaginatedSlice,
  getPageForRankIndex,
  PERIOD_VALUES,
  buildDidRankTravelerHighlightSearch,
  buildDidRankGuideHighlightSearch,
  isDidRankCommunityProfileId,
} from "./didRankUtils";

describe("didRankUtils", () => {
  describe("parsePeriodParam", () => {
    it("accepts week, month, all", () => {
      expect(parsePeriodParam("week")).toBe("week");
      expect(parsePeriodParam("month")).toBe("month");
      expect(parsePeriodParam("all")).toBe("all");
    });
    it("accepts trim and case-insensitive period", () => {
      expect(parsePeriodParam(" Week ")).toBe("week");
      expect(parsePeriodParam("MONTH")).toBe("month");
      expect(parsePeriodParam("All")).toBe("all");
    });
    it("returns default for invalid or null", () => {
      expect(parsePeriodParam(null)).toBe("all");
      expect(parsePeriodParam("")).toBe("all");
      expect(parsePeriodParam("year")).toBe("all");
      expect(parsePeriodParam(null, "month")).toBe("month");
    });
  });

  describe("getTotalPages", () => {
    it("ceil division", () => {
      expect(getTotalPages(0, 20)).toBe(0);
      expect(getTotalPages(20, 20)).toBe(1);
      expect(getTotalPages(21, 20)).toBe(2);
      expect(getTotalPages(90, 20)).toBe(5);
    });
    it("returns 0 for invalid pageSize", () => {
      expect(getTotalPages(10, 0)).toBe(0);
    });
  });

  describe("getPaginatedSlice", () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    it("slices by page and size", () => {
      expect(getPaginatedSlice(list, 1, 3)).toEqual([1, 2, 3]);
      expect(getPaginatedSlice(list, 2, 3)).toEqual([4, 5, 6]);
      expect(getPaginatedSlice(list, 4, 3)).toEqual([10]);
    });
    it("returns empty for invalid inputs", () => {
      expect(getPaginatedSlice(list, 0, 3)).toEqual([]);
      expect(getPaginatedSlice(list, 1, 0)).toEqual([]);
    });
  });

  describe("getPageForRankIndex", () => {
    it("maps list-from-11 index to page (1-based)", () => {
      expect(getPageForRankIndex(0, 20)).toBe(1);
      expect(getPageForRankIndex(19, 20)).toBe(1);
      expect(getPageForRankIndex(20, 20)).toBe(2);
      expect(getPageForRankIndex(89, 20)).toBe(5);
    });
    it("returns 1 for invalid", () => {
      expect(getPageForRankIndex(-1, 20)).toBe(1);
      expect(getPageForRankIndex(0, 0)).toBe(1);
    });
  });

  it("PERIOD_VALUES is complete", () => {
    expect(PERIOD_VALUES).toEqual(["week", "month", "all"]);
  });

  describe("buildDidRankTravelerHighlightSearch", () => {
    it("includes period and encoded me", () => {
      expect(buildDidRankTravelerHighlightSearch("month", "abc-uuid")).toBe(
        "?period=month&me=" + encodeURIComponent("traveler-abc-uuid")
      );
    });
  });

  describe("parseGuideSortParam", () => {
    it("accepts reviews with trim and case-insensitive", () => {
      expect(parseGuideSortParam("reviews")).toBe("reviews");
      expect(parseGuideSortParam(" Reviews ")).toBe("reviews");
      expect(parseGuideSortParam("REVIEWS")).toBe("reviews");
    });
    it("accepts weighted with trim and case-insensitive", () => {
      expect(parseGuideSortParam("weighted")).toBe("weighted");
      expect(parseGuideSortParam(" Weighted ")).toBe("weighted");
    });
    it("accepts reception explicitly", () => {
      expect(parseGuideSortParam("reception")).toBe("reception");
      expect(parseGuideSortParam(" Reception ")).toBe("reception");
    });
    it("falls back to weighted for null, empty, or unknown (页内默认综合榜)", () => {
      expect(parseGuideSortParam(null)).toBe("weighted");
      expect(parseGuideSortParam("")).toBe("weighted");
      expect(parseGuideSortParam("foo")).toBe("weighted");
    });
  });

  describe("parseDidRankBoardParam", () => {
    it("parses board tab", () => {
      expect(parseDidRankBoardParam(null)).toBe("traveler");
      expect(parseDidRankBoardParam("guide")).toBe("guide");
      expect(parseDidRankBoardParam("provider")).toBe("provider");
      expect(parseDidRankBoardParam("merchant")).toBe("provider");
      expect(parseDidRankBoardParam("acquisition")).toBe("acquisition");
      expect(parseDidRankBoardParam(" Acquisition ")).toBe("acquisition");
      expect(parseDidRankBoardParam("unknown")).toBe("traveler");
    });
  });

  describe("buildDidRankGuideHighlightSearch", () => {
    it("includes period and encoded me", () => {
      expect(buildDidRankGuideHighlightSearch("week", "g-1")).toBe(
        "?period=week&me=" + encodeURIComponent("guide-g-1")
      );
    });
    it("adds guide_sort=reviews when opts.guideSort is reviews", () => {
      const q = buildDidRankGuideHighlightSearch("month", "abc", { guideSort: "reviews" });
      expect(q).toContain("period=month");
      expect(q).toContain("guide_sort=reviews");
      expect(q).toContain("me=" + encodeURIComponent("guide-abc"));
    });
    it("omits guide_sort when opts.guideSort is weighted (默认综合，与页内一致)", () => {
      const q = buildDidRankGuideHighlightSearch("all", "x", { guideSort: "weighted" });
      expect(q).not.toContain("guide_sort");
      expect(q).toContain("me=" + encodeURIComponent("guide-x"));
    });
    it("adds guide_sort=reception when opts.guideSort is reception", () => {
      const q = buildDidRankGuideHighlightSearch("week", "y", { guideSort: "reception" });
      expect(q).toContain("guide_sort=reception");
    });
  });

  describe("isDidRankCommunityProfileId", () => {
    it("accepts RFC4122-style UUIDs", () => {
      expect(isDidRankCommunityProfileId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isDidRankCommunityProfileId("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    });
    it("rejects mock ids and empty", () => {
      expect(isDidRankCommunityProfileId("")).toBe(false);
      expect(isDidRankCommunityProfileId("traveler-1")).toBe(false);
      expect(isDidRankCommunityProfileId("not-a-uuid")).toBe(false);
    });
  });
});
