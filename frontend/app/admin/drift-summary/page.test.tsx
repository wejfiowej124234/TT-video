import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDriftSummaryPage from "./page";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockGetAdminDriftSummary = vi.fn();

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    getAdminDriftSummary: () => mockGetAdminDriftSummary(),
  };
});

describe("AdminDriftSummaryPage (C-04)", () => {
  beforeEach(() => {
    mockGetAdminDriftSummary.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows notice, drift_detected, and raw delta JSON", async () => {
    mockGetAdminDriftSummary.mockResolvedValue({
      status: "ok",
      drift_detected: true,
      delta: [{ field: "protocol_reference_doc_version", expected: "1", actual: "2" }],
    });

    render(<AdminDriftSummaryPage />);

    expect(screen.getByTestId("admin-audit-read-only-scope").textContent).toContain(
      "admin_audit_tools_read_only_scope",
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-drift-summary-drift-detected").textContent).toBe("true");
    });

    const deltaEl = screen.getByTestId("admin-drift-summary-delta");
    expect(deltaEl.textContent).toContain("protocol_reference_doc_version");
  });
});
