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
  useRouter: () => ({
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/admin/useAdminHomeInbox", () => ({
  useAdminHomeInbox: () => ({
    counts: { provider: 0, guide: 0, steward: 0, approvals: 0, disputes: 0, reports: 0 },
    channels: {
      provider: { count: 0, permissionDenied: false, errorKind: null },
      guide: { count: 0, permissionDenied: false, errorKind: null },
      steward: { count: 0, permissionDenied: false, errorKind: null },
      approvals: { count: 0, permissionDenied: false, errorKind: null },
      disputes: { count: 0, permissionDenied: false, errorKind: null },
      reports: { count: 0, permissionDenied: false, errorKind: null },
    },
    loading: false,
    error: false,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/admin/useAdminCapabilities", () => ({
  useAdminCapabilities: () => ({
    permissionsLoaded: true,
    capabilitiesUnavailable: false,
    hasPermission: () => true,
    role: "admin",
    consoleRole70: "SuperAdmin",
    loading: false,
  }),
}));

vi.mock("@/lib/admin/useAdminEffectiveShellRole", () => ({
  useAdminEffectiveShellRole: () => ({
    previewRole: null,
    dbRole: "SuperAdmin",
    shellFilterRole: "SuperAdmin",
    mode: "db",
    consoleRoleSource: null,
  }),
}));

vi.mock("@/lib/admin/useAdminShellActor", () => ({
  useAdminShellActor: () => ({ role: "super_admin", loading: false, roleLabelKey: null }),
}));

vi.mock("@/lib/admin/useAdminShellSidebarVisible", () => ({
  useAdminShellSidebarVisible: () => false,
}));

/**
 * Inbox Focus Publish IA · shell is hub-trimmed (ADMIN_SHELL_SIDEBAR_GROUPS).
 * Observability / cross-check / drift-summary live in hub SSOT, not top-nav leaves.
 * Cut C OD-C-02: finance operator entry is `/admin/finance-suite`.
 */
describe("AdminShellBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin/orders");
  });

  it("renders workspace link to /admin", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_shell_nav_workspace" });
    expect(link.getAttribute("href")).toBe("/admin");
    expect(link.getAttribute("aria-current")).toBeNull();
  });

  it("marks workspace as current on /admin", () => {
    mockUsePathname.mockReturnValue("/admin");
    render(<AdminShellBar />);
    const ws = screen.getByRole("link", { name: "admin_shell_nav_workspace" });
    expect(ws.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "admin_shell_nav_finance_short" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("renders finance-suite as sole finance shell entry (OD-C-02)", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_shell_nav_finance_short" });
    expect(link.getAttribute("href")).toBe("/admin/finance-suite");
    expect(screen.queryByRole("link", { name: "admin_shell_nav_finance" })).toBeNull();
  });

  it("marks finance-suite as current on /admin/finance-suite", () => {
    mockUsePathname.mockReturnValue("/admin/finance-suite");
    render(<AdminShellBar />);
    const fin = screen.getByRole("link", { name: "admin_shell_nav_finance_short" });
    expect(fin.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "admin_shell_nav_workspace" }).getAttribute("aria-current")).toBeNull();
  });

  it("renders disputes operations leaf", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_shell_nav_disputes_short" });
    expect(link.getAttribute("href")).toBe("/admin/disputes");
  });

  it("marks orders as current on /admin/orders", () => {
    mockUsePathname.mockReturnValue("/admin/orders");
    render(<AdminShellBar />);
    const orders = screen.getByRole("link", { name: "admin_shell_nav_orders_short" });
    expect(orders.getAttribute("aria-current")).toBe("page");
  });

  it("does not expose legacy deep observability / governance leaves in top nav", () => {
    render(<AdminShellBar />);
    expect(screen.queryByRole("link", { name: "admin_observability_title" })).toBeNull();
    expect(screen.queryByRole("link", { name: "admin_shell_nav_cross_check" })).toBeNull();
    expect(screen.queryByRole("link", { name: "admin_shell_nav_drift_summary" })).toBeNull();
  });
});
