import { describe, expect, it } from "vitest";
import {
  authLoginHrefForGuideDetailReturn,
  guideDetailHrefForBind,
  guideDetailHrefForOrdersNewLoginReturn,
  marketHrefForEscrowGuideBind,
  marketHrefForGuideCustomItinerary,
  marketHrefForPickGuide,
  ordersNewHrefForGuide,
} from "./ordersGuideDeepLink";

describe("ordersGuideDeepLink", () => {
  it("builds /orders/new with guide_id", () => {
    const href = ordersNewHrefForGuide("guide-uuid-1");
    expect(href).toBe("/orders/new?guide_id=guide-uuid-1");
  });

  it("builds /orders/new with guide_id and trip dates", () => {
    expect(
      ordersNewHrefForGuide("g1", { startDate: "2026-06-10", endDate: "2026-06-12" }),
    ).toBe("/orders/new?guide_id=g1&start_date=2026-06-10&end_date=2026-06-12");
  });

  it("trims guide id", () => {
    expect(ordersNewHrefForGuide("  x  ")).toBe("/orders/new?guide_id=x");
  });

  it("builds /market with guide_id for custom itinerary", () => {
    expect(marketHrefForGuideCustomItinerary("g1")).toBe("/market?guide_id=g1");
  });

  it("builds /market guides view for pick-guide from orders/new", () => {
    expect(marketHrefForPickGuide()).toBe("/market?view=guides");
  });

  it("builds escrow draft guide bind deep link", () => {
    const id = "00000000-0000-4000-8000-000000000099";
    expect(marketHrefForEscrowGuideBind(id)).toBe(
      `/market?view=guides&bindGuideToOrder=${id}`,
    );
  });

  it("builds guide detail with optional bindGuideToOrder", () => {
    const orderId = "00000000-0000-4000-8000-000000000099";
    expect(guideDetailHrefForBind("g1")).toBe("/guides/g1");
    expect(guideDetailHrefForBind("g1", orderId)).toBe(
      `/guides/g1?bindGuideToOrder=${orderId}`,
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
