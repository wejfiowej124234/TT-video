/**
 * 54-S4：风险提示区深色底上正文为浅色字（text-slate-300）
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import EscrowRiskNotice from "./EscrowRiskNotice";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("EscrowRiskNotice (54-S4)", () => {
  it("uses light body text on dark panel (title warning token, list slate-300)", () => {
    const { container } = render(<EscrowRiskNotice disputeDeadlineAt="2026-12-31" disputeWindowExpired={false} />);
    const title = container.querySelector("p.text-small.font-semibold");
    const list = container.querySelector("ul.text-slate-300");
    expect(title?.textContent).toBe("escrow_riskTitle");
    expect(title?.className).toMatch(/text-warning/);
    expect(list).toBeTruthy();
    expect(list?.className).toContain("text-slate-300");
  });

  it("shows pending copy when no deadline", () => {
    const { container } = render(<EscrowRiskNotice />);
    expect(container.textContent).toContain("escrow_disputeWindowPending");
  });
});
