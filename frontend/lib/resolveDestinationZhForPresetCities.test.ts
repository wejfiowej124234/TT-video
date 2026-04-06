import { describe, it, expect } from "vitest";
import { resolveDestinationZhForPresetCities } from "./resolveDestinationZhForPresetCities";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";

describe("resolveDestinationZhForPresetCities (07 §5.2)", () => {
  it("returns empty when order is null", () => {
    expect(resolveDestinationZhForPresetCities(null, [])).toBe("");
  });

  it("uses Chinese destination when in product allow-list", () => {
    expect(resolveDestinationZhForPresetCities({ destination: "中国" }, [])).toBe("中国");
  });

  it("maps ISO country to name_zh for preset city list", () => {
    expect(resolveDestinationZhForPresetCities({ destination: "", country: "cn" }, [])).toBe("中国");
    expect(resolveDestinationZhForPresetCities({ country: "JP" }, [])).toBe("日本");
  });

  it("infers country from first daily row city in preset table", () => {
    const daily: UnifiedDayRow[] = [{ day_index: 1, city: "北京", content_text: "" }];
    expect(resolveDestinationZhForPresetCities({ destination: "", country: "" }, daily)).toBe("中国");
  });

  it("returns raw destination when not product country and no inference", () => {
    expect(resolveDestinationZhForPresetCities({ destination: "意大利" }, [])).toBe("意大利");
  });

  it("returns empty string when no destination and no usable inference", () => {
    expect(resolveDestinationZhForPresetCities({ destination: "", country: "ZZ" }, [])).toBe("");
  });
});
