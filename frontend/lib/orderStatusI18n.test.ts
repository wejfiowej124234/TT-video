import { describe, expect, it } from "vitest";
import { orderStateToBadgeVariant, orderStateToStatusLabelKey } from "./orderStatusI18n";

describe("orderStateToStatusLabelKey", () => {
  it("accepts legacy string input (lowercased)", () => {
    expect(orderStateToStatusLabelKey("DRAFT")).toBe("order_status_draft");
    expect(orderStateToStatusLabelKey("ESCROWED")).toBe("order_status_escrowed");
  });

  it("maps terminal / risk states", () => {
    expect(orderStateToStatusLabelKey({ state: "cancelled" })).toBe("order_status_cancelled");
    expect(orderStateToStatusLabelKey({ status: "canceled" })).toBe("order_status_cancelled");
    expect(orderStateToStatusLabelKey({ state: "disputed" })).toBe("order_status_disputed");
    expect(orderStateToStatusLabelKey({ state: "partially_refunded" })).toBe("order_status_partially_refunded");
    expect(orderStateToStatusLabelKey({ state: "slashed" })).toBe("order_status_slashed");
  });

  it("draft family + sub_status guide_claimed", () => {
    expect(orderStateToStatusLabelKey({ state: "draft" })).toBe("order_status_draft");
    expect(orderStateToStatusLabelKey({ state: "created" })).toBe("order_status_created_listing");
    expect(orderStateToStatusLabelKey({ state: "open" })).toBe("order_status_created_listing");
    expect(orderStateToStatusLabelKey({ state: "draft", sub_status: "guide_claimed" })).toBe(
      "order_status_pending_guide_confirm"
    );
    expect(orderStateToStatusLabelKey({ state: "draft", sub_status: "guide-claimed" })).toBe(
      "order_status_pending_guide_confirm"
    );
  });

  it("accepted + sub_status", () => {
    expect(orderStateToStatusLabelKey({ state: "accepted" })).toBe("order_status_bilateral_pending");
    expect(orderStateToStatusLabelKey({ state: "accepted", sub_status: "pending_bilateral" })).toBe(
      "order_status_bilateral_pending"
    );
    expect(orderStateToStatusLabelKey({ state: "accepted", sub_status: "confirmed" })).toBe(
      "order_status_confirmed_awaiting_payment"
    );
  });

  it("funded / escrowed / confirmed / closed", () => {
    expect(orderStateToStatusLabelKey({ state: "funded" })).toBe("order_status_escrowed");
    expect(orderStateToStatusLabelKey({ state: "escrowed" })).toBe("order_status_escrowed");
    expect(orderStateToStatusLabelKey({ state: "confirmed" })).toBe("order_status_confirmed_awaiting_payment");
    expect(orderStateToStatusLabelKey({ state: "closed" })).toBe("order_status_closed");
  });

  it("completed / released + rating sub", () => {
    expect(orderStateToStatusLabelKey({ state: "completed" })).toBe("order_status_completed");
    expect(orderStateToStatusLabelKey({ state: "released", sub_status: "rating_pending" })).toBe(
      "order_status_rating_pending"
    );
    expect(orderStateToStatusLabelKey({ state: "completed", sub_status: "rating_confirmed" })).toBe(
      "order_status_rating_confirmed"
    );
  });

  it("falls back to unknown", () => {
    expect(orderStateToStatusLabelKey({ state: "weird_future_state" })).toBe("order_status_unknown");
    expect(orderStateToStatusLabelKey({})).toBe("order_status_unknown");
  });
});

describe("orderStateToBadgeVariant", () => {
  it("matches prior orders list semantics + rating_pending emphasis", () => {
    expect(orderStateToBadgeVariant({ state: "created" })).toBe("warning");
    expect(orderStateToBadgeVariant({ state: "draft" })).toBe("neutral");
    expect(orderStateToBadgeVariant({ state: "draft", sub_status: "guide_claimed" })).toBe("warning");
    expect(orderStateToBadgeVariant({ state: "accepted" })).toBe("warning");
    expect(orderStateToBadgeVariant({ state: "escrowed" })).toBe("warning");
    expect(orderStateToBadgeVariant({ state: "completed" })).toBe("success");
    expect(orderStateToBadgeVariant({ state: "completed", sub_status: "rating_pending" })).toBe("warning");
    expect(orderStateToBadgeVariant({ state: "released", sub_status: "rating_confirmed" })).toBe("success");
    expect(orderStateToBadgeVariant({ state: "cancelled" })).toBe("danger");
  });
});
