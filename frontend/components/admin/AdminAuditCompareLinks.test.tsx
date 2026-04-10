import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminAuditCompareLinks from "./AdminAuditCompareLinks";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("AdminAuditCompareLinks (C-09)", () => {
  it("links to cross-check and drift-summary with read-only scope title", () => {
    render(<AdminAuditCompareLinks />);

    expect(screen.getByTestId("admin-audit-compare-links")).toBeTruthy();
    expect(screen.getByText("admin_audit_compare_links_heading")).toBeTruthy();

    const cross = screen.getByRole("link", { name: "admin_shell_nav_cross_check" });
    const drift = screen.getByRole("link", { name: "admin_shell_nav_drift_summary" });
    expect(cross.getAttribute("href")).toBe("/admin/cross-check");
    expect(drift.getAttribute("href")).toBe("/admin/drift-summary");
    expect(cross.getAttribute("title")).toBe("admin_audit_tools_read_only_scope");
    expect(drift.getAttribute("title")).toBe("admin_audit_tools_read_only_scope");
  });
});
