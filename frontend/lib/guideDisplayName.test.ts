import { describe, expect, it } from "vitest";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";

const t = (key: string) =>
  ({
    guide_card_cityGuide: "{{city}} 向导",
    guide_card_guide: "向导",
  })[key] ?? key;

describe("formatGuideDisplayName", () => {
  it("falls back to city label when public_title is internal demo copy", () => {
    expect(
      formatGuideDisplayName(t, {
        city: "杭州",
        public_title: "多重身份演示 · 向导轨",
      }),
    ).toBe("杭州 向导");
  });
});
