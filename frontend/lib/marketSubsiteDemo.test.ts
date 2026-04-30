import { describe, expect, it } from "vitest";
import {
  DEMO_ACQUISITION_LISTINGS,
  DEMO_MERCHANT_LISTINGS,
  demoAcquisitionListingIds,
  demoMerchantListingIds,
  getDemoAcquisitionListing,
  getDemoMerchantListing,
  pickL10n,
} from "./marketSubsiteDemo";

describe("marketSubsiteDemo", () => {
  it("exposes stable listing ids for static params", () => {
    expect(DEMO_MERCHANT_LISTINGS.length).toBeGreaterThanOrEqual(3);
    expect(DEMO_ACQUISITION_LISTINGS.length).toBeGreaterThanOrEqual(3);
    expect(demoMerchantListingIds()).toEqual(DEMO_MERCHANT_LISTINGS.map((x) => x.id));
    expect(demoAcquisitionListingIds()).toEqual(DEMO_ACQUISITION_LISTINGS.map((x) => x.id));
  });

  it("resolves listings by id", () => {
    expect(getDemoMerchantListing("m-seaside-suite")).toBeDefined();
    expect(getDemoMerchantListing("missing")).toBeUndefined();
    expect(getDemoAcquisitionListing("a-lux-bag")).toBeDefined();
  });

  it("pickL10n selects locale", () => {
    const s = { zh: "你好", en: "Hi" };
    expect(pickL10n(s, "zh")).toBe("你好");
    expect(pickL10n(s, "en")).toBe("Hi");
  });
});
