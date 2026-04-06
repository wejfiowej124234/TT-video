/**
 * 54-S10：国家列表前三位为中国、日本、韩国；产品期十国顺序与 ISO 单源一致（CN→ES）。
 */
import { describe, it, expect } from "vitest";
import {
  COUNTRY_OPTIONS,
  CITIES_BY_COUNTRY,
  LANGUAGES_BY_COUNTRY,
  productCountryZhForCityName,
} from "./geoOptions";
import { PRODUCT_COUNTRIES } from "./productCountries";

const PRODUCT_COUNTRY_ORDER = PRODUCT_COUNTRIES.map((c) => c.nameZh);

describe("geoOptions (54-S10)", () => {
  it("first three countries are 中国、日本、韩国", () => {
    expect(COUNTRY_OPTIONS.slice(0, 3).map((c) => c.value)).toEqual(["中国", "日本", "韩国"]);
  });

  it("product country list order is CN→ES (ten countries)", () => {
    expect(COUNTRY_OPTIONS.map((c) => c.value)).toEqual([...PRODUCT_COUNTRY_ORDER]);
  });

  it("韩国 has at least one city", () => {
    expect((CITIES_BY_COUNTRY["韩国"] ?? []).length).toBeGreaterThan(0);
  });

  it("韩国 has language options for market / guide filter", () => {
    expect((LANGUAGES_BY_COUNTRY["韩国"] ?? []).length).toBeGreaterThan(0);
  });

  it("阿联酋 has city and language options", () => {
    expect((CITIES_BY_COUNTRY["阿联酋"] ?? []).length).toBeGreaterThan(0);
    expect((LANGUAGES_BY_COUNTRY["阿联酋"] ?? []).length).toBeGreaterThan(0);
  });

  it("productCountryZhForCityName maps listed cities to country zh", () => {
    expect(productCountryZhForCityName("杭州")).toBe("中国");
    expect(productCountryZhForCityName(" 大阪 ")).toBe("日本");
    expect(productCountryZhForCityName("未知城")).toBeNull();
  });
});
