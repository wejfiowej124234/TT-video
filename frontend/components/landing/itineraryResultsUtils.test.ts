/**
 * 56-S4 Landing 结果区：按天摘要与首日配图单元测试（与 52 §3.1 一致）
 */
import { describe, it, expect } from "vitest";
import {
  getDailyItineraryOutline,
  getFirstDayImage,
  getDaySummary,
  getFirstDayDescription,
} from "./itineraryResultsUtils";
import type { DailyItemForSummary } from "./itineraryResultsUtils";

const EM = "—";

function mockTZh(k: string): string {
  if (k === "landing_results_day_segment") return "第{{n}}天 {{city}}";
  if (k === "landing_results_day_joiner") return " · ";
  return k;
}

function mockTEn(k: string): string {
  if (k === "landing_results_day_segment") return "Day {{n}}: {{city}}";
  if (k === "landing_results_day_joiner") return " · ";
  return k;
}

describe("itineraryResultsUtils 56-S4", () => {
  describe("getFirstDayImage", () => {
    it("returns null when daily is undefined or empty", () => {
      expect(getFirstDayImage(undefined)).toBeNull();
      expect(getFirstDayImage([])).toBeNull();
    });

    it("returns first image from images array", () => {
      const daily: DailyItemForSummary[] = [
        { city: "北京", images: ["https://a.jpg", "https://b.jpg"] },
      ];
      expect(getFirstDayImage(daily)).toBe("https://a.jpg");
    });

    it("returns first image from content_images when images missing", () => {
      const daily: DailyItemForSummary[] = [
        { city: "北京", content_images: ["https://c.jpg"] },
      ];
      expect(getFirstDayImage(daily)).toBe("https://c.jpg");
    });

    it("supports images as { url: string }[]", () => {
      const daily: DailyItemForSummary[] = [
        { city: "上海", images: [{ url: "https://d.jpg" }] },
      ];
      expect(getFirstDayImage(daily)).toBe("https://d.jpg");
    });

    it("returns null when first day has no images", () => {
      const daily: DailyItemForSummary[] = [{ city: "北京" }];
      expect(getFirstDayImage(daily)).toBeNull();
    });
  });

  describe("getDaySummary", () => {
    it("returns empty string when daily is undefined or empty", () => {
      expect(getDaySummary(undefined, EM, mockTZh)).toBe("");
      expect(getDaySummary([], EM, mockTZh)).toBe("");
    });

    it("formats single day with city (zh template)", () => {
      const daily: DailyItemForSummary[] = [{ city: "北京" }];
      expect(getDaySummary(daily, EM, mockTZh)).toBe("第1天 北京");
    });

    it("formats multiple days with city (56-S4 按天摘要)", () => {
      const daily: DailyItemForSummary[] = [
        { city: "北京" },
        { city: "上海" },
        { city: "杭州" },
      ];
      expect(getDaySummary(daily, EM, mockTZh)).toBe("第1天 北京 · 第2天 上海 · 第3天 杭州");
    });

    it("uses — when city missing", () => {
      const daily: DailyItemForSummary[] = [{}, { city: "上海" }];
      expect(getDaySummary(daily, EM, mockTZh)).toBe("第1天 — · 第2天 上海");
    });

    it("uses English segment template when locale messages are en-shaped", () => {
      const daily: DailyItemForSummary[] = [{ city: "Beijing" }, { city: "Shanghai" }];
      expect(getDaySummary(daily, EM, mockTEn)).toBe("Day 1: Beijing · Day 2: Shanghai");
    });

    it("caps at 10 days", () => {
      const daily = Array.from({ length: 12 }, (_, i) => ({ city: `City${i + 1}` }));
      const summary = getDaySummary(daily, EM, mockTZh);
      expect(summary).toContain("第10天 City10");
      expect(summary).not.toContain("City11");
    });

    it("getDailyItineraryOutline respects maxDays", () => {
      const daily = Array.from({ length: 8 }, (_, i) => ({ city: `C${i + 1}` }));
      const s = getDailyItineraryOutline(daily, EM, mockTZh, 5);
      expect(s).toContain("第5天 C5");
      expect(s).not.toContain("C6");
    });
  });

  describe("getFirstDayDescription", () => {
    it("returns empty when daily is undefined or empty", () => {
      expect(getFirstDayDescription(undefined)).toBe("");
      expect(getFirstDayDescription([])).toBe("");
    });

    it("prefers description over content_text", () => {
      const daily: DailyItemForSummary[] = [
        { description: "Desc", content_text: "Text" },
      ];
      expect(getFirstDayDescription(daily)).toBe("Desc");
    });

    it("falls back to content_text", () => {
      const daily: DailyItemForSummary[] = [{ content_text: "Day one" }];
      expect(getFirstDayDescription(daily)).toBe("Day one");
    });

    it("slices to 120 chars", () => {
      const long = "x".repeat(150);
      const daily: DailyItemForSummary[] = [{ description: long }];
      expect(getFirstDayDescription(daily).length).toBe(120);
    });
  });
});
