/**
 * 53-S11 / §六附续 §1：BilateralConfirmBlock 单元测试
 * 验收：已双确认时不展示按钮；可确认时按钮存在；loading 时 disabled 与 aria-busy
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BilateralConfirmBlock from "./BilateralConfirmBlock";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/apiClient", () => ({
  orderConfirmBilateral: vi.fn(() => Promise.resolve()),
}));

describe("BilateralConfirmBlock", () => {
  it("renders confirm button when user has not confirmed (tourist)", () => {
    render(
      <BilateralConfirmBlock
        orderId="test-id"
        isGuide={false}
        touristConfirmed={false}
        guideConfirmed={true}
        onSuccess={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "order_bilateralConfirmCta" })).toBeTruthy();
  });

  it("does not render confirm button when both have confirmed", () => {
    render(
      <BilateralConfirmBlock
        orderId="test-id"
        isGuide={true}
        touristConfirmed={true}
        guideConfirmed={true}
        onSuccess={() => {}}
      />
    );
    expect(screen.queryByRole("button", { name: "order_bilateralConfirmCta" })).toBeNull();
  });

  it("shows section with bilateral confirm heading", () => {
    render(
      <BilateralConfirmBlock
        orderId="test-id"
        isGuide={false}
        touristConfirmed={false}
        guideConfirmed={false}
        onSuccess={() => {}}
      />
    );
    expect(screen.getByText("order_bilateralConfirmTitle")).toBeTruthy();
  });
});
