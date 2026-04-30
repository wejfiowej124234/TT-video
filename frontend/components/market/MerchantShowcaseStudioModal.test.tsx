/**
 * 商家橱窗创作台：打开态标题与基础校验
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import MerchantShowcaseStudioModal from "./MerchantShowcaseStudioModal";
import { LocaleProvider } from "@/components/LocaleProvider";

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe("MerchantShowcaseStudioModal", () => {
  it("renders dialog title when open", () => {
    render(
      <LocaleProvider>
        <MerchantShowcaseStudioModal open onClose={() => {}} />
      </LocaleProvider>,
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { level: 2, name: /橱窗商品创作台|Showcase listing studio/i }),
    ).toBeTruthy();
  });

  it("requires title, price, and escrow ack before save", () => {
    const onClose = vi.fn();
    render(
      <LocaleProvider>
        <MerchantShowcaseStudioModal open onClose={onClose} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /保存草稿|Save draft/i }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
