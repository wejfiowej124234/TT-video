import { describe, expect, it } from "vitest";
import {
  buildMarketHubDiscoverOrdersQuery,
  buildMarketHubGuidesQuery,
  marketHubEffectiveCountry,
} from "./marketHubBrowserTruth";

describe("marketHubBrowserTruth", () => {
  it("marketHubEffectiveCountry defaults to all", () => {
    expect(marketHubEffectiveCountry("")).toBe("all");
    expect(marketHubEffectiveCountry("  ")).toBe("all");
    expect(marketHubEffectiveCountry("中国")).toBe("中国");
  });

  it("buildMarketHubDiscoverOrdersQuery omits country when unset", () => {
    expect(buildMarketHubDiscoverOrdersQuery({ country: "", city: "", tripDaysFilter: null })).toBe(
      "limit=30",
    );
    expect(
      buildMarketHubDiscoverOrdersQuery({ country: "中国", city: "东京", tripDaysFilter: 5 }),
    ).toContain("country=");
  });

  it("buildMarketHubGuidesQuery omits country_code when unset", () => {
    expect(
      buildMarketHubGuidesQuery({ country: "", city: "", languages: [], serviceTypes: [] }),
    ).toBe("limit=30");
  });
});
