import { describe, expect, it } from "vitest";
import {
  FEED_DESTINATION_CITY_OPTIONS,
  FEED_DESTINATION_GROUPS,
  PUBLISH_DESTINATION_OPTIONS,
} from "./communityFeedConstants";

describe("FEED_DESTINATION_CITY_OPTIONS", () => {
  const countryNames = ["中国", "日本", "泰国", "印尼", "印度尼西亚"];

  it("excludes country-level names", () => {
    for (const name of countryNames) {
      expect(FEED_DESTINATION_CITY_OPTIONS).not.toContain(name);
    }
  });

  it("includes representative cities", () => {
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("东京");
    expect(FEED_DESTINATION_CITY_OPTIONS).toContain("厦门");
  });

  it("has no duplicate 印尼 aliases", () => {
    expect(FEED_DESTINATION_CITY_OPTIONS.filter((d) => d === "印尼")).toHaveLength(0);
    expect(FEED_DESTINATION_CITY_OPTIONS.filter((d) => d === "印度尼西亚")).toHaveLength(0);
  });

  it("has unique entries", () => {
    expect(new Set(FEED_DESTINATION_CITY_OPTIONS).size).toBe(FEED_DESTINATION_CITY_OPTIONS.length);
  });
});

describe("FEED_DESTINATION_GROUPS", () => {
  it("covers cn/jp/th/id/sg with cities only", () => {
    expect(FEED_DESTINATION_GROUPS.map((g) => g.regionKey)).toEqual(["cn", "jp", "th", "id", "sg"]);
    const flat = FEED_DESTINATION_GROUPS.flatMap((g) => g.cities);
    expect(flat).toEqual(FEED_DESTINATION_CITY_OPTIONS);
    expect(flat).not.toContain("中国");
    expect(flat).not.toContain("日本");
  });
});

describe("PUBLISH_DESTINATION_OPTIONS (publish drawer · unchanged)", () => {
  it("still includes country names for publish flow", () => {
    expect(PUBLISH_DESTINATION_OPTIONS).toContain("中国");
    expect(PUBLISH_DESTINATION_OPTIONS).toContain("日本");
  });
});
