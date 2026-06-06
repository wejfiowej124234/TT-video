import { describe, expect, it, vi, beforeEach } from "vitest";
import type { OrderListItem } from "@/lib/apiClient";
import type { OrderCardItem } from "@/lib/marketTypes";
import {
  buildMarketDiscoverOrderList,
  filterDiscoverOrdersForViewer,
  mergeDiscoverWithOwnPublishedCards,
  ownPublishedMarketCardsFromOrderListItems,
  invalidateOwnPublishedMarketCardsCache,
  fetchOwnPublishedMarketCards,
} from "./marketDiscoverOrdersMerge";

vi.mock("@/lib/apiClient", () => ({
  getOrders: vi.fn(),
}));

import { getOrders } from "@/lib/apiClient";
import { AUTH_USER_ID_KEY } from "@/lib/apiClient/core";

const getOrdersMock = vi.mocked(getOrders);

describe("marketDiscoverOrdersMerge", () => {
  beforeEach(() => {
    getOrdersMock.mockReset();
    invalidateOwnPublishedMarketCardsCache();
  });

  it("mergeDiscoverWithOwnPublishedCards prefers own cards over discover dup keys", () => {
    const discover: OrderCardItem[] = [
      { id: "a", order_id: "a", tourist_id: "other", state: "created", amount: "1" },
    ];
    const own: OrderCardItem[] = [
      { id: "b", order_id: "b", tourist_id: "u1", state: "created", amount: "2" },
      { id: "c", order_id: "c", tourist_id: "u1", state: "created", amount: "3" },
    ];
    expect(mergeDiscoverWithOwnPublishedCards(discover, own).map((o) => o.id)).toEqual(["b", "c", "a"]);
  });

  it("ownPublishedMarketCardsFromOrderListItems only includes created without guide", () => {
    const rows: OrderListItem[] = [
      { id: "d1", tourist_id: "u1", state: "draft", guide_id: "00000000-0000-0000-0000-000000000000" },
      { id: "c1", tourist_id: "u1", state: "created", guide_id: "00000000-0000-0000-0000-000000000000" },
      { id: "d2", tourist_id: "u1", state: "accepted", guide_id: "00000000-0000-0000-0000-000000000000" },
    ];
    expect(ownPublishedMarketCardsFromOrderListItems(rows).map((o) => o.id)).toEqual(["c1"]);
  });

  it("buildMarketDiscoverOrderList always merges getOrders even when discover already has one own row", async () => {
    getOrdersMock.mockResolvedValue({
      items: [
        { id: "mine-1", tourist_id: "u1", state: "created" },
        { id: "mine-2", tourist_id: "u1", state: "created" },
        { id: "mine-3", tourist_id: "u1", state: "created" },
      ] as OrderListItem[],
    });
    const discover: OrderCardItem[] = [
      { id: "mine-1", order_id: "mine-1", tourist_id: "u1", traveler_id: "u1", state: "created" },
    ];
    const out = await buildMarketDiscoverOrderList(discover, { ownUserId: "u1" });
    expect(getOrdersMock).toHaveBeenCalledTimes(1);
    expect(out.map((o) => String(o.id)).sort()).toEqual(["mine-1", "mine-2", "mine-3"]);
  });

  it("fetchOwnPublishedMarketCards paginates until has_more is false", async () => {
    getOrdersMock
      .mockResolvedValueOnce({
        items: [{ id: "p1", tourist_id: "u1", state: "created" }] as OrderListItem[],
        page: { has_more: true, next_cursor: "c2" },
      })
      .mockResolvedValueOnce({
        items: [{ id: "p2", tourist_id: "u1", state: "created" }] as OrderListItem[],
        page: { has_more: false },
      });
    const { fetchOwnPublishedMarketCards: fetchPaged } = await import("./marketDiscoverOrdersMerge");
    const cards = await fetchPaged({ pageSize: 1, maxPages: 5 });
    expect(getOrdersMock).toHaveBeenCalledTimes(2);
    expect(cards.map((o) => o.id)).toEqual(["p1", "p2"]);
  });

  it("fetchOwnPublishedMarketCards uses TTL cache on repeat calls", async () => {
    localStorage.setItem(AUTH_USER_ID_KEY, "u1");
    getOrdersMock.mockResolvedValue({
      items: [{ id: "c1", tourist_id: "u1", state: "created" }] as OrderListItem[],
    });
    await fetchOwnPublishedMarketCards({ maxPages: 1 });
    await fetchOwnPublishedMarketCards({ maxPages: 1 });
    expect(getOrdersMock).toHaveBeenCalledTimes(1);
    invalidateOwnPublishedMarketCardsCache();
    await fetchOwnPublishedMarketCards({ maxPages: 1 });
    expect(getOrdersMock).toHaveBeenCalledTimes(2);
  });

  it("filterDiscoverOrdersForViewer hides drafts and own non-eligible rows", () => {
    const items: OrderCardItem[] = [
      { id: "1", tourist_id: "u1", traveler_id: "u1", state: "accepted" },
      { id: "2", tourist_id: "u1", traveler_id: "u1", state: "created" },
      { id: "3", tourist_id: "u2", traveler_id: "u2", state: "created" },
      { id: "4", tourist_id: "u2", traveler_id: "u2", state: "draft" },
      { id: "5", tourist_id: "u1", traveler_id: "u1", state: "draft" },
    ];
    expect(filterDiscoverOrdersForViewer(items, "", "u1").map((o) => o.id)).toEqual(["2", "3"]);
  });
});
