import { describe, expect, it } from "vitest";
import { formatGuideDisplayName } from "./guideDisplayName";

describe("formatGuideDisplayName", () => {
  const t = (key: string) =>
    ({
      guide_card_cityGuide: "{{city}} 向导",
      guide_card_guide: "向导",
    }[key] ?? key);

  it("prefers public_title when non-empty", () => {
    expect(formatGuideDisplayName(t, { city: "巴黎", public_title: "Marie · 巴黎向导" })).toBe("Marie · 巴黎向导");
    expect(formatGuideDisplayName(t, { city: "巴黎", public_title: "  自定义  " })).toBe("自定义");
  });

  it("uses city template when public_title missing or blank", () => {
    expect(formatGuideDisplayName(t, { city: "巴黎" })).toBe("巴黎 向导");
    expect(formatGuideDisplayName(t, { city: "  x  ", public_title: "" })).toBe("x 向导");
  });

  it("falls back when city missing or whitespace", () => {
    expect(formatGuideDisplayName(t, {})).toBe("向导");
    expect(formatGuideDisplayName(t, { city: "" })).toBe("向导");
    expect(formatGuideDisplayName(t, { city: "   " })).toBe("向导");
  });
});
