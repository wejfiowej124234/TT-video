/**
 * B-042：`orderAccept` 失败 ApiErrorAlert + 重试；接单钮禁用时有可读说明
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrderActionsBlock from "./OrderActionsBlock";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const orderAcceptMock = vi.fn();
const orderCancelMock = vi.fn();

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    orderAccept: (orderId: string, key: string) => orderAcceptMock(orderId, key),
    orderCancel: (orderId: string, key: string) => orderCancelMock(orderId, key),
    getIdempotencyKey: () => "idem-key",
  };
});

vi.mock("@/dapp/hooks/useOrderIntentSigner", () => ({
  useOrderIntentSigner: () => ({
    isConnected: false,
    chainMismatch: false,
    isSigning: false,
    submitConfirmCompletionIntent: vi.fn(),
    submitOpenDisputeIntent: vi.fn(),
  }),
}));

const ADDR = "0x1111111111111111111111111111111111111111" as const;

describe("OrderActionsBlock", () => {
  beforeEach(() => {
    orderAcceptMock.mockReset();
    orderCancelMock.mockReset();
  });

  it("orderAccept failure shows ApiErrorAlert and common_retry re-calls accept (B-042)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const onSuccess = vi.fn();
      orderAcceptMock
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce(undefined);

      render(
        <OrderActionsBlock
          orderId="order-uuid"
          state="created"
          hasEscrow={false}
          onSuccess={onSuccess}
          guideWalletAddress={ADDR}
          connectedAddress={ADDR}
          expectedChainId={1}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "escrow_accept" }));

      await waitFor(() => {
        expect(screen.getByText("order_error_accept_failed")).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "common_retry" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(orderAcceptMock).toHaveBeenCalledTimes(2);
    } finally {
      errSpy.mockRestore();
    }
  });

  it("accept button exposes title and status when another action is pending", async () => {
    orderCancelMock.mockImplementation(() => new Promise(() => {}));

    render(
      <OrderActionsBlock
        orderId="order-uuid"
        state="created"
        hasEscrow={false}
        onSuccess={() => {}}
        guideWalletAddress={ADDR}
        connectedAddress={ADDR}
        expectedChainId={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "escrow_cancelOrder" }));

    await waitFor(() => {
      expect(screen.getByText("escrow_acceptBlocked_otherActionPending")).toBeTruthy();
    });
    const acceptBtn = screen.getByRole("button", { name: "escrow_accept" });
    expect(acceptBtn.getAttribute("title")).toBe("escrow_acceptBlocked_otherActionPending");
    expect(acceptBtn.getAttribute("aria-describedby")).toBeTruthy();
  });
});
