import { describe, expect, it } from "vitest";
import {
  consumeEscrowOrderPrefetch,
  stashEscrowOrderPrefetchForFromOrderDeepLink,
  stashEscrowOrderPrefetchForOrderIdNav,
  stashEscrowOrderPrefetchForPayHubEscrowNav,
  stashEscrowOrderPrefetchForRatingPageMainNav,
  stashEscrowOrderPrefetchFromAdminOrderDetailBody,
  stashEscrowOrderPrefetchFromOrderResponse,
} from "./orderEscrowPrefetch";
import { PREFETCH_TEST_OID, useOrderEscrowPrefetchTestHooks } from "./orderEscrowPrefetch.vitestShared";

describe("orderEscrowPrefetch · stash from API / admin / nav helpers", () => {
  useOrderEscrowPrefetchTestHooks();

  it("stashEscrowOrderPrefetchFromOrderResponse maps GET order shape", () => {
    stashEscrowOrderPrefetchFromOrderResponse(PREFETCH_TEST_OID, {
      order: { id: PREFETCH_TEST_OID, destination: "中国", amount: "1" },
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "a" }] },
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.destination).toBe("中国");
    expect(got?.itinerary?.daily_itinerary).toHaveLength(1);
  });

  it("stashEscrowOrderPrefetchFromAdminOrderDetailBody forwards admin detail body", () => {
    stashEscrowOrderPrefetchFromAdminOrderDetailBody(
      PREFETCH_TEST_OID,
      { id: PREFETCH_TEST_OID, amount: "42", state: "escrowed" },
      null,
    );
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.amount).toBe("42");
    expect(got?.order.state).toBe("escrowed");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink uses full GET shape when present", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(
      PREFETCH_TEST_OID,
      { order: { id: PREFETCH_TEST_OID, destination: "JP" }, itinerary: null },
      "pay",
    );
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.destination).toBe("JP");
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink escrow branch without full uses id-only", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(PREFETCH_TEST_OID, null, "escrow");
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink pay branch without full uses minimal-if-absent", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(PREFETCH_TEST_OID, undefined, "pay");
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
  });

  it("stashEscrowOrderPrefetchForOrderIdNav escrow matches id-only", () => {
    stashEscrowOrderPrefetchForOrderIdNav(PREFETCH_TEST_OID, "escrow");
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForOrderIdNav pay matches minimal-if-absent on empty session", () => {
    stashEscrowOrderPrefetchForOrderIdNav(PREFETCH_TEST_OID, "pay");
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
  });

  it("stashEscrowOrderPrefetchForPayHubEscrowNav uses response when present", () => {
    stashEscrowOrderPrefetchForPayHubEscrowNav(PREFETCH_TEST_OID, {
      order: { id: PREFETCH_TEST_OID, destination: "JP" },
      itinerary: null,
    });
    expect(consumeEscrowOrderPrefetch(PREFETCH_TEST_OID)?.order.destination).toBe("JP");
  });

  it("stashEscrowOrderPrefetchForPayHubEscrowNav falls back to minimal-if-absent", () => {
    stashEscrowOrderPrefetchForPayHubEscrowNav(PREFETCH_TEST_OID, null);
    expect(consumeEscrowOrderPrefetch(PREFETCH_TEST_OID)?.order.id).toBe(PREFETCH_TEST_OID);
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav prefers full response over head", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(
      PREFETCH_TEST_OID,
      { order: { id: PREFETCH_TEST_OID, state: "completed" }, itinerary: { daily_itinerary: [] } },
      { id: PREFETCH_TEST_OID, state: "draft" },
    );
    expect(consumeEscrowOrderPrefetch(PREFETCH_TEST_OID)?.order.state).toBe("completed");
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav uses order head when no full response", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(PREFETCH_TEST_OID, null, {
      id: PREFETCH_TEST_OID,
      state: "completed",
      sub_status: "rating_pending",
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.sub_status).toBe("rating_pending");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav uses minimal when no data", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(PREFETCH_TEST_OID, undefined, null);
    expect(consumeEscrowOrderPrefetch(PREFETCH_TEST_OID)?.order.id).toBe(PREFETCH_TEST_OID);
  });
});
