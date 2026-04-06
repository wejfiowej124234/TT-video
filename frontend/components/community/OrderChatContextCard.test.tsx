/**
 * 53-S7：订单关联会话顶栏 — GET order 后展示只读分项与按日行程列表
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getOrderMock } = vi.hoisted(() => ({
  getOrderMock: vi.fn(),
}));

/** 与组件 `useEffect(..., [t])` 同源：须**稳定**引用，否则每次 render 新 `t` 会取消进行中的 fetch 且 `loading` 不落地 */
const tMock = (k: string) => {
  if (k === "landing_results_day_segment") return "Day {{n}} · {{city}}";
  if (k === "landing_results_day_joiner") return "; ";
  if (k === "ui_em_dash") return "—";
  if (k === "itin_dayCostEvenSplitLabel") return "Even split label";
  if (k === "itin_dayCostEvenSplitHint") return "estimate hint";
  return k;
};

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: tMock }),
}));

vi.mock("@/lib/apiClient/orders", () => ({
  getOrder: (id: string) => getOrderMock(id),
}));

describe("OrderChatContextCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders breakdown and day rows after order load", async () => {
    getOrderMock.mockResolvedValue({
      order: {
        id: "00000000-0000-4000-8000-000000000099",
        destination: "Kyoto",
        city: "Kyoto",
        travel_date: "2026-04-01",
        days: 2,
        amount: "1200",
        currency: "USD",
      },
      itinerary: {
        daily_itinerary: [
          { city: "Kyoto", description: "Temple walk" },
          { city: "Osaka", content_text: "Food tour" },
        ],
        amount_breakdown: {
          hotel: "400",
          guide_fee: "500",
          total_budget: "1200",
        },
      },
    });

    const { default: OrderChatContextCard } = await import("./OrderChatContextCard");
    render(<OrderChatContextCard orderId="00000000-0000-4000-8000-000000000099" />);

    expect(await screen.findByText("community_orderContext_itineraryOutline")).toBeTruthy();
    expect(await screen.findByText("Day 1 · Kyoto")).toBeTruthy();
    expect(screen.getByText(/Temple walk/)).toBeTruthy();
    expect(screen.getByText("Day 2 · Osaka")).toBeTruthy();
    expect(screen.getByText(/Food tour/)).toBeTruthy();
    expect(screen.getByText(/escrow_hotel/)).toBeTruthy();
    expect(screen.getByText(/Even split label/)).toBeTruthy();
    expect(screen.getByText(/600\.00/)).toBeTruthy();
    expect(screen.getByText(/estimate hint/)).toBeTruthy();

    const escrowLink = await screen.findByRole("link", { name: /community_viewOrder/ });
    expect(escrowLink.getAttribute("href")).toBe("/escrow/00000000-0000-4000-8000-000000000099");
  });

  it("uses inlineSnapshot without calling getOrder when id matches", async () => {
    getOrderMock.mockClear();
    getOrderMock.mockResolvedValue({
      order: {
        id: "inline-id",
        destination: "Never",
        amount: "0",
        currency: "USD",
      },
      itinerary: null,
    });
    const { default: OrderChatContextCard } = await import("./OrderChatContextCard");
    render(
      <OrderChatContextCard
        orderId="inline-id"
        variantLayout="escrow-embedded"
        inlineSnapshot={{
          order: {
            id: "inline-id",
            destination: "Kyoto",
            city: "Kyoto",
            amount: "50",
            currency: "USD",
          },
          itinerary: null,
        }}
      />
    );
    expect(getOrderMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/Kyoto · Kyoto/)).toBeTruthy();
    expect(screen.queryByText(/Never/)).toBeNull();
  });

  it("fetches via getOrder when inlineSnapshot order id mismatches orderId", async () => {
    getOrderMock.mockClear();
    getOrderMock.mockResolvedValue({
      order: {
        id: "wanted-id",
        destination: "Nara",
        city: "Nara",
        amount: "1",
        currency: "USD",
      },
      itinerary: null,
    });
    const { default: OrderChatContextCard } = await import("./OrderChatContextCard");
    render(
      <OrderChatContextCard
        orderId="wanted-id"
        variantLayout="escrow-embedded"
        inlineSnapshot={{
          order: {
            id: "other-id",
            destination: "Wrong",
            amount: "9",
            currency: "USD",
          },
          itinerary: null,
        }}
      />
    );
    expect(getOrderMock).toHaveBeenCalledWith("wanted-id");
    expect(await screen.findByText(/Nara · Nara/)).toBeTruthy();
  });

  it("escrow-embedded omits escrow self link and links to community messages", async () => {
    getOrderMock.mockResolvedValue({
      order: {
        id: "00000000-0000-4000-8000-000000000088",
        destination: "Osaka",
        city: "Osaka",
        amount: "99",
        currency: "USD",
      },
      itinerary: null,
    });

    const { default: OrderChatContextCard } = await import("./OrderChatContextCard");
    render(
      <OrderChatContextCard orderId="00000000-0000-4000-8000-000000000088" variantLayout="escrow-embedded" />
    );

    expect(await screen.findByText(/Osaka · Osaka/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /community_viewOrder/ })).toBeNull();
    const msg = screen.getByRole("link", { name: /order_messageLinkCta/ });
    expect(msg.getAttribute("href")).toBe(
      "/community/messages?orderId=00000000-0000-4000-8000-000000000088"
    );
  });
});
