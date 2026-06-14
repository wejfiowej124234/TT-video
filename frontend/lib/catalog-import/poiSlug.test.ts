import { describe, expect, it } from "vitest";
import { fnv1a32, poiSlugV1 } from "../../../scripts/catalog-import/poiSlug.ts";

describe("poiSlugV1", () => {
  it("ASCII legacy_value lowercases", () => {
    expect(poiSlugV1("melbourne", "food", "brunch", {})).toBe("brunch");
  });

  it("CJK uses fnv hash prefix", () => {
    const slug = poiSlugV1("beijing", "attraction", "故宫", {});
    expect(slug.startsWith("v1-")).toBe(true);
    expect(slug).toBe(`v1-${fnv1a32("beijing:attraction:故宫").toString(16).padStart(8, "0")}`);
  });

  it("honors overrides", () => {
    const overrides = { "beijing:attraction:故宫": "gugong" };
    expect(poiSlugV1("beijing", "attraction", "故宫", overrides)).toBe("gugong");
  });
});
