/**
 * 37 §3：DidRankRecordModal — aria-describedby 指向正文区
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DidRankRecordModal from "./DidRankRecordModal";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("DidRankRecordModal", () => {
  it("dialog has describedby referencing body with nickname in title", () => {
    render(
      <DidRankRecordModal
        item={{
          id: "t1",
          rank: 1,
          nickname: "TravelerOne",
          totalSpentUsdt: 50,
          countriesCount: 2,
          citiesCount: 3,
        }}
        period="month"
        onClose={vi.fn()}
        t={(k) => k}
      />
    );
    const dialog = screen.getByRole("dialog", { name: /TravelerOne/ });
    const db = dialog.getAttribute("aria-describedby");
    expect(db).toBeTruthy();
    const el = document.getElementById(db!);
    expect(el?.textContent).toContain("didRank_countriesShort");
    expect(el?.textContent).toContain("didRank_citiesShort");
  });
});
