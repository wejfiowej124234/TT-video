/**
 * 37 §3.5 / 53：链上操作区 — 区域命名、异步按钮 aria-busy
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import EscrowOnChainActions from "./EscrowOnChainActions";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function props(over: Partial<React.ComponentProps<typeof EscrowOnChainActions>> = {}) {
  return {
    isConnected: true,
    chainMismatch: false,
    expectedChainId: 1,
    chainId: 1,
    confirmAction: null as string | null,
    pending: false,
    success: false,
    failed: false,
    depositAmount: BigInt(1),
    depositPending: false,
    releasePending: false,
    refundPending: false,
    disputePending: false,
    disputeDisabled: false,
    txErrorMessage: "",
    onSetConfirmAction: vi.fn(),
    onDeposit: vi.fn(),
    onRelease: vi.fn(),
    onRefund: vi.fn(),
    ...over,
  };
}

describe("EscrowOnChainActions", () => {
  it("exposes named region for on-chain actions (aria-labelledby)", () => {
    render(<EscrowOnChainActions {...props()} />);
    expect(screen.getByRole("region", { name: "escrow_onChainActions" })).toBeTruthy();
  });

  it("sets aria-busy on deposit while confirming", () => {
    render(<EscrowOnChainActions {...props({ depositPending: true })} />);
    const btn = screen.getByRole("button", { name: "escrow_depositConfirming" });
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("sets aria-busy on release while confirming", () => {
    render(<EscrowOnChainActions {...props({ releasePending: true })} />);
    const btn = screen.getByRole("button", { name: "escrow_releaseConfirming" });
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("when disconnected, tapping a chain action shows header connect alert", () => {
    render(<EscrowOnChainActions {...props({ isConnected: false })} />);
    fireEvent.click(screen.getByRole("button", { name: "escrow_deposit" }));
    expect(screen.getByRole("alert").textContent).toContain("escrow_connectWalletUseHeader");
  });

  it("B-043: canReleaseOnChain false shows role=status release hint and aria-describedby on release button", () => {
    render(<EscrowOnChainActions {...props({ canReleaseOnChain: false })} />);
    const region = screen.getByRole("region", { name: "escrow_onChainActions" });
    const hint = within(region).getByText("escrow_releaseDisabledHint");
    expect(hint.getAttribute("role")).toBe("status");
    const releaseBtn = screen.getByRole("button", { name: "escrow_release" });
    const db = releaseBtn.getAttribute("aria-describedby");
    expect(db).toBeTruthy();
    expect(document.getElementById(db!)).toBe(hint);
  });

  it("B-037: disables dispute when canOpenDisputeOnChain false and shows status reason", () => {
    render(
      <EscrowOnChainActions
        {...props({
          canOpenDisputeOnChain: false,
          disputeOnChainUnavailableReasonKey: "escrow_disputeBlocked_alreadyOpen",
        })}
      />
    );
    const disputeBtn = screen.getByRole("button", { name: "escrow_openDispute" });
    expect(disputeBtn.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("escrow_disputeBlocked_alreadyOpen")).toBeTruthy();
  });
});
