/**
 * B-045：抽屉内 GET order 失败 ApiErrorAlert + common_retry
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrderDetailDrawer from "./OrderDetailDrawer";

const { getOrderMock, routerReplaceMock } = vi.hoisted(() => ({
  getOrderMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string }) {
    return <img alt={props.alt} />;
  },
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    getOrder: (id: string) => getOrderMock(id),
  };
});

describe("OrderDetailDrawer", () => {
  beforeEach(() => {
    getOrderMock.mockReset();
    routerReplaceMock.mockReset();
  });

  it("GET order failure shows ApiErrorAlert and common_retry refetches (B-045)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      getOrderMock.mockRejectedValue(new Error("network"));

      render(
        <OrderDetailDrawer
          order={{
            id: "11111111-1111-1111-1111-111111111111",
            destination: "Japan",
            amount: "100",
            currency: "USDC",
            days: 3,
            version: 1,
          }}
          onClose={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("escrow_loadFailed")).toBeTruthy();
      });

      getOrderMock.mockResolvedValue({
        order: { id: "11111111-1111-1111-1111-111111111111", state: "created" },
        itinerary: {
          daily_itinerary: [{ day_index: 1, city: "Tokyo", description: "Walk" }],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: "common_retry" }));

      await waitFor(() => {
        expect(screen.queryByText("escrow_loadFailed")).toBeNull();
      });
      expect(screen.getByText("order_detail_itineraryTitle")).toBeTruthy();
      expect(getOrderMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      errSpy.mockRestore();
    }
  });

  it("rapid order switch does not show previous order enrich or destination (B-046)", async () => {
    const idA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const idB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    let resolveA!: (v: unknown) => void;
    const slowA = new Promise((r) => {
      resolveA = r;
    });

    getOrderMock.mockImplementation((id: string) => {
      if (id === idA) return slowA;
      if (id === idB) {
        return Promise.resolve({
          order: { id: idB, state: "created" },
          itinerary: {
            daily_itinerary: [{ day_index: 1, city: "BetaCity", description: "B" }],
          },
        });
      }
      return Promise.reject(new Error(`unexpected getOrder id: ${id}`));
    });

    const orderA = {
      id: idA,
      destination: "AlphaLand",
      amount: "111",
      currency: "USDC",
      days: 2,
      version: 1,
    };
    const orderB = {
      id: idB,
      destination: "BetaLand",
      amount: "222",
      currency: "USDC",
      days: 3,
      version: 1,
    };

    const { rerender } = render(<OrderDetailDrawer order={orderA} onClose={() => {}} />);
    rerender(<OrderDetailDrawer order={orderB} onClose={() => {}} />);

    expect(await screen.findByRole("heading", { name: "BetaLand" })).toBeTruthy();
    expect(screen.queryByText("AlphaLand")).toBeNull();

    expect(await screen.findByText(/BetaCity/)).toBeTruthy();

    resolveA({
      order: { id: idA, state: "created" },
      itinerary: {
        daily_itinerary: [{ day_index: 1, city: "AlphaCity", description: "A" }],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/AlphaCity/)).toBeNull();
    });
    expect(screen.getByText(/BetaCity/)).toBeTruthy();
    expect(screen.getByText(/222\.00/)).toBeTruthy();
  });

  it("GET order login_required with loginReturnPath redirects to auth with returnUrl (B-060)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      getOrderMock.mockRejectedValue(new Error("login_required"));
      const back = "/market?view=orders&country=JP";
      render(
        <OrderDetailDrawer
          loginReturnPath={back}
          order={{
            id: "11111111-1111-1111-1111-111111111111",
            destination: "Japan",
            amount: "100",
            currency: "USDC",
            days: 3,
            version: 1,
          }}
          onClose={() => {}}
        />,
      );
      await waitFor(() => {
        expect(routerReplaceMock).toHaveBeenCalledWith(
          `/auth/login?returnUrl=${encodeURIComponent(back)}`,
        );
      });
    } finally {
      errSpy.mockRestore();
    }
  });
});
