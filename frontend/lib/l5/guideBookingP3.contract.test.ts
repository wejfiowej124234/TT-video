import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { GUIDE_BOOKING_P3_FINDINGS, GUIDE_BOOKING_P3_OPEN, GUIDE_BOOKING_P3_PROGRAM_ID } from "./guideBookingP3SprintModel";

const root = join(process.cwd());

describe("GD-L5-P3 itinerary-first booking contract", () => {
  it("exports P3 program + zero open findings", () => {
    expect(GUIDE_BOOKING_P3_PROGRAM_ID).toContain("itinerary-first");
    expect(GUIDE_BOOKING_P3_OPEN.length).toBe(0);
    expect(GUIDE_BOOKING_P3_FINDINGS.every((f) => f.status === "closed")).toBe(true);
  });

  it("BookGuideModal wires itinerary picker + bind (no orders/new primary)", () => {
    const modal = readFileSync(join(root, "components/market/BookGuideModal.tsx"), "utf8");
    const picker = readFileSync(join(root, "lib/bookGuideItineraryPicker.ts"), "utf8");
    expect(modal).toContain("fetchBindableOwnItineraryOrders");
    expect(modal).toContain("data-tt-book-guide-itinerary-select");
    expect(modal).toContain("patchOrderGuide");
    expect(modal).toContain("patchOrderTripDates");
    expect(modal).not.toMatch(/book_guide_selectAndBook[\s\S]{0,400}ordersNewHrefForGuide/);
    expect(picker).toContain("isOwnPublishedOpenListing");
  });

  it("E2E helpers target escrow bind not orders/new modal CTA", () => {
    const b469 = readFileSync(join(root, "e2e/b469-guides-drawer-booking-convergence.spec.ts"), "utf8");
    const helper = readFileSync(join(root, "e2e/helpers/bookGuideItineraryFirst.ts"), "utf8");
    expect(b469).toContain("bindGuideFromBookGuideModal");
    expect(b469).toContain("assertGuideItineraryTripAutoSelected");
    expect(b469).not.toContain("pickGuideTripDatesOnDetailPage");
    expect(b469).not.toContain("clickModalSelectItineraryToOrdersNew");
    expect(helper).toContain("data-tt-book-guide-itinerary-select");
  });
});
