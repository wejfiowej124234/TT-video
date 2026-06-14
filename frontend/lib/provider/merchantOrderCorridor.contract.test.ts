import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MERCHANT_ORDER_CORRIDOR_SPRINT_MARKER } from "./merchantOrderCorridorModel";

const root = join(process.cwd());

describe("Merchant Order Corridor Closure Sprint (① local)", () => {
  it("exports sprint marker", () => {
    expect(MERCHANT_ORDER_CORRIDOR_SPRINT_MARKER).toBe("merchant-order-corridor-closure-20260612");
  });

  it("inbox and orders list use hat=merchant", () => {
    const inbox = readFileSync(join(root, "app/provider/useProviderWorkbenchInbox.ts"), "utf8");
    const core = readFileSync(join(root, "app/orders/useOrdersListPageCore.ts"), "utf8");
    expect(inbox).toContain('hat: "merchant"');
    expect(core).toContain("ordersListHatForApi");
    expect(core).toContain("filterOrdersForMerchantSellerService");
  });

  it("workbench uses market exposure card and billing stats", () => {
    const page = readFileSync(join(root, "app/provider/page.tsx"), "utf8");
    expect(page).toContain("MerchantWorkbenchMarketExposureCard");
    expect(page).toContain("ProviderWorkbenchBillingPeriodCard");
    expect(page).toContain('footerTarget={fromSettings ? "settings" : "none"}');
    expect(page).not.toContain("ProviderWorkbenchShowcaseSection");
  });
});
