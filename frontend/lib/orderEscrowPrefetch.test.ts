import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const __prefetchDir = dirname(fileURLToPath(import.meta.url));
import {
  consumeEscrowOrderPrefetch,
  orderCardItemToEscrowPrefetchOrder,
  orderListItemToEscrowPrefetchOrder,
  stashEscrowOrderPrefetchFromItineraryCreateResult,
  stashEscrowOrderPrefetchFromListItem,
  stashEscrowOrderPrefetchFromMarketCard,
  stashEscrowOrderPrefetchFromOrderAndItinerary,
  stashEscrowOrderPrefetchFromOrderIdOnly,
  stashEscrowOrderPrefetchForFromOrderDeepLink,
  stashEscrowOrderPrefetchForOrderIdNav,
  stashEscrowOrderPrefetchForPayHubEscrowNav,
  stashEscrowOrderPrefetchForRatingPageMainNav,
  stashEscrowOrderPrefetchFromOrderResponse,
  stashEscrowOrderPrefetchFromAdminOrderDetailBody,
  stashEscrowOrderPrefetchFromPostOrderSuccess,
  stashEscrowOrderPrefetchMinimalIfAbsent,
  stashEscrowOrderPrefetchFromAdminOrderListRow,
} from "./orderEscrowPrefetch";

const OID = "550e8400-e29b-41d4-a716-446655440000";

describe("orderEscrowPrefetch", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stashes and consumes matching order with itinerary", () => {
    stashEscrowOrderPrefetchFromListItem({
      id: OID,
      status: "draft",
      amount: "100",
      itinerary: { version: 1, daily_itinerary: [{ day_index: 1, content_text: "x" }] },
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.order.status).toBe("draft");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("x");
    expect(sessionStorage.length).toBe(0);
  });

  it("returns null when id mismatch", () => {
    stashEscrowOrderPrefetchFromListItem({ id: OID, status: "draft" });
    expect(consumeEscrowOrderPrefetch("other-id")).toBeNull();
    expect(sessionStorage.length).toBe(1);
  });

  it("returns null when expired", () => {
    stashEscrowOrderPrefetchFromListItem({ id: OID, status: "draft" });
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(consumeEscrowOrderPrefetch(OID)).toBeNull();
  });

  it("orderListItemToEscrowPrefetchOrder maps list fields", () => {
    const o = orderListItemToEscrowPrefetchOrder({
      id: OID,
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
      id: OID,
      state: "draft",
      tourist_id: "t1",
      guide_id: "g1",
    });
    expect(o.traveler_id).toBe("t1");
  });

  it("market OrderCardItem stashes and consumes", () => {
    stashEscrowOrderPrefetchFromMarketCard({
      id: OID,
      status: "draft",
      destination: "中国",
      city: "上海",
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "walk" }] },
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.destination).toBe("中国");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("walk");
  });

  it("orderCardItemToEscrowPrefetchOrder maps card fields", () => {
    const o = orderCardItemToEscrowPrefetchOrder({
      id: OID,
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
      id: OID,
      tourist_id: "t-discover",
      guide_id: "g-discover",
    });
    expect(o.tourist_id).toBe("t-discover");
    expect(o.traveler_id).toBe("t-discover");
    expect(o.guide_id).toBe("g-discover");
  });

  it("orderCardItemToEscrowPrefetchOrder uses traveler_id when API sends both", () => {
    const o = orderCardItemToEscrowPrefetchOrder({
      id: OID,
      tourist_id: "t1",
      traveler_id: "t-alias",
      guide_id: "g1",
    });
    expect(o.traveler_id).toBe("t-alias");
  });

  it("stashEscrowOrderPrefetchFromOrderResponse maps GET order shape", () => {
    stashEscrowOrderPrefetchFromOrderResponse(OID, {
      order: { id: OID, destination: "中国", amount: "1" },
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "a" }] },
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.destination).toBe("中国");
    expect(got?.itinerary?.daily_itinerary).toHaveLength(1);
  });

  it("stashEscrowOrderPrefetchFromAdminOrderDetailBody forwards admin detail body", () => {
    stashEscrowOrderPrefetchFromAdminOrderDetailBody(OID, { id: OID, amount: "42", state: "escrowed" }, null);
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.amount).toBe("42");
    expect(got?.order.state).toBe("escrowed");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink uses full GET shape when present", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(
      OID,
      { order: { id: OID, destination: "JP" }, itinerary: null },
      "pay",
    );
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.destination).toBe("JP");
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink escrow branch without full uses id-only", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(OID, null, "escrow");
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForFromOrderDeepLink pay branch without full uses minimal-if-absent", () => {
    stashEscrowOrderPrefetchForFromOrderDeepLink(OID, undefined, "pay");
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
  });

  it("stashEscrowOrderPrefetchForOrderIdNav escrow matches id-only", () => {
    stashEscrowOrderPrefetchForOrderIdNav(OID, "escrow");
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForOrderIdNav pay matches minimal-if-absent on empty session", () => {
    stashEscrowOrderPrefetchForOrderIdNav(OID, "pay");
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
  });

  it("stashEscrowOrderPrefetchForPayHubEscrowNav uses response when present", () => {
    stashEscrowOrderPrefetchForPayHubEscrowNav(OID, {
      order: { id: OID, destination: "JP" },
      itinerary: null,
    });
    expect(consumeEscrowOrderPrefetch(OID)?.order.destination).toBe("JP");
  });

  it("stashEscrowOrderPrefetchForPayHubEscrowNav falls back to minimal-if-absent", () => {
    stashEscrowOrderPrefetchForPayHubEscrowNav(OID, null);
    expect(consumeEscrowOrderPrefetch(OID)?.order.id).toBe(OID);
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav prefers full response over head", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(
      OID,
      { order: { id: OID, state: "completed" }, itinerary: { daily_itinerary: [] } },
      { id: OID, state: "draft" },
    );
    expect(consumeEscrowOrderPrefetch(OID)?.order.state).toBe("completed");
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav uses order head when no full response", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(OID, null, {
      id: OID,
      state: "completed",
      sub_status: "rating_pending",
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.sub_status).toBe("rating_pending");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchForRatingPageMainNav uses minimal when no data", () => {
    stashEscrowOrderPrefetchForRatingPageMainNav(OID, undefined, null);
    expect(consumeEscrowOrderPrefetch(OID)?.order.id).toBe(OID);
  });

  it("stashEscrowOrderPrefetchFromOrderIdOnly writes minimal row", () => {
    stashEscrowOrderPrefetchFromOrderIdOnly(OID);
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchFromItineraryCreateResult embeds daily + breakdown", () => {
    stashEscrowOrderPrefetchFromItineraryCreateResult(OID, {
      version: 2,
      order_status: "draft",
      daily_itinerary: [{ day_index: 1, content_text: "x" }],
      amount_breakdown: { hotel: 1, catering: 2, tickets: 0, guide_fee: 0, vehicle: 0, platform_fee: 0, total_budget: 3 },
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.status).toBe("draft");
    expect(got?.itinerary?.amount_breakdown?.total_budget).toBe(3);
  });

  it("stashEscrowOrderPrefetchFromPostOrderSuccess stores minimal row", () => {
    stashEscrowOrderPrefetchFromPostOrderSuccess({
      id: OID,
      amount: "500",
      currency: "USD",
      guide_id: "g-1",
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.amount).toBe("500");
    expect(got?.order.guide_id).toBe("g-1");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchMinimalIfAbsent writes when no prefetch", () => {
    stashEscrowOrderPrefetchMinimalIfAbsent(OID);
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchFromAdminOrderListRow maps admin orders table row", () => {
    stashEscrowOrderPrefetchFromAdminOrderListRow({
      id: OID,
      state: "funded",
      amount: "99",
      currency: "USDT",
      tourist_id: "t1",
      guide_id: "g1",
      created_at: "2026-01-01T00:00:00.000Z",
      escrow_address: "0x0000000000000000000000000000000000000001",
    });
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.state).toBe("funded");
    expect(got?.order.amount).toBe("99");
    expect(got?.order.currency).toBe("USDT");
    expect(got?.order.tourist_id).toBe("t1");
    expect(got?.order.guide_id).toBe("g1");
    expect(got?.order.escrow_address).toBe("0x0000000000000000000000000000000000000001");
    expect(got?.itinerary).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("stashEscrowOrderPrefetchMinimalIfAbsent does not overwrite fresh richer stash", () => {
    stashEscrowOrderPrefetchFromListItem({
      id: OID,
      status: "escrowed",
      amount: "200",
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "keep" }] },
    });
    stashEscrowOrderPrefetchMinimalIfAbsent(OID);
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.status).toBe("escrowed");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("keep");
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary stores order and itinerary (Escrow / Pay nav from context card)", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(
      OID,
      {
        id: OID,
        status: "escrowed",
        amount: "50",
        currency: "USDT",
        tourist_id: "t9",
      },
      { daily_itinerary: [{ day_index: 1, content_text: "ctx" }] },
    );
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.order.tourist_id).toBe("t9");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("ctx");
    expect(sessionStorage.length).toBe(0);
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary allows null itinerary", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(
      OID,
      { id: OID, status: "funded", amount: "1", currency: "USDT" },
      null,
    );
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary uses id when order payload is null", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(OID, null, null);
    const got = consumeEscrowOrderPrefetch(OID);
    expect(got?.order.id).toBe(OID);
    expect(got?.itinerary).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("header documents 641 OrderChatContextCard stash machine-read rule + 627～810 ledger (07 §6.4 CI lock)", () => {
    const src = readFileSync(join(__prefetchDir, "orderEscrowPrefetch.ts"), "utf8");
    expect(src).toContain("627～810");
    expect(src).toContain("641 机读");
    expect(src).toContain("OrderChatContextCard.tsx");
    expect(src).toContain("stashEscrowOrderPrefetchFromOrderAndItinerary");
  });
});
