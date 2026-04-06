/**
 * B-030：failed 与 success 并存时须优先展示失败，避免误显成功勾
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TxMachineStatus from "./TxMachineStatus";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({
    t: (k: string) =>
      ({
        escrow_txStatus_longPrefix: "Tx",
        escrow_txStatus_pending: "PENDING",
        escrow_txStatus_success: "SUCCESS",
        escrow_txStatus_failed: "FAILED",
        escrow_txStatus_signing: "SIGNING",
        escrow_txStatus_idle: "IDLE",
      })[k] ?? k,
  }),
}));

describe("TxMachineStatus", () => {
  it("prioritizes failed over success when both true (B-030)", () => {
    render(
      <TxMachineStatus pending={false} success failed longPrefix />
    );
    expect(screen.getByText("FAILED")).toBeTruthy();
    expect(screen.queryByText("SUCCESS")).toBeNull();
  });
});
