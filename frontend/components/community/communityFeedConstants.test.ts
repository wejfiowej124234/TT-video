import { describe, expect, it } from "vitest";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import {
  FEED_DESTINATION_CITY_OPTIONS,
  FEED_DESTINATION_GROUPS,
  PUBLISH_DESTINATION_OPTIONS,
  REGION_KEYS,
  TYPE_OPTIONS,
} from "./communityFeedConstants";

describe("TYPE_OPTIONS", () => {
  it("excludes standalone text from feed type chips", () => {
    expect(TYPE_OPTIONS).toEqual(["photo", "video"]);
    expect(TYPE_OPTIONS).not.toContain("text");
    expect(TYPE_OPTIONS).not.toContain("food");
    expect(TYPE_OPTIONS).not.toContain("travel");
  });
});

describe("FEED_DESTINATION_CITY_OPTIONS", () => {
  const countryNames = PRODUCT_COUNTRIES.map((c) => c.nameZh);

  it("excludes country-level names (except Singapore city=country)", () => {
    for (const name of countryNames) {
      if (name === "新加坡") continue;
      expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain(name);
    }
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("新加坡");
  });

  it("includes representative cities across product countries", () => {
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("东京");
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("北京");
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("首尔");
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("巴黎");
  });

  it("excludes Indonesia destinations", () => {
    expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain("巴厘岛");
    expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain("雅加达");
    expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain("印尼");
    expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain("印度尼西亚");
  });

  it("keeps ≤4 cities per country and unique entries", () => {
    for (const g of FEED_DESTINATION_GROUPS) {
      expect(g.cities.length).toBeGreaterThan(0);
      expect(g.cities.length).toBeLessThanOrEqual(4);
    }
    expect(new Set(FEED_DESTINATION_CITY_OPTIONS).size).toBe(FEED_DESTINATION_CITY_OPTIONS.length);
  });
});

describe("FEED_DESTINATION_GROUPS", () => {
  it("covers product ten countries only (no id/Indonesia)", () => {
    expect(FEED_DESTINATION_GROUPS.map((g) => g.regionKey)).toEqual(
      PRODUCT_COUNTRIES.map((c) => c.iso.toLowerCase()),
    );
    expect(FEED_DESTINATION_GROUPS.map((g) => g.regionKey)).not.toContain("id");
    const flat = FEED_DESTINATION_GROUPS.flatMap((g) => g.cities);
    expect(flat).toEqual(FEED_DESTINATION_CITY_OPTIONS);
  });
});

describe("REGION_KEYS", () => {
  it("is all + ten product ISOs lowercase without id", () => {
    expect(REGION_KEYS[0]).toBe("all");
    expect([...REGION_KEYS].slice(1)).toEqual(PRODUCT_COUNTRIES.map((c) => c.iso.toLowerCase()));
    expect(REGION_KEYS).not.toContain("id");
  });
});

describe("PUBLISH_DESTINATION_OPTIONS (publish drawer)", () => {
  it("includes country names for publish flow and excludes Indonesia", () => {
    expect(PUBLISH_DESTINATION_OPTIONS).toContain("中国");
    expect(PUBLISH_DESTINATION_OPTIONS).toContain("日本");
    expect(PUBLISH_DESTINATION_OPTIONS).toContain("韩国");
    expect(PUBLISH_DESTINATION_OPTIONS).not.toContain("印尼");
    expect(PUBLISH_DESTINATION_OPTIONS).not.toContain("印度尼西亚");
  });
});
