import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  consumeEscrowOrderPrefetch,
  stashEscrowOrderPrefetchFromAdminOrderListRow,
  stashEscrowOrderPrefetchFromItineraryCreateResult,
  stashEscrowOrderPrefetchFromOrderAndItinerary,
  stashEscrowOrderPrefetchFromOrderIdOnly,
  stashEscrowOrderPrefetchFromPostOrderSuccess,
  stashEscrowOrderPrefetchMinimalIfAbsent,
  stashEscrowOrderPrefetchFromListItem,
} from "./orderEscrowPrefetch";
import { PREFETCH_TEST_OID, useOrderEscrowPrefetchTestHooks } from "./orderEscrowPrefetch.vitestShared";

const __prefetchDir = dirname(fileURLToPath(import.meta.url));

describe("orderEscrowPrefetch · itinerary / admin row / doc lock", () => {
  useOrderEscrowPrefetchTestHooks();

  it("stashEscrowOrderPrefetchFromOrderIdOnly writes minimal row", () => {
    stashEscrowOrderPrefetchFromOrderIdOnly(PREFETCH_TEST_OID);
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchFromItineraryCreateResult embeds daily + breakdown", () => {
    stashEscrowOrderPrefetchFromItineraryCreateResult(PREFETCH_TEST_OID, {
      version: 2,
      order_status: "draft",
      daily_itinerary: [{ day_index: 1, content_text: "x" }],
      amount_breakdown: {
        hotel: 1,
        catering: 2,
        tickets: 0,
        guide_fee: 0,
        vehicle: 0,
        platform_fee: 0,
        total_budget: 3,
      },
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.status).toBe("draft");
    expect(got?.itinerary?.amount_breakdown?.total_budget).toBe(3);
  });

  it("stashEscrowOrderPrefetchFromPostOrderSuccess stores minimal row", () => {
    stashEscrowOrderPrefetchFromPostOrderSuccess({
      id: PREFETCH_TEST_OID,
      amount: "500",
      currency: "USD",
      guide_id: "g-1",
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.amount).toBe("500");
    expect(got?.order.guide_id).toBe("g-1");
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchMinimalIfAbsent writes when no prefetch", () => {
    stashEscrowOrderPrefetchMinimalIfAbsent(PREFETCH_TEST_OID);
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
  });

  it("stashEscrowOrderPrefetchFromAdminOrderListRow maps admin orders table row", () => {
    stashEscrowOrderPrefetchFromAdminOrderListRow({
      id: PREFETCH_TEST_OID,
      state: "funded",
      amount: "99",
      currency: "USDT",
      tourist_id: "t1",
      guide_id: "g1",
      created_at: "2026-01-01T00:00:00.000Z",
      escrow_address: "0x0000000000000000000000000000000000000001",
    });
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
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
      id: PREFETCH_TEST_OID,
      status: "escrowed",
      amount: "200",
      itinerary: { daily_itinerary: [{ day_index: 1, content_text: "keep" }] },
    });
    stashEscrowOrderPrefetchMinimalIfAbsent(PREFETCH_TEST_OID);
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.status).toBe("escrowed");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("keep");
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary stores order and itinerary (Escrow / Pay nav from context card)", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(
      PREFETCH_TEST_OID,
      {
        id: PREFETCH_TEST_OID,
        status: "escrowed",
        amount: "50",
        currency: "USDT",
        tourist_id: "t9",
      },
      { daily_itinerary: [{ day_index: 1, content_text: "ctx" }] },
    );
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.order.tourist_id).toBe("t9");
    expect(got?.itinerary?.daily_itinerary?.[0]?.content_text).toBe("ctx");
    expect(sessionStorage.length).toBe(0);
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary allows null itinerary", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(
      PREFETCH_TEST_OID,
      { id: PREFETCH_TEST_OID, status: "funded", amount: "1", currency: "USDT" },
      null,
    );
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("stashEscrowOrderPrefetchFromOrderAndItinerary uses id when order payload is null", () => {
    stashEscrowOrderPrefetchFromOrderAndItinerary(PREFETCH_TEST_OID, null, null);
    const got = consumeEscrowOrderPrefetch(PREFETCH_TEST_OID);
    expect(got?.order.id).toBe(PREFETCH_TEST_OID);
    expect(got?.itinerary).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("header documents 641 OrderChatContextCard stash machine-read rule + 627～810 ledger (07 §6.4 CI lock)", () => {
    const src = readFileSync(join(__prefetchDir, "orderEscrowPrefetch.ts"), "utf8");
    expect(src).toContain("627～810");
    expect(src).toContain("641 机读");
    expect(src).toContain("OrderChatContextCardDeepLinks.tsx");
    expect(src).toContain("stashEscrowOrderPrefetchFromOrderAndItinerary");
  });
});
