import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarketSubsiteListingDetailDrawer } from "./MarketSubsiteListingDetailDrawer";
import { dataTt } from "@/test-utils/dataTtSelectors";

const {
  demoEnabledMock,
  getMarketProviderListingMock,
  getMarketAcquisitionListingMock,
  trackMarketEventMock,
  stableTranslate,
} = vi.hoisted(() => {
  const stableTranslate = (k: string) => k;
  return {
    demoEnabledMock: vi.fn(() => false),
    getMarketProviderListingMock: vi.fn(),
    getMarketAcquisitionListingMock: vi.fn(),
    trackMarketEventMock: vi.fn(),
    stableTranslate,
  };
});

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ locale: "en" as const, t: stableTranslate }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("@/lib/marketSubsiteProductionGate", () => ({
  marketSubsiteDemoStudioFallbackEnabled: () => demoEnabledMock(),
}));

vi.mock("@/lib/apiClient/marketSubsite", () => ({
  getMarketProviderListing: (id: string) => getMarketProviderListingMock(id),
  getMarketAcquisitionListing: (id: string) => getMarketAcquisitionListingMock(id),
}));

vi.mock("@/lib/analytics", () => ({
  trackMarketEvent: (...args: unknown[]) => trackMarketEventMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

describe("MarketSubsiteListingDetailDrawer", () => {
  beforeEach(() => {
    demoEnabledMock.mockReturnValue(false);
    getMarketProviderListingMock.mockReset();
    getMarketAcquisitionListingMock.mockReset();
    trackMarketEventMock.mockReset();
    getMarketProviderListingMock.mockImplementation(() => new Promise(() => {}));
  });

  it("returns null when listingId is null", () => {
    const { container } = render(
      <MarketSubsiteListingDetailDrawer variant="provider" listingId={null} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("catalog loading: stable data-tt, aria-busy, scrim click closes", async () => {
    const onClose = vi.fn();
    render(
      <MarketSubsiteListingDetailDrawer
        variant="provider"
        listingId="00000000-0000-4000-8000-000000000001"
        catalogSourced
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      const el = document.querySelector(dataTt.marketSubsiteListingDrawer);
      expect(el?.getAttribute("aria-busy")).toBe("true");
    });
    const root = document.querySelector(dataTt.marketSubsiteListingDrawer) as HTMLElement;
    expect(root.getAttribute("data-tt-market-subsite-listing-drawer")).toBe("1");

    fireEvent.click(root);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("catalog error then retry loads listing and fires market_subsite_detail_view", async () => {
    const listingId = "00000000-0000-4000-8000-000000000002";
    const okBody = {
      listing: {
        id: listingId,
        updated_at: "2024-01-02T00:00:00.000Z",
        payload: {
          title: "Cat title",
          subtitle: "Sub",
          city: "Tokyo",
          category: "hotel",
          priceUsdc: 99,
          shopName: "S",
          description: "Story",
          highlightsText: "Hi",
        },
      },
    };

    let fetchAttempt = 0;
    getMarketProviderListingMock.mockImplementation(() => {
      fetchAttempt += 1;
      if (fetchAttempt === 1) return Promise.reject(new Error("network"));
      return Promise.resolve(okBody);
    });

    const onClose = vi.fn();
    render(
      <MarketSubsiteListingDetailDrawer variant="provider" listingId={listingId} catalogSourced onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "common_retry" }));

    await waitFor(() => {
      expect(screen.getByText("Cat title")).toBeTruthy();
    });

    await waitFor(() => {
      expect(trackMarketEventMock).toHaveBeenCalledWith(
        "market_subsite_detail_view",
        expect.objectContaining({ variant: "provider", listingId }),
      );
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("demo listing without catalog: drawer root and merchant title", () => {
    demoEnabledMock.mockReturnValue(true);
    const onClose = vi.fn();
    render(
      <MarketSubsiteListingDetailDrawer
        variant="provider"
        listingId="m-seaside-suite"
        catalogSourced={false}
        onClose={onClose}
      />,
    );

    const root = document.querySelector(dataTt.marketSubsiteListingDrawer) as HTMLElement | null;
    expect(root).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Seaside suite/i })).toBeTruthy();
  });
});
