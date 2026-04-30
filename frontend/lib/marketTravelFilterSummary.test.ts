import { describe, expect, it } from "vitest";
import type { LocaleInterpolationVars } from "./i18n";
import { applyLocalePlaceholders } from "./i18n";
import { formatMarketTravelFilterSummaryBlocks, formatMarketTravelFilterSummaryLine } from "./marketTravelFilterSummary";

describe("formatMarketTravelFilterSummaryLine", () => {
  const dict: Record<string, string> = {
    market_travel_filter_summary_line:
      "O={{orderSide}}|G={{guideSide}}|V={{view}}|S={{sort}}|{{orderCount}}|{{guideCount}}",
    market_travel_summary_sep: " · ",
    market_travel_summary_orders_any: "ANY",
    market_travel_summary_guides_need_country: "NEED",
    market_travel_summary_guides_open: "OPEN",
    market_travel_summary_guides_picked: "PICK{{n}}",
    view_split: "SPLIT",
    view_orders: "ORD",
    view_guides: "GD",
    market_sort_latest: "LATEST",
    market_sort_priceDesc: "PD",
    market_sort_priceAsc: "PA",
    community_region_cn: "ChinaLabel",
  };
  const t = (k: string, vars?: LocaleInterpolationVars) => applyLocalePlaceholders(dict[k] ?? k, vars);

  it("uses any-country and need-country when country empty", () => {
    const s = formatMarketTravelFilterSummaryLine(t, {
      country: "",
      city: "",
      languages: [],
      serviceTypes: [],
      view: "split",
      sortBy: "latest",
      orderCount: 3,
      guideCount: 5,
    });
    expect(s).toContain("ANY");
    expect(s).toContain("NEED");
    expect(s).toContain("3");
    expect(s).toContain("5");
  });

  it("joins country and city with sep", () => {
    const s = formatMarketTravelFilterSummaryLine(t, {
      country: "中国",
      city: "北京",
      languages: [],
      serviceTypes: [],
      view: "orders",
      sortBy: "priceDesc",
      orderCount: 0,
      guideCount: 1,
    });
    expect(s).toContain("ChinaLabel");
    expect(s).toContain("北京");
    expect(s).toContain("ORD");
    expect(s).toContain("PD");
  });

  it("abbreviates many guide filters", () => {
    const s = formatMarketTravelFilterSummaryLine(t, {
      country: "中国",
      city: "",
      languages: ["中文", "英语"],
      serviceTypes: ["向导服务"],
      view: "guides",
      sortBy: "priceAsc",
      orderCount: 2,
      guideCount: 4,
    });
    expect(s).toContain("PICK3");
  });
});

describe("formatMarketTravelFilterSummaryBlocks", () => {
  const dict: Record<string, string> = {
    market_travel_filter_summary_filters: "F={{orderSide}}|{{guideSide}}",
    market_travel_filter_summary_list_meta: "L={{view}}|{{sort}}|{{orderCount}}|{{guideCount}}",
    market_travel_summary_sep: " · ",
    market_travel_summary_orders_any: "ANY",
    market_travel_summary_guides_need_country: "NEED",
    market_travel_summary_guides_open: "OPEN",
    view_split: "SPLIT",
    market_sort_latest: "LATEST",
  };
  const t = (k: string, vars?: LocaleInterpolationVars) => applyLocalePlaceholders(dict[k] ?? k, vars);

  it("splits filter line and list meta", () => {
    const { filterLine, listLine } = formatMarketTravelFilterSummaryBlocks(t, {
      country: "",
      city: "",
      languages: [],
      serviceTypes: [],
      view: "split",
      sortBy: "latest",
      orderCount: 1,
      guideCount: 2,
    });
    expect(filterLine).toContain("ANY");
    expect(filterLine).toContain("NEED");
    expect(listLine).toContain("SPLIT");
    expect(listLine).toContain("LATEST");
    expect(listLine).toContain("1");
    expect(listLine).toContain("2");
  });
});
