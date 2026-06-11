import { describe, expect, it, vi } from "vitest";
import {
  hydrateLandingUnlockedOrderDetails,
  landingOrderHydrateShouldDrop,
  landingOrderResponseShouldDrop,
  pruneLandingSessionOrderIds,
} from "./landingItineraryHydrate";

describe("landingItineraryHydrate", () => {
  it("drops stale order ids on not_found", () => {
    expect(landingOrderHydrateShouldDrop(new Error("order_not_found"))).toBe(true);
    expect(landingOrderHydrateShouldDrop(new Error("network"))).toBe(false);
  });

  it("drops cancelled orders from preview session", () => {
    expect(landingOrderResponseShouldDrop({ order: { status: "cancelled" } })).toBe(true);
    expect(landingOrderResponseShouldDrop({ order: { status: "draft" } })).toBe(false);
  });

  it("hydrates unlocked orders and collects stale ids", async () => {
    const fetchOrder = vi
      .fn()
      .mockResolvedValueOnce({ order: { id: "a" } })
      .mockRejectedValueOnce(new Error("order_not_found"));
    const { details, staleIds } = await hydrateLandingUnlockedOrderDetails(["a", "b"], fetchOrder);
    expect(details.a).toEqual({ order: { id: "a" } });
    expect(staleIds).toEqual(["b"]);
  });

  it("treats cancelled fetch results as stale", async () => {
    const fetchOrder = vi.fn().mockResolvedValueOnce({ order: { id: "x", status: "cancelled" } });
    const { details, staleIds } = await hydrateLandingUnlockedOrderDetails(["x"], fetchOrder);
    expect(details).toEqual({});
    expect(staleIds).toEqual(["x"]);
  });

  it("prunes session sets when stale", () => {
    const out = pruneLandingSessionOrderIds(
      ["a", "b"],
      new Set(["a", "b"]),
      new Set(["a"]),
      ["b"],
    );
    expect(out.resultOrderIds).toEqual(["a"]);
    expect([...out.unlockedOrderIds]).toEqual(["a"]);
    expect([...out.favoritedIds]).toEqual(["a"]);
  });
});
