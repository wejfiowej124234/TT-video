/**
 * 37 §3：DidRankGuideModal — aria-describedby 指向正文区
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DidRankGuideModal from "./DidRankGuideModal";

vi.mock("@/lib/analytics", () => ({
  trackDidRankEvent: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string }) {
    return <img alt={props.alt} />;
  },
}));

describe("DidRankGuideModal", () => {
  it("dialog has describedby referencing body with nickname", () => {
    render(
      <DidRankGuideModal
        item={{
          id: "g1",
          rank: 1,
          nickname: "TestGuide",
          totalAmountUsdt: 99,
          receptionCount: 3,
          city: "X",
        }}
        period="week"
        onClose={vi.fn()}
        t={(k) => k}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "didRank_guideModalTitle" });
    const db = dialog.getAttribute("aria-describedby");
    expect(db).toBeTruthy();
    const el = document.getElementById(db!);
    expect(el?.textContent).toContain("TestGuide");
    expect(el?.textContent).toContain("didRank_receptions");
  });

  it("shows guide review line when receivedReviewCount > 0", () => {
    render(
      <DidRankGuideModal
        item={{
          id: "g1",
          rank: 1,
          nickname: "TestGuide",
          totalAmountUsdt: 99,
          receptionCount: 3,
          receivedReviewCount: 2,
          avgReceivedReviewScore: 4.2,
        }}
        period="week"
        onClose={vi.fn()}
        t={(k) => k}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "didRank_guideModalTitle" });
    expect(dialog.textContent).toContain("didRank_avgScore_short");
    expect(dialog.textContent).toContain("didRank_receivedReviews_unit");
  });

  it("copy highlight button is aria-busy until clipboard settles", async () => {
    let release: (v: void) => void;
    const delayed = new Promise<void>((res) => {
      release = res;
    });
    const writeText = vi.fn(() => delayed);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(
      <DidRankGuideModal
        item={{
          id: "g1",
          rank: 1,
          nickname: "TestGuide",
          totalAmountUsdt: 99,
          receptionCount: 3,
        }}
        period="week"
        onClose={vi.fn()}
        t={(k) => k}
      />
    );
    const copyBtn = screen.getByRole("button", { name: "didRank_copyHighlightLink" });
    try {
      fireEvent.click(copyBtn);
      expect(copyBtn.getAttribute("aria-busy")).toBe("true");
      release!();
      await waitFor(() => expect(copyBtn.getAttribute("aria-busy")).toBeNull());
    } finally {
      Reflect.deleteProperty(navigator, "clipboard");
    }
  });
});
