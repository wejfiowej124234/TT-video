import { describe, expect, it } from "vitest";
import {
  filterOrdersForCommunityMeMyOrdersSurface,
  filterOrdersForOrdersListPage,
  filterOrdersForTransactionalMyOrdersSurface,
  isMarketplaceListingOnlyDraft,
  orderListItemMayRequestCancel,
} from "./communityMeMyOrdersModel";
import type { OrderListItem } from "@/lib/apiClient";

function item(partial: Partial<OrderListItem> & { id: string }): OrderListItem {
  return { ...partial } as OrderListItem;
}

describe("communityMeMyOrdersModel", () => {
  it("treats draft and open as marketplace-only listing", () => {
    expect(isMarketplaceListingOnlyDraft(item({ id: "1", state: "draft" }))).toBe(true);
    expect(isMarketplaceListingOnlyDraft(item({ id: "2", state: "OPEN" }))).toBe(true);
    expect(isMarketplaceListingOnlyDraft(item({ id: "3", state: "created" }))).toBe(false);
  });

  it("filterOrdersForCommunityMeMyOrdersSurface removes draft", () => {
    const a = item({ id: "a", state: "draft" });
    const b = item({ id: "b", state: "escrowed" });
    expect(filterOrdersForCommunityMeMyOrdersSurface([a, b]).map((x) => x.id)).toEqual(["b"]);
    expect(filterOrdersForTransactionalMyOrdersSurface([a, b]).map((x) => x.id)).toEqual(["b"]);
  });

  it("filterOrdersForOrdersListPage keeps drafts only on draft tab", () => {
    const a = item({ id: "a", state: "draft" });
    const b = item({ id: "b", state: "created" });
    expect(filterOrdersForOrdersListPage([a, b], "draft").map((x) => x.id)).toEqual(["a"]);
    expect(filterOrdersForOrdersListPage([a, b], null).map((x) => x.id)).toEqual(["b"]);
  });

  it("orderListItemMayRequestCancel matches pre-escrow states", () => {
    expect(orderListItemMayRequestCancel(item({ id: "0", state: "draft" }))).toBe(true);
    expect(orderListItemMayRequestCancel(item({ id: "1", state: "created" }))).toBe(true);
    expect(orderListItemMayRequestCancel(item({ id: "2", state: "accepted" }))).toBe(true);
    expect(orderListItemMayRequestCancel(item({ id: "3", state: "escrowed" }))).toBe(false);
  });
});
