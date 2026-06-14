/**
 * GD-L5-P3 · 向导预约 itinerary-first 主链 Sprint SSOT（①）
 */
export const GUIDE_BOOKING_P3_PROGRAM_ID = "guide-booking-l5-p3-itinerary-first-20260609" as const;

export type GuideBookingP3Finding = {
  id: string;
  title: string;
  status: "closed" | "open";
};

export const GUIDE_BOOKING_P3_FINDINGS: readonly GuideBookingP3Finding[] = [
  {
    id: "GD-L5-P3-01",
    title: "BookGuideModal fetches bindable own itineraries (no /orders/new primary)",
    status: "closed",
  },
  {
    id: "GD-L5-P3-02",
    title: "itinerary <select> + bind PATCH + optional trip-dates PATCH",
    status: "closed",
  },
  {
    id: "GD-L5-P3-03",
    title: "zero itineraries → primary CTA create itinerary first",
    status: "closed",
  },
  {
    id: "GD-L5-P3-04",
    title: "E2E b468/b469 itinerary-first bind → /escrow (not /orders/new)",
    status: "closed",
  },
] as const;

export const GUIDE_BOOKING_P3_OPEN = GUIDE_BOOKING_P3_FINDINGS.filter((f) => f.status === "open");
