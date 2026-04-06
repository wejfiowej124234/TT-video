/**
 * 54-S13 / 54-S14：Landing 行程偏好景区类型 4 项；酒店选项 3 项（标准、轻奢、高端）
 */
import { describe, it, expect } from "vitest";
import { ATTRACTION_TYPE_OPTIONS, HOTEL_OPTIONS } from "@/components/landing/constants";

describe("landing constants (54-S13, 54-S14)", () => {
  it("ATTRACTION_TYPE_OPTIONS has exactly four preset types", () => {
    expect(ATTRACTION_TYPE_OPTIONS).toHaveLength(4);
    expect(ATTRACTION_TYPE_OPTIONS.map((a) => a.value)).toEqual([
      "世界遗产",
      "自然风光",
      "主题乐园",
      "网红景区",
    ]);
  });

  it("HOTEL_OPTIONS has standard, light luxury, premium", () => {
    expect(HOTEL_OPTIONS).toHaveLength(3);
    expect(HOTEL_OPTIONS.map((h) => h.value)).toEqual(["标准", "轻奢", "高端"]);
  });
});
