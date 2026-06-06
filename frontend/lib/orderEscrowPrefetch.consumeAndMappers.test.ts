import { describe, expect, it, vi } from "vitest";
import {
  consumeEscrowOrderPrefetch,
  orderCardItemToEscrowPrefetchOrder,
  orderListItemToEscrowPrefetchOrder,
  stashEscrowOrderPrefetchFromListItem,
  stashEscrowOrderPrefetchFromMarketCard,
} from "./orderEscrowPrefetch";
import { PREFETCH_TEST_OID, useOrderEscrowPrefetchTestHooks } from "./orderEscrowPrefetch.vitestShared";

describe("orderEscrowPrefetch · consume + list/card mappers", () => {
  useOrderEscrowPrefetchTestHooks();

  it("stashes and consumes matching order with itinerary", () => {
    stashEscrowOrderPrefetchFromListItem({
      id: PREFETCH_TEST_OID,
      status: "draft",
      amount: "100",
      itinerary: { version: 1, daily_itinerary: [{ day_index: 1, content_text: "x" }] },
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.order.status).toBe("draft");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("x");
    expect(sessionStorage.length).toBe(0);
  });

  it("returns null when id mismatch", () => {
    stashEscrowOrderPrefetchFromListItem({ id: PREFETCH_TEST_OID, status: "draft" });
    expect(consumeEscrowOrderPrefetch("other-id")).toBeNull();
    expect(sessionStorage.length).toBe(1);
  });

  it("returns null when expired", () => {
    stashEscrowOrderPrefetchFromListItem({ id: PREFETCH_TEST_OID, status: "draft" });
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(consumeEscrowOrderPrefetch(PREFETCH_TEST_OID)).toBeNull();
  });

  it("orderListItemToEscrowPrefetchOrder maps list fields", () => {
    const o = orderListItemToEscrowPrefetchOrder({
      id: PREFETCH_TEST_OID,
      state: "draft",
      tourist_id: "t1",
      guide_id: "g1",
      escrow_address: "0xabc",
    });
    expect(o.tourist_id).toBe("t1");
    expect(o.traveler_id).toBe("t1");
    expect(o.guide_id).toBe("g1");
    expect(o.escrow_address).toBe("0xabc");
  });

  it("orderListItemToEscrowPrefetchOrder mirrors traveler_id from tourist_id when API omits alias", () => {
    const o = orderListItemToEscrowPrefetchOrder({
      id: PREFETCH_TEST_OID,
      state: "draft",
      tourist_id: "t1",
      guide_id: "g1",
    });
    expect(o.traveler_id).toBe("t1");
  });

  it("market OrderCardItem stashes and consumes", () => {
    stashEscrowOrderPrefetchFromMarketCard({
      id: PREFETCH_TEST_OID,
      status: "draft",
      destination: "中国",
      city: "上海",
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "walk" }] },
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.destination).toBe("中国");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("walk");
  });

  it("orderCardItemToEscrowPrefetchOrder maps card fields", () => {
    const o = orderCardItemToEscrowPrefetchOrder({
      id: PREFETCH_TEST_OID,
      state: "draft",
      status: "draft",
      sub_status: "guide_claimed",
      amount: "99",
      escrow_address: null,
    });
    expect(o.amount).toBe("99");
    expect(o.state).toBe("draft");
    expect(o.status).toBe("draft");
    expect(o.sub_status).toBe("guide_claimed");
    expect(o.escrow_address).toBeNull();
  });

  it("orderCardItemToEscrowPrefetchOrder mirrors discover/orders participant ids (87)", () => {
    const o = orderCardItemToEscrowPrefetchOrder({
      id: PREFETCH_TEST_OID,
      tourist_id: "t-discover",
      guide_id: "g-discover",
    });
    expect(o.tourist_id).toBe("t-discover");
    expect(o.traveler_id).toBe("t-discover");
    expect(o.guide_id).toBe("g-discover");
  });

  it("orderCardItemToEscrowPrefetchOrder uses traveler_id when API sends both", () => {
    const o = orderCardItemToEscrowPrefetchOrder({
      id: PREFETCH_TEST_OID,
      tourist_id: "t1",
      traveler_id: "t-alias",
      guide_id: "g1",
    });
    expect(o.traveler_id).toBe("t-alias");
  });
});
