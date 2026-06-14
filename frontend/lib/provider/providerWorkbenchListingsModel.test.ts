import { describe, expect, it } from "vitest";
import {
  mapMerchantWorkbenchShowcaseRows,
  merchantListingDisplayTitle,
  shouldShowMerchantWorkbenchShowcaseInventory,
} from "./providerWorkbenchListingsModel";

describe("providerWorkbenchListingsModel", () => {
  it("merchantListingDisplayTitle falls back when blank", () => {
    expect(merchantListingDisplayTitle("  ", "untitled")).toBe("untitled");
    expect(merchantListingDisplayTitle(" Hangzhou tour ", "untitled")).toBe("Hangzhou tour");
  });

  it("mapMerchantWorkbenchShowcaseRows orders published before drafts", () => {
    const rows = mapMerchantWorkbenchShowcaseRows({
      published: [{ id: "p1", title: "Live" }],
      drafts: [{ id: "d1", title: "Draft" }],
      untitledKey: "untitled",
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.kind).toBe("published");
    expect(rows[1]?.kind).toBe("draft");
  });

  it("shouldShowMerchantWorkbenchShowcaseInventory", () => {
    expect(shouldShowMerchantWorkbenchShowcaseInventory([])).toBe(false);
    expect(
      shouldShowMerchantWorkbenchShowcaseInventory([
        { kind: "draft", id: "d1", title: "x" },
      ]),
    ).toBe(true);
  });
});
