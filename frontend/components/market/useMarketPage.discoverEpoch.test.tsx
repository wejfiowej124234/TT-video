/**
 * B-061：筛选变更快于网络时，旧 `getDiscoverOrders` resolve 不得覆盖新参数下列表
 */
import React, { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useMarketPage } from "./useMarketPage";

const { stableT } = vi.hoisted(() => {
  function t(k: string) {
    return k;
  }
  return { stableT: t };
});

const getDiscoverOrdersMock = vi.fn();
const getGuidesMock = vi.fn();

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: stableT }),
}));

vi.mock("@/lib/analytics", () => ({
  trackMarketEvent: vi.fn(),
}));

const routerReplace = vi.fn();
const marketSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => "/market",
  useSearchParams: () => marketSearchParams,
}));

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...mod,
    getDiscoverOrders: (...args: unknown[]) => getDiscoverOrdersMock(...args),
    getGuides: (...args: unknown[]) => getGuidesMock(...args),
    getOrders: vi.fn().mockResolvedValue({ items: [] }),
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

describe("useMarketPage discover list epoch (B-061)", () => {
  beforeEach(() => {
    getDiscoverOrdersMock.mockReset();
    getGuidesMock.mockReset();
    routerReplace.mockReset();
    getGuidesMock.mockResolvedValue({ items: [] });
  });

  it("ignores stale getDiscoverOrders when a newer loadOrders has started", async () => {
    let resolveFirst!: (v: unknown) => void;
    let resolveSecond!: (v: unknown) => void;
    const p1 = new Promise((r) => {
      resolveFirst = r;
    });
    const p2 = new Promise((r) => {
      resolveSecond = r;
    });
    let discoverCalls = 0;
    getDiscoverOrdersMock.mockImplementation(() => {
      discoverCalls += 1;
      if (discoverCalls === 1) return p1;
      if (discoverCalls === 2) return p2;
      return Promise.resolve({
        items: [],
        page: { has_more: false, next_cursor: null, limit: 30 },
      });
    });

    const { result } = renderHook(() => useMarketPage(), { wrapper });

    await waitFor(() => expect(discoverCalls).toBeGreaterThanOrEqual(1));

    await act(async () => {
      result.current.setCountry("JP");
    });

    await waitFor(() => expect(discoverCalls).toBeGreaterThanOrEqual(2));

    const page = { has_more: false, next_cursor: null, limit: 30 };
    const itemNew = { id: "o-new", order_id: "o-new", amount: "1", currency: "USDC" };
    const itemStale = { id: "o-old", order_id: "o-old", amount: "9", currency: "USDC" };

    await act(async () => {
      resolveSecond({ items: [itemNew], page });
    });
    await act(async () => {
      resolveFirst({ items: [itemStale], page });
    });

    await waitFor(() => {
      expect(result.current.orders).toHaveLength(1);
      expect(result.current.orders[0].id).toBe("o-new");
    });
  });
});
