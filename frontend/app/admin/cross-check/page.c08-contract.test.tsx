import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminCrossCheckPage from "./page";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

/** C-08：不 mock apiClient，用 stub fetch 锁定仅 GET、无写体；DOM 无按钮/表单/链上入口。 */
describe("AdminCrossCheckPage C-08 read-only contract", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(async () =>
      ({
        ok: true,
        text: async () =>
          JSON.stringify({
            status: "ok",
            fee_pool_projection: { source_kind: "projection", body: { x: 1 } },
            governance_pool_chain: { source_kind: "chain_ssot", body: {} },
            protocol_reference: { source_kind: "reference", body: {} },
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
    const { container } = render(<AdminCrossCheckPage />);

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1));

    for (const [input, init] of fetchMock.mock.calls) {
      expect(String(input)).toContain("/api/v1/admin/cross-check");
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
    expect(screen.getByText("admin_cross_check_subtitle")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("admin_cross_check_slots_region_hint")).toBeTruthy();
    });
  });
});
