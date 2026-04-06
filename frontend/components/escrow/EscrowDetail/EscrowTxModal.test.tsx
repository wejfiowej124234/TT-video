/**
 * 37 §3：签名确认弹层 — aria-describedby、主按钮 aria-busy（wagmi 读路径 mock）
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EscrowTxModal from "./EscrowTxModal";
import type { OrderRow } from "./types";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ isConnected: true }),
  useSimulateContract: () => ({
    data: undefined,
    isFetching: false,
    isPending: false,
    isError: false,
  }),
}));

const order: OrderRow = {
  id: "order-1",
  escrow_address: "0x1111111111111111111111111111111111111111",
};

function renderModal(over: Partial<React.ComponentProps<typeof EscrowTxModal>> = {}) {
  return render(
    <EscrowTxModal
      confirmAction="release"
      onClose={() => {}}
      onConfirm={() => {}}
      order={order}
      amount="1"
      currency="USDC"
      snapshotHash={null}
      chainId={1}
      expectedChainId={1}
      pending={false}
      success={false}
      failed={false}
      txError={null}
      {...over}
    />
  );
}

describe("EscrowTxModal", () => {
  it("dialog lists description, detail list, and resubmit note in aria-describedby", () => {
    renderModal();
    const dialog = screen.getByRole("dialog", { name: "escrow_signConfirmTitle" });
    const describedby = dialog.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    const ids = describedby!.split(/\s+/).filter(Boolean);
    expect(ids.length).toBe(3);
    expect(document.getElementById(ids[0]!)?.textContent).toContain("escrow_signConfirmDesc");
    expect(document.getElementById(ids[1]!)?.textContent).toContain("escrow_chainId");
    expect(document.getElementById(ids[2]!)?.textContent).toContain("escrow_doNotResubmit");
  });

  it("confirm button exposes aria-busy while pending", () => {
    renderModal({ pending: true });
    const btn = screen.getByRole("button", { name: "escrow_confirming" });
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });
});
