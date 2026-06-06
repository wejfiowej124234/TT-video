import { describe, expect, it } from "vitest";
import type { OrderCardItem } from "@/lib/marketTypes";
import {
  applyDiscoverGeoFiltersKeepingPin,
  bindingOrderVisibleInList,
  isOwnPublishedOpenListing,
  marketOrderHasAssignedGuide,
  normalizeMarketOrderCountry,
  pinOrderInDiscoverList,
} from "./marketBindOrderList";

const pin: OrderCardItem = {
  id: "order-pin",
  country: "CN",
  city: "上海",
  days: 3,
  destination: "上海",
};

const other: OrderCardItem = {
  id: "order-other",
  country: "CN",
  city: "北京",
  days: 7,
  destination: "北京",
};

describe("marketBindOrderList", () => {
  it("geo filter keeps pinned binding order when city filter would drop it", () => {
    const list = [pin, other];
    const out = applyDiscoverGeoFiltersKeepingPin(
      list,
      { country: "CN", city: "上海", tripDaysFilter: null },
      "order-pin",
    );
    expect(out.map((o) => o.id)).toEqual(["order-pin"]);
  });

  it("pins binding order when filtered list dropped it", () => {
    const filtered: OrderCardItem[] = [other];
    const pool = [pin, other];
    const out = pinOrderInDiscoverList(filtered, pool, "order-pin");
    expect(out[0]?.id).toBe("order-pin");
    expect(out.length).toBe(2);
  });

  it("detects assigned guide id", () => {
    expect(marketOrderHasAssignedGuide({ guide_id: "00000000-0000-4000-8000-000000000001" })).toBe(
      true,
    );
    expect(marketOrderHasAssignedGuide({ guide_id: "00000000-0000-0000-0000-000000000000" })).toBe(
      false,
    );
  });

  it("bindingOrderVisibleInList", () => {
    expect(bindingOrderVisibleInList([other], "order-pin")).toBe(false);
    expect(bindingOrderVisibleInList([pin], "order-pin")).toBe(true);
  });

  it("normalizeMarketOrderCountry strips route suffix", () => {
    expect(normalizeMarketOrderCountry({ country: "", destination: "中国 · 上海" })).toBe("中国");
  });

  it("isOwnPublishedOpenListing excludes draft (aligned with /orders)", () => {
    expect(
      isOwnPublishedOpenListing(
        {
          id: "1",
          tourist_id: "u1",
          state: "draft",
          guide_id: "00000000-0000-0000-0000-000000000000",
        },
        "u1",
      ),
    ).toBe(false);
  });

  it("isOwnPublishedOpenListing", () => {
    expect(
      isOwnPublishedOpenListing(
        {
          id: "1",
          tourist_id: "u1",
          state: "created",
          guide_id: "00000000-0000-0000-0000-000000000000",
        },
        "u1",
      ),
    ).toBe(true);
    expect(
      isOwnPublishedOpenListing({ id: "1", tourist_id: "u2", state: "created" }, "u1"),
    ).toBe(false);
  });
});
