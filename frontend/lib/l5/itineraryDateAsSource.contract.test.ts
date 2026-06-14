import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ITINERARY_DATE_AS_SOURCE_FROZEN_MARKER,
  ITINERARY_DATE_AS_SOURCE_OPEN,
  ITINERARY_DATE_AS_SOURCE_PROGRAM_ID,
} from "./itineraryDateAsSourceSprintModel";

const root = join(process.cwd());

describe("itinerary-date-as-source phase1 freeze contract (①)", () => {
  it("exports program id + zero open findings", () => {
    expect(ITINERARY_DATE_AS_SOURCE_PROGRAM_ID).toBe("itinerary-date-as-source-phase1");
    expect(ITINERARY_DATE_AS_SOURCE_OPEN).toEqual([]);
    expect(ITINERARY_DATE_AS_SOURCE_FROZEN_MARKER).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("guide detail auto-binds trip from itinerary (no manual calendar primary)", () => {
    const hook = readFileSync(join(root, "app/guides/[id]/useGuideDetailPage.ts"), "utf8");
    const loaded = readFileSync(join(root, "app/guides/[id]/GuideDetailPageLoaded.tsx"), "utf8");
    const calendar = readFileSync(join(root, "components/guides/GuideOccupiedScheduleBlock.tsx"), "utf8");
    expect(hook).toContain("pickDefaultBindOrderId");
    expect(hook).toContain("readLandingResultOrderIds");
    expect(hook).toContain("useBindOrderTripDates");
    expect(loaded).toContain("guide_detail_conversion_trip_ready");
    expect(loaded).toContain("requireTripDates={false}");
    expect(calendar).toContain("guide_availability_itinerary_trip_range");
    expect(calendar).toContain('data-tt-guide-trip-selected="1"');
  });

  it("market bind flow filters busy guides and surfaces trip label", () => {
    const market = readFileSync(join(root, "components/market/useMarketPage.ts"), "utf8");
    const modal = readFileSync(join(root, "components/market/BookGuideModal.tsx"), "utf8");
    const filter = readFileSync(join(root, "lib/guidesAvailableForTrip.ts"), "utf8");
    const availClient = readFileSync(join(root, "lib/guideAvailabilityClient.ts"), "utf8");
    expect(market).toContain("filterGuidesAvailableForTrip");
    expect(availClient).toContain("fetchGuideAvailabilityForMany");
    expect(market).toContain("useBindOrderTripDates");
    expect(modal).toContain("GUIDE_BIND_BLOCK_CODES");
    expect(modal).toContain("book_guide_pickAnotherGuide");
    expect(filter).toContain("occupied.length === 0");
  });

  it("deep links preserve bindGuideToOrder on guide detail", () => {
    const deep = readFileSync(join(root, "lib/ordersGuideDeepLink.ts"), "utf8");
    const drawer = readFileSync(join(root, "components/market/GuideDetailDrawer.tsx"), "utf8");
    expect(deep).toContain("guideDetailHrefForBind");
    expect(drawer).toContain("guideDetailHrefForBind");
    expect(drawer).toContain("bindGuideToOrderId");
  });

  it("trip dates resolve from travel_date + days SSOT", () => {
    const dates = readFileSync(join(root, "lib/guideBookingDates.ts"), "utf8");
    const picker = readFileSync(join(root, "lib/bookGuideItineraryPicker.ts"), "utf8");
    expect(dates).toContain("resolveOrderTripDatesYmd");
    expect(dates).toContain("parse_itinerary_date_range");
    expect(picker).toContain("pickDefaultBindOrderId");
  });
});
