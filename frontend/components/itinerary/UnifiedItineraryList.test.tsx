/**
 * 54-S2：有 attractions[].image 时展示配图；did 变体景区卡片为深色区浅色字
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import UnifiedItineraryList from "./UnifiedItineraryList";

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string; src: string }) {
    return <img src={props.src} alt={props.alt} />;
  },
}));

const dayWithAttraction: UnifiedDayRow = {
  day_index: 1,
  city: "TestCity",
  content_text: "Day summary line",
  attractions: [
    { name: "Scenic Spot", image: "https://example.com/spot.jpg", intro: "Nice place" },
  ],
};

describe("UnifiedItineraryList (54-S2)", () => {
  it("renders attraction image when API provides image URL", () => {
    render(
      <UnifiedItineraryList
        days={[dayWithAttraction]}
        collapsible={false}
        variant="did"
        t={(k) => k}
      />
    );
    const img = screen.getByRole("img", { name: "Scenic Spot" });
    expect(img.getAttribute("src")).toBe("https://example.com/spot.jpg");
    expect(screen.getByText("Scenic Spot")).toBeTruthy();
    expect(screen.getByText("Nice place")).toBeTruthy();
  });

  it("did variant day description uses slate body tone", () => {
    const { container } = render(
      <UnifiedItineraryList
        days={[dayWithAttraction]}
        collapsible={false}
        variant="did"
        t={(k) => k}
      />
    );
    const desc = screen.getByText("Day summary line");
    expect(desc.className).toContain("text-slate-300");
    expect(container.innerHTML).toMatch(/border-slate-600/);
  });

  it("renders dining row image when dining[].image is set", () => {
    const day: UnifiedDayRow = {
      day_index: 1,
      content_text: "Meal day",
      dining: [{ name: "Local Bistro", image: "https://example.com/dine.jpg", description: "Tasty" }],
    };
    render(<UnifiedItineraryList days={[day]} collapsible={false} variant="did" t={(k) => k} />);
    const img = screen.getByRole("img", { name: "Local Bistro" });
    expect(img.getAttribute("src")).toBe("https://example.com/dine.jpg");
    expect(screen.getByText("Tasty")).toBeTruthy();
  });

  it("renders hotel block image when hotel.image is set", () => {
    const day: UnifiedDayRow = {
      day_index: 1,
      content_text: "Night",
      hotel: { name: "Bay Hotel", image: "https://example.com/hotel.jpg", intro: "Sea view" },
    };
    render(<UnifiedItineraryList days={[day]} collapsible={false} variant="did" t={(k) => k} />);
    const img = screen.getByRole("img", { name: "Bay Hotel" });
    expect(img.getAttribute("src")).toBe("https://example.com/hotel.jpg");
    expect(screen.getByText("Sea view")).toBeTruthy();
  });

  it("marketDark variant quote summary uses warm ref-sun heading", () => {
    render(
      <UnifiedItineraryList
        days={[dayWithAttraction]}
        amountBreakdown={{ hotel: 10, total_budget: 99 }}
        collapsible={false}
        variant="marketDark"
        t={(k) => k}
      />,
    );
    const quoteTitle = screen.getByRole("heading", { name: "escrow_quoteSummary" });
    expect(quoteTitle.className).toContain("text-ref-sun");
    expect(quoteTitle.className).not.toContain("text-cyan");
  });

  it("did variant quote summary uses cyan heading and lists breakdown", () => {
    render(
      <UnifiedItineraryList
        days={[dayWithAttraction]}
        amountBreakdown={{ hotel: 10, total_budget: 99 }}
        collapsible={false}
        variant="did"
        t={(k) => k}
      />
    );
    const quoteTitle = screen.getByRole("heading", { name: "escrow_quoteSummary" });
    expect(quoteTitle.className).toContain("text-cyan-200");
    expect(screen.getByText(/escrow_totalBudget/)).toBeTruthy();
  });

  it("shows even-split per-day estimate when total_budget is set and price_note is absent", () => {
    const d1: UnifiedDayRow = { day_index: 1, content_text: "A" };
    const d2: UnifiedDayRow = { day_index: 2, content_text: "B" };
    render(
      <UnifiedItineraryList
        days={[d1, d2]}
        amountBreakdown={{ total_budget: 200 }}
        currency="USDC"
        collapsible={false}
        variant="did"
        t={(k) => k}
      />
    );
    expect(screen.getAllByText(/itin_dayCostEvenSplitLabel/).length).toBe(2);
    expect(screen.getAllByText(/100\.00/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/USDC/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/itin_dayCostEvenSplitHint/).length).toBe(2);
  });
});
