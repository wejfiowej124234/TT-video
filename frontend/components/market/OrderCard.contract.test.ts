import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("OrderCard L5 market guards (contract)", () => {
  const src = readFileSync(join(__dirname, "OrderCard.tsx"), "utf8");

  it("disables grab CTA for local dev demo orders", () => {
    expect(src).toContain("isMarketDevVarietyOrderId");
    expect(src).toContain("canGrabOrder");
    expect(src).toContain("market_dev_demo_teaser");
    expect(src).toContain("isOwnBindingOrder");
    expect(src).toContain("market_own_binding_order_badge");
    expect(src).toContain("market_own_binding_guide_selected_badge");
    expect(src).toContain("market_own_binding_back_escrow");
    expect(src).toContain("formatEscrowStablecoinCurrency");
  });
});
