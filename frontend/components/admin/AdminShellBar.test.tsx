import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminShellBar from "./AdminShellBar";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockUsePathname = vi.fn(() => "/admin/orders");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("AdminShellBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin/orders");
  });

  it("renders observability link to /admin/observability", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_observability_title" });
    expect(link.getAttribute("href")).toBe("/admin/observability");
    expect(link.getAttribute("aria-current")).toBeNull();
  });

  it("marks workspace as current on /admin", () => {
    mockUsePathname.mockReturnValue("/admin");
    render(<AdminShellBar />);
    const ws = screen.getByRole("link", { name: "admin_shell_nav_workspace" });
    expect(ws.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "admin_observability_title" }).getAttribute("aria-current")).toBeNull();
  });

  it("marks observability as current on /admin/observability", () => {
    mockUsePathname.mockReturnValue("/admin/observability");
    render(<AdminShellBar />);
    const obs = screen.getByRole("link", { name: "admin_observability_title" });
    expect(obs.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "admin_shell_nav_workspace" }).getAttribute("aria-current")).toBeNull();
  });
});
