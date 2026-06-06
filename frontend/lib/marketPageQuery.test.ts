import { describe, expect, it } from "vitest";
import {
  countMarketAdvancedFilterSelections,
  parseMarketPageFilterExpandedParam,
  parseMarketPageSortParam,
  serializeMarketPageFilterExpandedParam,
  serializeMarketPageSortParam,
} from "./marketPageQuery";

describe("marketPageQuery", () => {
  it("parseMarketPageSortParam accepts snake and camel", () => {
    expect(parseMarketPageSortParam(null)).toBe("latest");
    expect(parseMarketPageSortParam("price_desc")).toBe("priceDesc");
    expect(parseMarketPageSortParam("priceAsc")).toBe("priceAsc");
    expect(parseMarketPageSortParam("bogus")).toBe("latest");
  });

  it("serializeMarketPageSortParam omits default latest", () => {
    expect(serializeMarketPageSortParam("latest")).toBeNull();
    expect(serializeMarketPageSortParam("priceDesc")).toBe("price_desc");
  });

  it("filter expanded query round-trips", () => {
    expect(parseMarketPageFilterExpandedParam("open")).toBe(true);
    expect(serializeMarketPageFilterExpandedParam(true)).toBe("open");
    expect(serializeMarketPageFilterExpandedParam(false)).toBeNull();
  });

  it("countMarketAdvancedFilterSelections", () => {
    expect(
      countMarketAdvancedFilterSelections({
        city: "上海",
        languages: ["zh"],
        serviceTypes: ["guide"],
        tripDaysFilter: 5,
      }),
    ).toBe(4);
  });
});
