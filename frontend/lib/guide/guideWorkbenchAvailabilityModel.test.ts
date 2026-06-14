import { describe, expect, it } from "vitest";
import { countGuideOccupiedDaysThisMonth } from "./guideWorkbenchAvailabilityModel";

describe("guideWorkbenchAvailabilityModel", () => {
  it("counts occupied days from today through month end", () => {
    const now = new Date("2026-06-12T12:00:00Z");
    const { occupied } = countGuideOccupiedDaysThisMonth(
      [{ start_date: "2026-06-14", end_date: "2026-06-16" }],
      now,
    );
    expect(occupied).toBe(3);
  });

  it("ignores past occupied days in current month", () => {
    const now = new Date("2026-06-12T12:00:00Z");
    const { occupied, totalFutureOrToday } = countGuideOccupiedDaysThisMonth(
      [{ start_date: "2026-06-01", end_date: "2026-06-05" }],
      now,
    );
    expect(occupied).toBe(0);
    expect(totalFutureOrToday).toBeGreaterThan(0);
  });
});
