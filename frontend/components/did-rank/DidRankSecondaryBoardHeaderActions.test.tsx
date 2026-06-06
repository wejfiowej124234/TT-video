import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DidRankSecondaryBoardHeaderActions } from "./DidRankSecondaryBoardHeaderActions";

vi.mock("@/lib/analytics", () => ({
  trackDidRankEvent: vi.fn(),
}));

const t = (k: string) => k;

describe("DidRankSecondaryBoardHeaderActions", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders nothing without highlightUserId", () => {
    const { container } = render(
      <DidRankSecondaryBoardHeaderActions
        board="provider"
        period="all"
        highlightUserId={null}
        t={t}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders go-to-my-rank and copy link when highlight set", () => {
    render(
      <DidRankSecondaryBoardHeaderActions
        board="provider"
        period="week"
        highlightUserId="11111111-1111-4111-8111-111111111111"
        t={t}
      />,
    );
    expect(screen.getByText("didRank_goToMyRank")).toBeTruthy();
    expect(screen.getByText("didRank_copyRankLink")).toBeTruthy();
  });

  it("scrolls to secondary row on go-to-my-rank submit", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const el = document.createElement("li");
    el.id = `did-rank-secondary-row-provider-${id}`;
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    render(
      <DidRankSecondaryBoardHeaderActions
        board="provider"
        period="all"
        highlightUserId={id}
        t={t}
      />,
    );

    fireEvent.submit(screen.getByText("didRank_goToMyRank").closest("form")!);
    expect(el.scrollIntoView).toHaveBeenCalled();
    el.remove();
  });
});
