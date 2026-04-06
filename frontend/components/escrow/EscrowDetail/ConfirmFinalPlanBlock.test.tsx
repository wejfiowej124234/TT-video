/**
 * 37 §3：确认最终方案弹层 — aria-labelledby / aria-describedby
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmFinalPlanBlock from "./ConfirmFinalPlanBlock";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const postOrderConfirmFinalPlanMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  getIdempotencyKey: () => "idem-key",
  postOrderConfirmFinalPlan: (
    orderId: string,
    body: unknown,
    key: string
  ) => postOrderConfirmFinalPlanMock(orderId, body, key),
}));

describe("ConfirmFinalPlanBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postOrderConfirmFinalPlanMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: "ok" },
    });
  });

  it("renders nothing when not draft", () => {
    const { container } = render(
      <ConfirmFinalPlanBlock
        orderId="o1"
        isDraft={false}
        hasSnapshot={false}
        onConfirmed={() => {}}
      />
    );
    expect(container.textContent).toBe("");
  });

  it("renders nothing when snapshot already exists", () => {
    const { container } = render(
      <ConfirmFinalPlanBlock
        orderId="o1"
        isDraft
        hasSnapshot
        onConfirmed={() => {}}
      />
    );
    expect(container.textContent).toBe("");
  });

  it("dialog exposes describedby for summary text and detail list", () => {
    render(
      <ConfirmFinalPlanBlock
        orderId="order-uuid"
        isDraft
        hasSnapshot={false}
        version={2}
        snapshotHash={null}
        onConfirmed={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "escrow_confirmFinalPlan" }));
    const dialog = screen.getByRole("dialog", { name: "escrow_confirmFinalPlanTitle" });
    const describedby = dialog.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    const ids = describedby!.split(/\s+/).filter(Boolean);
    expect(ids.length).toBe(2);
    const a = document.getElementById(ids[0]!);
    const b = document.getElementById(ids[1]!);
    expect(a?.textContent).toContain("escrow_confirmFinalPlanDesc");
    expect(b?.textContent).toContain("escrow_versionLabel");
    expect(b?.textContent).toContain("escrow_snapshotHashLabel");
  });
});
