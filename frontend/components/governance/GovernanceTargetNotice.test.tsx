import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GovernanceTargetNotice from "./GovernanceTargetNotice";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("GovernanceTargetNotice", () => {
  it("renders hub target notice with role=note", () => {
    render(<GovernanceTargetNotice />);
    const el = screen.getByRole("note");
    expect(el.textContent).toContain("governance_hub_target_notice");
    expect(el.className).toContain("rounded-[var(--radius-md)]");
  });

  it("merges custom className", () => {
    render(<GovernanceTargetNotice className="mt-3" />);
    expect(screen.getByRole("note").className).toContain("mt-3");
  });
});
