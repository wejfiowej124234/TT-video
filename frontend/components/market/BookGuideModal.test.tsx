/**
 * 37 §3：BookGuideModal — aria-describedby 含向导名与说明
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BookGuideModal from "./BookGuideModal";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/analytics", () => ({
  trackMarketEvent: vi.fn(),
}));

describe("BookGuideModal", () => {
  it("dialog describedby includes subtitle id when guideName is set", () => {
    render(
      <BookGuideModal guideId="g1" guideName="Guide One" onClose={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog", { name: "book_guide_title" });
    const ref = dialog.getAttribute("aria-describedby");
    expect(ref).toBeTruthy();
    const ids = ref!.split(/\s+/).filter(Boolean);
    expect(ids.length).toBe(2);
    expect(ids.every((id) => document.getElementById(id))).toBe(true);
    expect(ids.some((id) => document.getElementById(id)?.textContent === "Guide One")).toBe(true);
  });

  it("dialog describedby is single id when no guideName", () => {
    render(<BookGuideModal guideId="g1" onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "book_guide_title" });
    const ref = dialog.getAttribute("aria-describedby");
    const ids = ref!.split(/\s+/).filter(Boolean);
    expect(ids.length).toBe(1);
    expect(document.getElementById(ids[0]!)?.textContent).toContain("book_guide_desc");
  });
});
