import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDriftSummaryPage from "./page";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

/** C-08：不 mock apiClient；契约锁定只读差异页无写请求与无操作入口。 */
describe("AdminDriftSummaryPage C-08 read-only contract", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(async () =>
      ({
        ok: true,
        text: async () =>
          JSON.stringify({
            status: "ok",
            drift_detected: false,
            delta: [],
          }),
      }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("GET-only fetch, no POST body, no action UI, read-only copy keys present", async () => {
    const { container } = render(<AdminDriftSummaryPage />);

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1));

    for (const [input, init] of fetchMock.mock.calls) {
      expect(String(input)).toContain("/api/v1/admin/drift-summary");
      const method = (init?.method ?? "GET").toUpperCase();
      expect(method).toBe("GET");
      expect(init?.body).toBeUndefined();
    }

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.querySelectorAll("form")).toHaveLength(0);
    expect(container.querySelectorAll('input[type="submit"]')).toHaveLength(0);

    const main = screen.getByRole("main");
    expect(main.textContent?.toLowerCase()).not.toMatch(/connect wallet|writecontract|sendtransaction/);

    expect(screen.getByTestId("admin-audit-read-only-scope").textContent).toContain(
      "admin_audit_tools_read_only_scope",
    );
    expect(screen.getByText("admin_drift_summary_subtitle")).toBeTruthy();
  });
});
