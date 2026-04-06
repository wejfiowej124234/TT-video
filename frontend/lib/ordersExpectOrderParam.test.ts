import { describe, it, expect } from "vitest";
import { ORDERS_EXPECT_ORDER_QUERY, ordersListHrefAfterCreate } from "./ordersExpectOrderParam";

describe("ordersExpectOrderParam (B-048)", () => {
  it("builds /orders URL with encoded expect_order", () => {
    const href = ordersListHrefAfterCreate("abc-def");
    expect(href).toContain("/orders?");
    expect(href).toContain(`${ORDERS_EXPECT_ORDER_QUERY}=abc-def`);
  });
});
