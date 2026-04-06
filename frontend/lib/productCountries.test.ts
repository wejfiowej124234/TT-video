import { describe, expect, it } from "vitest";
import { isAllowedProductIso3166, isAllowedProductZhCountryName, PRODUCT_COUNTRIES } from "./productCountries";

describe("productCountries", () => {
  it("has ten countries in CN→ES order", () => {
    expect(PRODUCT_COUNTRIES.map((c) => c.iso).join(",")).toBe(
      "CN,JP,KR,SG,TH,AE,US,AU,FR,ES"
    );
  });

  it("isAllowedProductIso3166", () => {
    expect(isAllowedProductIso3166("cn")).toBe(true);
    expect(isAllowedProductIso3166("FR")).toBe(true);
    expect(isAllowedProductIso3166("DE")).toBe(false);
  });

  it("isAllowedProductZhCountryName", () => {
    expect(isAllowedProductZhCountryName("中国")).toBe(true);
    expect(isAllowedProductZhCountryName(" 阿联酋 ")).toBe(true);
    expect(isAllowedProductZhCountryName("意大利")).toBe(false);
  });
});
