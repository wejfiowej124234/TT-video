import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminHomeClient from "./AdminHomeClient";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/useAdminMetaBuildFromPublicMeta", () => ({
  useAdminMetaBuildFromPublicMeta: () => ({
    meta: null,
    loading: false,
    error: null,
  }),
}));

vi.mock("@/components/admin/AdminMetaBuildPanel", () => ({
  AdminMetaBuildSection: () => null,
}));

describe("AdminHomeClient (C-07)", () => {
  it("exposes cross-check and drift-summary from header quick links and audit cards with read-only title hints", () => {
    render(<AdminHomeClient />);

    const all = screen.getAllByRole("link");
    const cross = all.filter((a) => a.getAttribute("href") === "/admin/cross-check");
    const drift = all.filter((a) => a.getAttribute("href") === "/admin/drift-summary");
    expect(cross.length).toBeGreaterThanOrEqual(2);
    expect(drift.length).toBeGreaterThanOrEqual(2);

    const headerCross = cross.find((a) => a.getAttribute("title") === "admin_audit_tools_read_only_scope");
    const headerDrift = drift.find((a) => a.getAttribute("title") === "admin_audit_tools_read_only_scope");
    expect(headerCross).toBeTruthy();
    expect(headerDrift).toBeTruthy();

    expect(screen.getByText("admin_home_desc_cross_check")).toBeTruthy();
    expect(screen.getByText("admin_home_desc_drift_summary")).toBeTruthy();
  });
});
