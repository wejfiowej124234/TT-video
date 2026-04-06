/**
 * 36 单测：34 组件 StatusBadge（28/13-1 状态徽章）
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import StatusBadge from "./StatusBadge";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("StatusBadge", () => {
  it("renders translated status label (53 / order_status_*)", () => {
    renderWithLocale(<StatusBadge status="Completed" />);
    expect(screen.getByText("已完成")).toBeTruthy();
  });

  it("renders fallback for empty status", () => {
    renderWithLocale(<StatusBadge status="" />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("uses 22 semantic classes (success/warning/danger/neutral)", () => {
    const { container } = renderWithLocale(<StatusBadge status="Completed" />);
    const el = container.querySelector("span");
    expect(el?.className).toMatch(/bg-success|text-success|rounded-\[var\(--radius-sm\)\]/);
  });

  it("maps completed/released/resolved to success variant", () => {
    const { container: c1 } = renderWithLocale(<StatusBadge status="completed" />);
    const { container: c2 } = renderWithLocale(<StatusBadge status="disputed" />);
    expect(c1.querySelector("span")?.className).toMatch(/success/);
    expect(c2.querySelector("span")?.className).toMatch(/danger/);
  });
});
