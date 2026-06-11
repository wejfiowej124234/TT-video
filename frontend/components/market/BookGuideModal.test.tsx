/**

 * 37 §3：BookGuideModal — aria-describedby 含向导名与说明；GD-L5-P3 itinerary-first

 */

import React from "react";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";

import BookGuideModal from "./BookGuideModal";

import { getOrder, patchOrderGuide } from "@/lib/apiClient";
import { fetchGuideAvailabilityCached } from "@/lib/guideAvailabilityClient";

import { fetchBindableOwnItineraryOrders } from "@/lib/bookGuideItineraryPicker";



vi.mock("@/components/LocaleProvider", () => {

  const t = (k: string) => k;

  return { useTranslation: () => ({ t, locale: "zh" }) };

});



vi.mock("next/navigation", () => ({

  useRouter: () => ({ push: vi.fn() }),

}));



vi.mock("@/lib/analytics", () => ({

  trackMarketEvent: vi.fn(),

}));



vi.mock("@/lib/bookGuideItineraryPicker", async (importOriginal) => {

  const actual = await importOriginal<typeof import("@/lib/bookGuideItineraryPicker")>();

  return {

    ...actual,

    fetchBindableOwnItineraryOrders: vi.fn().mockResolvedValue([]),

    formatBookGuideItineraryOptionLabel: vi.fn(() => "trip-label"),

  };

});



vi.mock("@/lib/guideAvailabilityClient", () => ({

  fetchGuideAvailabilityCached: vi.fn().mockResolvedValue({ occupied_ranges: [] }),

}));



vi.mock("@/lib/apiClient", () => ({

  getIdempotencyKey: vi.fn(() => "idem-1"),

  getOrder: vi.fn(),

  patchOrderGuide: vi.fn(),

  patchOrderTripDates: vi.fn(),

}));



describe("BookGuideModal", () => {

  beforeEach(() => {

    vi.mocked(fetchGuideAvailabilityCached).mockResolvedValue({ occupied_ranges: [] });

    vi.mocked(getOrder).mockResolvedValue({
      order: { travel_date: "2026-06-10", days: 3 },
    });

    vi.mocked(fetchBindableOwnItineraryOrders).mockResolvedValue([]);

  });



  it("dialog describedby includes subtitle id when guideName is set", () => {

    render(<BookGuideModal guideId="g1" guideName="Guide One" onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "book_guide_title" });

    const ref = dialog.getAttribute("aria-describedby");

    expect(ref).toBeTruthy();

    const ids = ref!.split(/\s+/).filter(Boolean);

    expect(ids.length).toBe(2);

    expect(ids.every((id) => document.getElementById(id))).toBe(true);

    expect(ids.some((id) => document.getElementById(id)?.textContent === "Guide One")).toBe(true);

  });



  it("no itineraries: primary CTA links to itinerary/new (not orders/new)", async () => {

    render(<BookGuideModal guideId="g1" onClose={vi.fn()} />);

    await waitFor(() => {

      expect(screen.getByText("book_guide_noItineraryHint")).toBeTruthy();

    });

    const primary = screen.getByRole("link", { name: "book_guide_createFirst" });

    expect(primary.getAttribute("href")).toContain("/itinerary/new?guide_id=g1");

    expect(screen.queryByRole("link", { name: "book_guide_selectAndBook" })).toBeNull();

  });



  it("with itineraries: shows select and bind button", async () => {

    vi.mocked(fetchBindableOwnItineraryOrders).mockResolvedValue([

      {

        id: "order-1",

        order_id: "order-1",

        status: "created",

        state: "created",

      },

    ]);

    render(<BookGuideModal guideId="g1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(document.querySelector('[data-tt-book-guide-itinerary-select="1"]')).toBeTruthy();
    });

    const select = document.querySelector('[data-tt-book-guide-itinerary-select="1"]');

    expect(select).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "book_guide_bindAndBook" })).toBeTruthy();
    });
  });

  it("pinned bind mode blocks when trip overlaps occupied ranges", async () => {
    vi.mocked(fetchGuideAvailabilityCached).mockResolvedValue({
      occupied_ranges: [{ order_id: "o1", start_date: "2026-06-10", end_date: "2026-06-12" }],
    });
    render(
      <BookGuideModal
        guideId="g1"
        guideName="Guide One"
        bindOrderId="order-1"
        tripStart="2026-06-11"
        tripEnd="2026-06-13"
        onClose={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("book_guide_tripConflict");
    });
    expect(screen.queryByRole("button", { name: "book_guide_replaceSelect" })).toBeNull();
    expect(screen.getAllByRole("link", { name: "book_guide_pickAnotherGuide" })[0]!.getAttribute("href")).toBe(
      "/market?view=guides&bindGuideToOrder=order-1",
    );
  });

  it("pinned bind skips PATCH when order already has same guide", async () => {
    vi.mocked(fetchGuideAvailabilityCached).mockResolvedValue({
      occupied_ranges: [{ order_id: "other", start_date: "2026-06-01", end_date: "2026-06-05" }],
    });
    vi.mocked(getOrder).mockResolvedValue({
      order: { id: "order-1", guide_id: "g1" },
    });
    render(
      <BookGuideModal
        guideId="g1"
        guideName="Guide One"
        bindOrderId="order-1"
        tripStart="2026-06-16"
        tripEnd="2026-06-16"
        onClose={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("book_guide_alreadyBoundHint")).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "book_guide_returnToOrder" })).toBeTruthy();
    });
    screen.getByRole("button", { name: "book_guide_returnToOrder" }).click();
    await waitFor(() => {
      expect(patchOrderGuide).not.toHaveBeenCalled();
    });
  });

  it("pinned bind mode allows bind when guide has no occupied ranges", async () => {
    vi.mocked(fetchGuideAvailabilityCached).mockResolvedValue({ occupied_ranges: [] });
    render(
      <BookGuideModal
        guideId="g1"
        guideName="Guide One"
        bindOrderId="order-1"
        tripStart="2026-06-15"
        tripEnd="2026-06-17"
        onClose={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "book_guide_replaceSelect" })).toBeTruthy();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

});


