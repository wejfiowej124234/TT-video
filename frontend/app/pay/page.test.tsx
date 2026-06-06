/**
 * /pay 支付与托管入口：无 orderId 时首屏稳定渲染（与清单「支付页缺单测」缺口对齐）。
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PayPage from "./page";
import { dataTt } from "@/test-utils/dataTtSelectors";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  usePathname: () => "/pay",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/components/MetaProvider", () => ({
  useMeta: () => ({
    meta: { orders: { order_mock_pay_enabled: false } },
    error: null,
    loading: false,
  }),
}));

vi.mock("@/lib/apiClient", () => ({
  getMeFull: vi.fn(() => Promise.resolve(null)),
  getOrder: vi.fn(() => Promise.resolve({ order: null })),
  getIdempotencyKey: vi.fn(() => "test-idempotency-key"),
  orderMockPay: vi.fn(),
}));

describe("/pay page", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders hub title and root surface without orderId", async () => {
    const { container } = render(<PayPage />);
    await waitFor(() => expect(container.querySelector(dataTt.payRoot)).not.toBeNull());
    const main = container.querySelector(dataTt.payRoot)!;
    expect(main.getAttribute("data-tt-pay-root")).toBe("1");
    expect(screen.getByRole("heading", { level: 1, name: "pay_pageTitle" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("pay_disclaimer")).toBeTruthy();
    });
  });
});
