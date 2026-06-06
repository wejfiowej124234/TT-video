import { describe, expect, it } from "vitest";
import { MARKETING_FOOTER_PRODUCT_LINKS, MARKETING_SITE_FOOTER_ID } from "./marketingSiteFooter";

describe("marketingSiteFooter", () => {
  it("exposes stable site footer anchor id", () => {
    expect(MARKETING_SITE_FOOTER_ID).toBe("site-footer");
  });

  it("lists core product footer links", () => {
    expect(MARKETING_FOOTER_PRODUCT_LINKS.map((l) => l.href)).toEqual([
      "/traveltrust",
      "/market",
      "/itinerary/new",
      "/orders",
      "/guides",
      "/community",
    ]);
  });
});
