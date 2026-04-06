/**
 * 37 §3：链下写入托管地址区 — section aria-describedby
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SetEscrowAddressBlock from "./SetEscrowAddressBlock";
import * as apiClient from "@/lib/apiClient";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    postOrderSetEscrowAddress: vi.fn(() => Promise.resolve()),
  };
});

const postMock = apiClient.postOrderSetEscrowAddress as ReturnType<typeof vi.fn>;

describe("SetEscrowAddressBlock", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue(undefined);
  });

  it("section references intro copy via aria-describedby", () => {
    render(<SetEscrowAddressBlock orderId="order-uuid" onSuccess={() => {}} />);
    const region = screen.getByRole("region", { name: "escrow_mockSetEscrowTitle" });
    const db = region.getAttribute("aria-describedby");
    expect(db).toBeTruthy();
    const el = document.getElementById(db!);
    expect(el?.textContent).toContain("escrow_mockSetEscrowDesc");
  });

  it("POST failure shows ApiErrorAlert and common_retry re-submits (B-040)", async () => {
    const onSuccess = vi.fn();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      postMock.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);

      render(<SetEscrowAddressBlock orderId="order-uuid" onSuccess={onSuccess} />);

      const input = screen.getByLabelText("escrow_intentFactContract");
      fireEvent.change(input, { target: { value: "0x1111111111111111111111111111111111111111" } });
      fireEvent.click(screen.getByRole("button", { name: "escrow_writeEscrowAddress" }));

      await waitFor(() => {
        expect(screen.getByText("escrow_writeFailed")).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "common_retry" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(postMock).toHaveBeenCalledTimes(2);
    } finally {
      errSpy.mockRestore();
    }
  });
});
