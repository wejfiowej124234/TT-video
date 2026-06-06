import { describe, expect, it } from "vitest";
import {
  buildMarketGuideListApiParams,
  guideMatchesMarketAdvancedFilters,
  marketGuideLanguageTokensMatch,
  marketGuideServiceTokensMatch,
  normalizeGuideLanguageForWrite,
  normalizeGuideServiceTypeForWrite,
} from "./marketGuideFilterQuery";

describe("marketGuideFilterQuery", () => {
  it("maps UI language/service to API query params", () => {
    expect(
      buildMarketGuideListApiParams({
        country: "中国",
        city: "",
        languages: ["英语"],
        serviceTypes: ["向导服务"],
      }),
    ).toEqual({ language: "en", service_type: "walking", country_code: "CN" });
  });

  it("maps multi-select facets to comma-separated API query", () => {
    expect(
      buildMarketGuideListApiParams({
        country: "中国",
        city: "北京",
        languages: ["中文", "英语"],
        serviceTypes: ["向导服务", "摄影服务"],
      }),
    ).toEqual({ city: "北京", language: "zh,en", service_type: "walking,photography" });
  });

  it("matches API seed langs/slugs to UI pills", () => {
    expect(marketGuideLanguageTokensMatch("英语", "en")).toBe(true);
    expect(marketGuideLanguageTokensMatch("中文", "zh")).toBe(true);
    expect(marketGuideServiceTokensMatch("向导服务", "walking")).toBe(true);
    expect(marketGuideServiceTokensMatch("向导服务", "culture")).toBe(true);
    expect(marketGuideServiceTokensMatch("摄影服务", "photography")).toBe(true);
    expect(marketGuideServiceTokensMatch("司机服务", "driving")).toBe(true);
  });

  it("filters showcase guide row for 中国 + 英语 + 向导服务", () => {
    const guide = {
      city: "北京",
      languages: ["zh", "en"],
      service_types: ["walking", "culture"],
    };
    expect(
      guideMatchesMarketAdvancedFilters(guide, {
        country: "中国",
        city: "",
        languages: ["英语"],
        serviceTypes: ["向导服务"],
      }),
    ).toBe(true);
  });

  it("filters by city within country", () => {
    const guide = { city: "上海", languages: ["zh"], service_types: ["walking"] };
    expect(
      guideMatchesMarketAdvancedFilters(guide, {
        country: "中国",
        city: "北京",
        languages: [],
        serviceTypes: [],
      }),
    ).toBe(false);
  });

  it("allows service-only filter without country", () => {
    const guide = { city: "北京", languages: ["zh"], service_types: ["driving"] };
    expect(
      guideMatchesMarketAdvancedFilters(guide, {
        country: "",
        city: "",
        languages: [],
        serviceTypes: ["司机服务"],
      }),
    ).toBe(true);
  });

  it("matches guide by country_code when city list miss", () => {
    const guide = { city: "巴黎", country_code: "FR", languages: ["fr"], service_types: ["walking"] };
    expect(
      guideMatchesMarketAdvancedFilters(guide, {
        country: "法国",
        city: "",
        languages: [],
        serviceTypes: [],
      }),
    ).toBe(true);
  });

  it("normalizes write path to canonical slugs", () => {
    expect(normalizeGuideLanguageForWrite("英语")).toBe("en");
    expect(normalizeGuideServiceTypeForWrite("向导服务")).toBe("walking");
    expect(marketGuideServiceTokensMatch("culture", "陪玩服务")).toBe(false);
  });
});
