/**
 * 52 阶段：统一行程表类型与工具函数单测（§5.5）
 */
import { describe, it, expect } from "vitest";
import { getDayDescription, getDayImages, type UnifiedDayRow } from "./types";

describe("lib/itineraryUnified getDayDescription", () => {
  it("prefers description when present", () => {
    const row: UnifiedDayRow = { day_index: 1, description: "当日概要", content_text: "旧版文本" };
    expect(getDayDescription(row)).toBe("当日概要");
  });

  it("falls back to content_text when description missing", () => {
    const row: UnifiedDayRow = { day_index: 1, content_text: "第1天：北京" };
    expect(getDayDescription(row)).toBe("第1天：北京");
  });

  it("returns empty string when neither present", () => {
    const row: UnifiedDayRow = { day_index: 1 };
    expect(getDayDescription(row)).toBe("");
  });
});

describe("lib/itineraryUnified getDayImages", () => {
  it("returns images when present", () => {
    const row: UnifiedDayRow = { day_index: 1, images: ["https://a.jpg", "https://b.jpg"] };
    expect(getDayImages(row)).toEqual(["https://a.jpg", "https://b.jpg"]);
  });

  it("falls back to content_images when images missing", () => {
    const row: UnifiedDayRow = { day_index: 1, content_images: ["https://c.jpg"] };
    expect(getDayImages(row)).toEqual(["https://c.jpg"]);
  });

  it("maps image objects to url", () => {
    const row: UnifiedDayRow = {
      day_index: 1,
      images: [{ url: "https://d.jpg", caption: "图1" }, { url: "https://e.jpg" }],
    };
    expect(getDayImages(row)).toEqual(["https://d.jpg", "https://e.jpg"]);
  });

  it("returns empty array when no images", () => {
    const row: UnifiedDayRow = { day_index: 1 };
    expect(getDayImages(row)).toEqual([]);
  });
});
