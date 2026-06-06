import { describe, expect, it } from "vitest";
import {
  authLoginHrefForGuideDetailReturn,
  guideDetailHrefForOrdersNewLoginReturn,
  marketHrefForEscrowGuideBind,
  marketHrefForGuideCustomItinerary,
  ordersNewHrefForGuide,
} from "./ordersGuideDeepLink";

describe("ordersGuideDeepLink", () => {
  it("builds /orders/new with guide_id", () => {
    const href = ordersNewHrefForGuide("guide-uuid-1");
    expect(href).toBe("/orders/new?guide_id=guide-uuid-1");
  });

  it("trims guide id", () => {
    expect(ordersNewHrefForGuide("  x  ")).toBe("/orders/new?guide_id=x");
  });

  it("builds /market with guide_id for custom itinerary", () => {
    expect(marketHrefForGuideCustomItinerary("g1")).toBe("/market?guide_id=g1");
  });

  it("builds escrow draft guide bind deep link", () => {
    const id = "00000000-0000-4000-8000-000000000099";
    expect(marketHrefForEscrowGuideBind(id)).toBe(
      `/market?view=split&bindGuideToOrder=${id}`,
    );
  });

  it("builds guide detail path for login return when guide id present", () => {
    expect(guideDetailHrefForOrdersNewLoginReturn("  guide-uuid-1  ")).toBe("/guides/guide-uuid-1");
    expect(guideDetailHrefForOrdersNewLoginReturn("")).toBeNull();
    expect(guideDetailHrefForOrdersNewLoginReturn("   ")).toBeNull();
  });

  it("builds auth login href with returnUrl to guide detail", () => {
    expect(authLoginHrefForGuideDetailReturn("g1")).toBe(
      `/auth/login?returnUrl=${encodeURIComponent("/guides/g1")}`,
    );
    expect(authLoginHrefForGuideDetailReturn("")).toBeNull();
  });
});
