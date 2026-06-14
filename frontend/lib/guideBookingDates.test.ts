import { describe, expect, it } from "vitest";

import {
  formatTripRangeLabel,
  normalizeTripRange,
  resolveOrderTripDatesFromGetOrderPayload,
  resolveOrderTripDatesYmd,
  tripRangeOverlapsOccupied,
} from "./guideBookingDates";

describe("guideBookingDates", () => {
  it("detects overlap with occupied ranges", () => {
    const occupied = [{ start_date: "2026-06-10", end_date: "2026-06-12" }];
    expect(tripRangeOverlapsOccupied("2026-06-09", "2026-06-11", occupied)).toBe(true);
    expect(tripRangeOverlapsOccupied("2026-06-13", "2026-06-15", occupied)).toBe(false);
  });

  it("normalizes trip range", () => {
    expect(normalizeTripRange("2026-06-10", "2026-06-12")).toEqual({
      start: "2026-06-10",
      end: "2026-06-12",
    });
    expect(normalizeTripRange("2026-06-12", "2026-06-10")).toBeNull();
  });

  it("formats trip range label", () => {
    expect(formatTripRangeLabel("2026-06-10", "2026-06-10", "en")).toContain("2026");
  });

  it("resolves trip from start_date/end_date on order", () => {
    expect(
      resolveOrderTripDatesYmd({
        order: { start_date: "2026-06-10", end_date: "2026-06-13" },
      }),
    ).toEqual({ start: "2026-06-10", end: "2026-06-13" });
  });

  it("resolves trip from travel_date + days (inclusive end)", () => {
    expect(
      resolveOrderTripDatesYmd({
        order: { travel_date: "2026-06-10", days: 4 },
      }),
    ).toEqual({ start: "2026-06-10", end: "2026-06-13" });
  });

  it("resolves trip from GET order payload", () => {
    expect(
      resolveOrderTripDatesFromGetOrderPayload({
        order: { travel_date: "2026-06-10", days: 2 },
        itinerary: { daily_itinerary: [{}, {}, {}] },
      }),
    ).toEqual({ start: "2026-06-10", end: "2026-06-11" });
  });
});
