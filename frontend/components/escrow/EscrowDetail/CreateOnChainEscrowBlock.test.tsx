/**
 * 37 §3：工厂创建托管弹层 — aria-describedby（env/hook mock）
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CreateOnChainEscrowBlock from "./CreateOnChainEscrowBlock";
import type { OrderRow } from "./types";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/settlementTokenEnv", () => ({
  getSettlementTokenAddress: () => "0x3333333333333333333333333333333333333333" as const,
}));

vi.mock("@/lib/arbitratorEnv", () => ({
  getArbitratorAddress: () => "0x4444444444444444444444444444444444444444" as const,
}));

vi.mock("@/lib/disputeWindowEnv", () => ({
  getDisputeWindowSeconds: () => 86_400,
}));

vi.mock("@/dapp/hooks/useEscrowFactoryCreate", () => ({
  useEscrowFactoryCreate: () => ({
    factory: "0x5555555555555555555555555555555555555555",
    createEscrow: vi.fn(() => Promise.resolve()),
    hash: undefined,
    receipt: undefined,
    isPending: false,
    isSuccess: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/lib/apiClient", () => ({
  getGuide: vi.fn(() =>
    Promise.resolve({ wallet_address: "0x2222222222222222222222222222222222222222" })
  ),
  getIdempotencyKey: () => "k",
  postOrderSetEscrowAddress: vi.fn(() => Promise.resolve()),
}));

const SNAP = `0x${"a".repeat(64)}` as const;

const order: OrderRow = {
  id: "11111111-1111-1111-1111-111111111111",
  tourist_id: "user-1",
  guide_id: "guide-1",
  amount: "100",
  currency: "USDC",
};

const orderNoGuide: OrderRow = {
  ...order,
  guide_id: undefined,
};

describe("CreateOnChainEscrowBlock", () => {
  it("returns null when viewer is not the tourist", () => {
    const { container } = render(
      <CreateOnChainEscrowBlock
        order={orderNoGuide}
        itinerary={null}
        snapshotHash={SNAP}
        meUserId="other-user"
        meDefaultWallet="0x6666666666666666666666666666666666666666"
        connectedAddress="0x6666666666666666666666666666666666666666"
        isConnected
        chainId={1}
        expectedChainId={1}
        chainMismatch={false}
        refreshOrder={() => {}}
      />
    );
    expect(container.textContent).toBe("");
  });

  it("dialog lists description, details, and resubmit note in aria-describedby", async () => {
    render(
      <CreateOnChainEscrowBlock
        order={order}
        itinerary={null}
        snapshotHash={SNAP}
        meUserId="user-1"
        meDefaultWallet="0x6666666666666666666666666666666666666666"
        connectedAddress="0x6666666666666666666666666666666666666666"
        isConnected
        chainId={1}
        expectedChainId={1}
        chainMismatch={false}
        refreshOrder={() => {}}
      />
    );

    await waitFor(() => {
      const open = screen.getByRole("button", { name: "escrow_factoryCreateCta" });
      expect(open.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "escrow_factoryCreateCta" }));

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    });

    const dialog = document.querySelector(
      '[role="dialog"][aria-labelledby][aria-describedby]'
    ) as HTMLElement | null;
    expect(dialog).toBeTruthy();
    const describedby = dialog?.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    const ids = describedby!.split(/\s+/).filter(Boolean);
    expect(ids.length).toBe(3);
    expect(document.getElementById(ids[0]!)?.textContent).toContain("escrow_signConfirmDesc");
    expect(document.getElementById(ids[1]!)?.textContent).toContain("escrow_chainId");
    expect(document.getElementById(ids[2]!)?.textContent).toContain("escrow_doNotResubmit");
  });

  it("when disconnected, primary CTA is clickable and shows header connect alert without opening dialog", async () => {
    render(
      <CreateOnChainEscrowBlock
        order={order}
        itinerary={null}
        snapshotHash={SNAP}
        meUserId="user-1"
        meDefaultWallet="0x6666666666666666666666666666666666666666"
        connectedAddress={undefined}
        isConnected={false}
        chainId={1}
        expectedChainId={1}
        chainMismatch={false}
        refreshOrder={() => {}}
      />
    );

    const open = screen.getByRole("button", { name: "escrow_factoryCreateCta" });
    expect(open.hasAttribute("disabled")).toBe(false);

    fireEvent.click(open);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("escrow_connectWalletUseHeader");
    });
    expect(document.querySelector('[role="dialog"]')).toBeFalsy();
  });
});
