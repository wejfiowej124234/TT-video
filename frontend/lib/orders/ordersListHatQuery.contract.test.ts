import { describe, expect, it } from "vitest";

import { ORDERS_LIST_HAT_GUIDE } from "@/lib/guide/guideOrderCorridorModel";
import { ORDERS_LIST_HAT_MERCHANT, merchantOrdersListHref } from "@/lib/provider/merchantOrderCorridorModel";
import { workspaceOrdersViewAllHref } from "@/lib/orders/ordersListHatQuery";

describe("workspaceOrdersViewAllHref", () => {
  it("guide hat opens traveler orders list", () => {
    expect(workspaceOrdersViewAllHref(ORDERS_LIST_HAT_GUIDE)).toBe("/orders");
  });

  it("merchant hat preserves merchant corridor", () => {
    expect(workspaceOrdersViewAllHref(ORDERS_LIST_HAT_MERCHANT)).toBe(merchantOrdersListHref());
  });
});
