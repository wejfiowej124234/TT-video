import { describe, expect, it } from "vitest";
import { DEMO_ACQUISITION_LISTINGS, DEMO_MERCHANT_LISTINGS } from "./marketSubsiteDemo";
import {
  filterAcquisitionListings,
  filterMerchantListings,
  parseCountryParam,
  parseMerchantCategoryParam,
  sortAcquisitionListings,
  sortMerchantListings,
  buildMarketSubsiteListingsQueryString,
  applyMarketSubsiteProviderFilters,
} from "./marketSubsiteFilters";

describe("marketSubsiteFilters", () => {
  it("parses country param", () => {
    expect(parseCountryParam(null)).toBe("all");
    expect(parseCountryParam("all")).toBe("all");
    expect(parseCountryParam("JP")).toBe("JP");
    expect(parseCountryParam("xx")).toBe("all");
  });

  it("filters merchants by country and category", () => {
    const jpDining = filterMerchantListings(DEMO_MERCHANT_LISTINGS, "JP", "dining");
    expect(jpDining.map((x) => x.id)).toEqual(["m-rooftop-dinner"]);
    const cnAll = filterMerchantListings(DEMO_MERCHANT_LISTINGS, "CN", "all");
    expect(cnAll.some((x) => x.id === "m-seaside-suite")).toBe(true);
  });

  it("sorts merchants by price", () => {
    const cn = filterMerchantListings(DEMO_MERCHANT_LISTINGS, "CN", "all");
    const asc = sortMerchantListings(cn, "price_asc");
    expect(asc[0].priceUsdc).toBeLessThanOrEqual(asc[asc.length - 1].priceUsdc);
  });

  it("filters acquisition by destination country", () => {
    const cnHealth = filterAcquisitionListings(DEMO_ACQUISITION_LISTINGS, "CN", "health");
    expect(cnHealth.map((x) => x.id)).toEqual(["a-vitamins-bundle", "a-tea-gift"]);
    const sg = filterAcquisitionListings(DEMO_ACQUISITION_LISTINGS, "SG", "all");
    expect(sg.length).toBe(0);
  });

  it("parses merchant category", () => {
    expect(parseMerchantCategoryParam("hotel")).toBe("hotel");
    expect(parseMerchantCategoryParam("bogus")).toBe("all");
  });

  it("sorts acquisition by bounty", () => {
    const list = sortAcquisitionListings([...DEMO_ACQUISITION_LISTINGS], "bounty_desc");
    expect(list[0].bountyMaxUsdc).toBeGreaterThanOrEqual(list[list.length - 1].bountyMaxUsdc);
  });

  it("buildMarketSubsiteListingsQueryString omits defaults", () => {
    expect(
      buildMarketSubsiteListingsQueryString({ country: "all", category: "all", sort: "recent" }),
    ).toBe("");
    expect(
      buildMarketSubsiteListingsQueryString({ country: "JP", category: "dining", sort: "price_asc" }),
    ).toBe("country=JP&category=dining&sort=price_asc");
  });

  it("applyMarketSubsiteProviderFilters matches filter+sort pipeline", () => {
    const out = applyMarketSubsiteProviderFilters(DEMO_MERCHANT_LISTINGS, "CN", "all", "price_asc");
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].priceUsdc).toBeLessThanOrEqual(out[out.length - 1].priceUsdc);
  });
});
