import { describe, it, expect } from "vitest";
import { discoverOrderDedupeKey } from "./discoverOrderDedupeKey";
import { dedupeListById, mergeListsUniqueById } from "./dedupeListById";
import type { OrderCardItem } from "./marketTypes";

describe("discoverOrderDedupeKey (54-S9)", () => {
  it("prefers order_id over id", () => {
    const o: OrderCardItem = { id: "row-2", order_id: "ord-1" };
    expect(discoverOrderDedupeKey(o)).toBe("ord-1");
  });

  it("trims order_id", () => {
    expect(discoverOrderDedupeKey({ id: "x", order_id: "  abc  " })).toBe("abc");
  });

  it("falls back to id when order_id missing or blank", () => {
    expect(discoverOrderDedupeKey({ id: "only-id" })).toBe("only-id");
    expect(discoverOrderDedupeKey({ id: "only-id", order_id: "   " })).toBe("only-id");
  });
});

describe("discover list dedupe by business key", () => {
  it("collapses two rows with same order_id but different list id", () => {
    const rows: OrderCardItem[] = [
      { id: "listing-a", order_id: "uuid-same", amount: "100" },
      { id: "listing-b", order_id: "uuid-same", amount: "200" },
    ];
    expect(dedupeListById(rows, discoverOrderDedupeKey)).toEqual([rows[0]]);
  });

  it("mergeListsUniqueById skips incoming row when order_id already seen", () => {
    const prev: OrderCardItem[] = [{ id: "l1", order_id: "o1" }];
    const inc: OrderCardItem[] = [{ id: "l2", order_id: "o1" }];
    expect(mergeListsUniqueById(prev, inc, discoverOrderDedupeKey)).toEqual(prev);
  });
});
