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
    expect(src).toContain("CONSUMER_TRIP_CURRENCY_LOCALE_KEY");
    expect(src).toContain("useViewerUserId");
    expect(src).toContain("data-tt-market-card-own-escrow");
    expect(src).toContain("data-tt-market-card-own-pay");
    expect(src).not.toMatch(/typeof window !== "undefined"\s*\?\s*localStorage/);
    /** P0：禁止无 onViewDetail 时 fallback 直链 /escrow（他人订单） */
    expect(src).not.toMatch(
      /onViewDetail \?[\s\S]*?: \(\s*<Link[\s\S]*?href=\{`\/escrow\/\$\{encodeURIComponent\(item\.id\)\}`\}/,
    );
  });
});
