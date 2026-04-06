import { describe, expect, it } from "vitest";
import { applyLandingDatePick } from "./landingDateRangePick";

describe("applyLandingDatePick", () => {
  const min = "2026-01-01";

  it("ignores empty or before minDate", () => {
    expect(applyLandingDatePick({ picked: "", minDate: min, startDate: "", endDate: "" })).toEqual({
      startDate: "",
      endDate: "",
      shouldCloseCalendar: false,
    });
    expect(applyLandingDatePick({ picked: "2025-12-01", minDate: min, startDate: "", endDate: "" })).toEqual({
      startDate: "",
      endDate: "",
      shouldCloseCalendar: false,
    });
  });

  it("first valid pick sets start only", () => {
    expect(applyLandingDatePick({ picked: "2026-03-10", minDate: min, startDate: "", endDate: "" })).toEqual({
      startDate: "2026-03-10",
      endDate: "",
      shouldCloseCalendar: false,
    });
  });

  it("second pick on or after start sets end and closes", () => {
    expect(
      applyLandingDatePick({
        picked: "2026-03-15",
        minDate: min,
        startDate: "2026-03-10",
        endDate: "",
      })
    ).toEqual({
      startDate: "2026-03-10",
      endDate: "2026-03-15",
      shouldCloseCalendar: true,
    });
  });

  it("second pick before start replaces start", () => {
    expect(
      applyLandingDatePick({
        picked: "2026-03-05",
        minDate: min,
        startDate: "2026-03-10",
        endDate: "",
      })
    ).toEqual({
      startDate: "2026-03-05",
      endDate: "",
      shouldCloseCalendar: false,
    });
  });

  it("pick when range complete resets to new start", () => {
    expect(
      applyLandingDatePick({
        picked: "2026-04-01",
        minDate: min,
        startDate: "2026-03-10",
        endDate: "2026-03-12",
      })
    ).toEqual({
      startDate: "2026-04-01",
      endDate: "",
      shouldCloseCalendar: false,
    });
  });
});
