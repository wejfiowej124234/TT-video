import { describe, expect, it } from "vitest";
import {
  deriveRouteLabelFromDailyItinerary,
  orderGetResponseToMarketCard,
} from "./marketOrderCardFromGetOrder";

describe("marketOrderCardFromGetOrder", () => {
  it("derives route label from day cities", () => {
    expect(
      deriveRouteLabelFromDailyItinerary([
        { day_index: 1, city: "北京", content_text: "" },
        { day_index: 2, city: "上海", content_text: "" },
        { day_index: 3, city: "上海", content_text: "" },
        { day_index: 4, city: "西安", content_text: "" },
      ]),
    ).toBe("北京、上海、西安");
  });

  it("maps GET order response to market card", () => {
    const card = orderGetResponseToMarketCard({
      order: {
        id: "00000000-0000-4000-8000-000000000099",
        state: "created",
        amount: "3204.00",
        currency: "USDC",
        days: 5,
        tourist_id: "t1",
      },
      itinerary: {
        version: 2,
        daily_itinerary: [
          { day_index: 1, city: "北京", content_text: "d1" },
          { day_index: 2, city: "上海", content_text: "d2" },
        ],
      },
    });
    expect(card?.id).toBe("00000000-0000-4000-8000-000000000099");
    expect(card?.state).toBe("created");
    expect(card?.route_label).toBe("北京、上海");
    expect(card?.amount).toBe("3204.00");
  });

  it("returns null when order already has guide or is ineligible for discover market", () => {
    expect(
      orderGetResponseToMarketCard({
        order: { id: "o1", state: "accepted", guide_id: "g1" },
      }),
    ).toBeNull();
    expect(
      orderGetResponseToMarketCard({
        order: { id: "o2", state: "funded", tourist_id: "t1" },
      }),
    ).toBeNull();
  });
});
