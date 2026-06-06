/**
 * 54-S13 / 54-S14：Landing 行程偏好 · 景点 4 项 + 餐饮 4 项 + 住宿档次 3 项
 */
import { describe, it, expect } from "vitest";
import { ATTRACTION_TYPE_OPTIONS, HOTEL_OPTIONS, STANDARD_OPTIONS, dateToString } from "@/components/landing/constants";

describe("landing constants (54-S13, 54-S14)", () => {
  it("ATTRACTION_TYPE_OPTIONS has four preset types in industry order", () => {
    expect(ATTRACTION_TYPE_OPTIONS).toHaveLength(4);
    expect(ATTRACTION_TYPE_OPTIONS.map((a) => a.value)).toEqual([
      "自然风光",
      "世界遗产",
      "主题乐园",
      "网红景区",
    ]);
  });

  it("STANDARD_OPTIONS has local specialty, heritage, popular, fine dining", () => {
    expect(STANDARD_OPTIONS).toHaveLength(4);
    expect(STANDARD_OPTIONS.map((d) => d.value)).toEqual([
      "当地特色",
      "老字号",
      "人气餐厅",
      "高档餐饮",
    ]);
  });

  it("HOTEL_OPTIONS has standard, light luxury, premium", () => {
    expect(HOTEL_OPTIONS).toHaveLength(3);
    expect(HOTEL_OPTIONS.map((h) => h.value)).toEqual(["标准", "轻奢", "高端"]);
  });

  it("dateToString uses local calendar day (not UTC slice)", () => {
    const d = new Date(2026, 5, 5, 12, 0, 0);
    expect(dateToString(d)).toBe("2026-06-05");
  });
});
