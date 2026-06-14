import { describe, expect, it } from "vitest";
import type { OrderCardItem } from "@/lib/marketTypes";
import { pickDefaultBindOrderId } from "./bookGuideItineraryPicker";

function card(id: string): OrderCardItem {
  return {
    id,
    title: "t",
    status: "open",
    guide_id: null,
    user_id: "u1",
  } as OrderCardItem;
}

describe("pickDefaultBindOrderId", () => {
  it("returns empty when no bindable orders", () => {
    expect(pickDefaultBindOrderId([])).toBe("");
  });

  it("prefers landing/session order id when bindable", () => {
    const bindable = [card("a"), card("b")];
    expect(pickDefaultBindOrderId(bindable, ["b", "a"])).toBe("b");
  });

  it("falls back to first bindable when preferred not in list", () => {
    const bindable = [card("a"), card("b")];
    expect(pickDefaultBindOrderId(bindable, ["z"])).toBe("a");
  });
});
