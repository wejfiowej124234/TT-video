import { describe, expect, it } from "vitest";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import { formFromOrderItinerary } from "./fromOrderPrefill";
import {
  defaultForm,
  type ItineraryForm,
} from "@/components/itinerary/itineraryNewPage/itineraryNewTypes";

describe("formFromOrderItinerary", () => {
  it("returns existing when no daily and no order head", () => {
    const existing: ItineraryForm = { ...defaultForm, destination: "泰国", city: "曼谷" };
    expect(formFromOrderItinerary(undefined, existing)).toBe(existing);
    expect(formFromOrderItinerary([], existing)).toBe(existing);
  });

  it("merges order head destination, city, travel_date, days", () => {
    const existing = defaultForm;
    const next = formFromOrderItinerary(undefined, existing, {
      destination: "泰国",
      city: "曼谷",
      travel_date: "2026-06-01",
      days: 5,
    });
    expect(next.destination).toBe("泰国");
    expect(next.city).toBe("曼谷");
    expect(next.travel_date).toBe("2026-06-01");
    expect(next.days).toBe(5);
  });

  it("derives days from daily length when order head omits days", () => {
    const existing = defaultForm;
    const daily: UnifiedDayRow[] = [
      { day_index: 1, date: "2026-01-01", city: "曼谷", description: "", content_text: "" },
      { day_index: 2, date: "2026-01-02", city: "曼谷", description: "", content_text: "" },
    ];
    const next = formFromOrderItinerary(daily, existing);
    expect(next.days).toBe(2);
  });
});
