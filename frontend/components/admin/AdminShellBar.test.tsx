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

vi.mock("@/lib/admin/useAdminHomeInbox", () => ({
  useAdminHomeInbox: () => ({
    counts: { provider: 0, steward: 0, approvals: 0, reports: 0 },
    channels: {
      provider: { count: 0, permissionDenied: false, errorKind: null },
      steward: { count: 0, permissionDenied: false, errorKind: null },
      approvals: { count: 0, permissionDenied: false, errorKind: null },
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

  it("renders cross-check link to /admin/cross-check", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_shell_nav_cross_check" });
    expect(link.getAttribute("href")).toBe("/admin/cross-check");
  });

  it("marks cross-check as current on /admin/cross-check", () => {
    mockUsePathname.mockReturnValue("/admin/cross-check");
    render(<AdminShellBar />);
    const cc = screen.getByRole("link", { name: "admin_shell_nav_cross_check" });
    expect(cc.getAttribute("aria-current")).toBe("page");
  });

  it("renders drift-summary link to /admin/drift-summary", () => {
    render(<AdminShellBar />);
    const link = screen.getByRole("link", { name: "admin_shell_nav_drift_summary" });
    expect(link.getAttribute("href")).toBe("/admin/drift-summary");
  });

  it("marks drift-summary as current on /admin/drift-summary", () => {
    mockUsePathname.mockReturnValue("/admin/drift-summary");
    render(<AdminShellBar />);
    const ds = screen.getByRole("link", { name: "admin_shell_nav_drift_summary" });
    expect(ds.getAttribute("aria-current")).toBe("page");
  });
});
