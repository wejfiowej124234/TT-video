/**
 * 37 §3：UnlockModal — aria-describedby + pay button aria-busy
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UnlockModal from "./UnlockModal";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("UnlockModal", () => {
  it("returns null when no selection", () => {
    const { container } = render(
      <UnlockModal
        selectedForUnlock={null}
        setSelectedForUnlock={() => {}}
        handleUnlockPay={() => {}}
        unlockPaying={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("dialog describedby references both description paragraphs", () => {
    render(
      <UnlockModal
        selectedForUnlock={{ orderId: "o1", index: 0 }}
        setSelectedForUnlock={() => {}}
        handleUnlockPay={() => {}}
        unlockPaying={false}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "unlock_title" });
    const ref = dialog.getAttribute("aria-describedby");
    expect(ref).toBeTruthy();
    const ids = ref!.split(/\s+/).filter(Boolean);
    expect(ids).toHaveLength(2);
    expect(ids.every((id) => document.getElementById(id))).toBe(true);
  });

  it("pay button has aria-busy when paying", () => {
    render(
      <UnlockModal
        selectedForUnlock={{ orderId: "o1", index: 0 }}
        setSelectedForUnlock={() => {}}
        handleUnlockPay={() => {}}
        unlockPaying
      />
    );
    const pay = screen.getByRole("button", { name: "unlock_btn_paying" });
    expect(pay.getAttribute("aria-busy")).toBe("true");
  });
});
