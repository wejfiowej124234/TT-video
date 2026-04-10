import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminCrossCheckPage from "./page";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockGetAdminCrossCheck = vi.fn();

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    getAdminCrossCheck: () => mockGetAdminCrossCheck(),
  };
});

describe("AdminCrossCheckPage (C-03 / C-05)", () => {
  beforeEach(() => {
    mockGetAdminCrossCheck.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders three slot sections with source_kind and raw JSON body", async () => {
    mockGetAdminCrossCheck.mockResolvedValue({
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: { slot: "fee", n: 1 } },
      governance_pool_chain: { source_kind: "chain_ssot", body: { slot: "pool" } },
      protocol_reference: { source_kind: "reference", body: { slot: "pref" } },
    });

    render(<AdminCrossCheckPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-cross-check-slot-fee_pool_projection")).toBeTruthy();
    });

    expect(screen.getByTestId("admin-cross-check-slot-governance_pool_chain")).toBeTruthy();
    expect(screen.getByTestId("admin-cross-check-slot-protocol_reference")).toBeTruthy();

    const feeBlock = screen.getByTestId("admin-cross-check-slot-fee_pool_projection");
    expect(feeBlock.textContent).toContain("projection");
    expect(feeBlock.textContent).toContain('"slot": "fee"');

    const poolBlock = screen.getByTestId("admin-cross-check-slot-governance_pool_chain");
    expect(poolBlock.textContent).toContain("chain_ssot");

    const prefBlock = screen.getByTestId("admin-cross-check-slot-protocol_reference");
    expect(prefBlock.textContent).toContain("reference");
  });

  it("shows shared read-only scope notice (C-06)", async () => {
    mockGetAdminCrossCheck.mockResolvedValue({
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: {} },
      governance_pool_chain: { source_kind: "chain_ssot", body: {} },
      protocol_reference: { source_kind: "reference", body: {} },
    });
    render(<AdminCrossCheckPage />);
    expect(screen.getByTestId("admin-audit-read-only-scope").textContent).toContain(
      "admin_audit_tools_read_only_scope",
    );
    await waitFor(() => {
      expect(screen.getByTestId("admin-cross-check-slots-region")).toBeTruthy();
    });
  });

  it("groups slots in a landmark region with in-page jump links", async () => {
    mockGetAdminCrossCheck.mockResolvedValue({
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: {} },
      governance_pool_chain: { source_kind: "chain_ssot", body: {} },
      protocol_reference: { source_kind: "reference", body: {} },
    });

    render(<AdminCrossCheckPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-cross-check-slots-region")).toBeTruthy();
    });

    const nav = screen.getByTestId("admin-cross-check-slots-jump-nav");
    const feeJump = nav.querySelector('a[href="#cross-check-slot-fee_pool_projection"]');
    const poolJump = nav.querySelector('a[href="#cross-check-slot-governance_pool_chain"]');
    const prefJump = nav.querySelector('a[href="#cross-check-slot-protocol_reference"]');
    expect(feeJump).toBeTruthy();
    expect(poolJump).toBeTruthy();
    expect(prefJump).toBeTruthy();

    expect(document.getElementById("cross-check-slot-fee_pool_projection")).toBeTruthy();
  });
});
