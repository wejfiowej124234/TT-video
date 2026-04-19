import { describe, expect, it } from "vitest";
import { formatGuideDisplayName } from "./guideDisplayName";

describe("formatGuideDisplayName", () => {
  const t = (key: string) =>
    ({
      guide_card_cityGuide: "{{city}} 向导",
      guide_card_guide: "向导",
    }[key] ?? key);

  it("uses city template when city is non-empty", () => {
    expect(formatGuideDisplayName(t, { city: "巴黎" })).toBe("巴黎 向导");
    expect(formatGuideDisplayName(t, { city: "  x  " })).toBe("x 向导");
  });

  it("falls back when city missing or whitespace", () => {
    expect(formatGuideDisplayName(t, {})).toBe("向导");
    expect(formatGuideDisplayName(t, { city: "" })).toBe("向导");
    expect(formatGuideDisplayName(t, { city: "   " })).toBe("向导");
  });
});
