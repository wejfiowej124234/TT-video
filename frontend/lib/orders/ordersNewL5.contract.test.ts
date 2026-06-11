import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ORDERS_NEW_L5_SSOT_ID,
  ORDERS_NEW_L5_VISUAL_DATA_ATTR,
  TT_ORDERS_NEW_L5,
  ordersNewL5MainDataAttrs,
} from "@/lib/orders/ordersNewL5";

const root = join(process.cwd());
const main = join(root, "app/orders/new/OrdersNewPageMain.tsx");
const page = join(root, "app/orders/new/page.tsx");
const loading = join(root, "app/orders/new/loading.tsx");
const footer = join(root, "app/orders/new/OrdersNewPageFooter.tsx");
const suspense = join(root, "components/orders/OrdersNewRouteSuspense.tsx");

describe("orders new L5 contract (① · dark cinematic)", () => {
  it("exports SSOT tokens + stable data attrs", () => {
    expect(ORDERS_NEW_L5_VISUAL_DATA_ATTR).toBe("l5");
    expect(ORDERS_NEW_L5_SSOT_ID).toContain("TT-ORDERS-NEW-L5");
    expect(TT_ORDERS_NEW_L5.pageShell).toContain("#0c0a09");
    expect(TT_ORDERS_NEW_L5.pageVignette).toContain("experience-landing-vignette");
    expect(TT_ORDERS_NEW_L5.dotGrid).toContain("bg-web3-dot-grid");
    expect(TT_ORDERS_NEW_L5.formFrame).toContain("animate-fadeUp");
    expect(TT_ORDERS_NEW_L5.formField).toContain("text-slate-100");
    expect(TT_ORDERS_NEW_L5.formField).toContain("border-white/20");
    expect(TT_ORDERS_NEW_L5.title).toContain("drop-shadow-landing-hero");
    expect(TT_ORDERS_NEW_L5.crossNavLink).toContain("text-slate-200");
    expect(TT_ORDERS_NEW_L5.submitBtn).toContain("text-[#0c0a09]");
    expect(ordersNewL5MainDataAttrs()["data-tt-orders-new-page"]).toBe("1");
    expect(ordersNewL5MainDataAttrs()["data-tt-orders-new-l5"]).toBe("l5");
  });

  it("OrdersNewPageMain wires L5 shell + experience flow steps", () => {
    const src = readFileSync(main, "utf8");
    expect(src).toContain("ordersNewL5MainDataAttrs");
    expect(src).toContain("TT_ORDERS_NEW_L5.pageShell");
    expect(src).toContain("TT_ORDERS_NEW_L5.pageVignette");
    expect(src).toContain("TT_ORDERS_NEW_L5.ambient");
    expect(src).toContain("TT_ORDERS_NEW_L5.dotGrid");
    expect(src).toContain('variant="experience"');
    expect(src).toContain("compact");
    expect(src).toContain("draftJourneyStep={1}");
    expect(src).not.toMatch(/variant="experience"\s*\/>/);
    expect(src).toContain('tone="dark"');
    expect(src).toContain("OrdersNewPageFooter");
    expect((src.match(/<OrdersNewCrossNav/g) ?? []).length).toBe(1);
    expect(src).not.toContain("text-ink-");
    expect(src).not.toContain("bg-bg-main");
    expect(src).not.toContain("bg-bg-console");
    expect(src).not.toContain("TT_MARKETING_PRODUCT_PAGE_SHELL");
    expect(src).not.toContain("TT_MARKETING_CONSOLE_INLINE_LINK");
    expect(src).toContain("marketHrefForPickGuide");
    expect(src).toContain("orders_change_guide");
    expect(src).toContain("orders_pick_guide_at_market");
    expect(src).not.toContain("<select");
    expect(src).not.toContain("guidePickerOpen");
    expect(src).toContain("OrdersNewGuideSummary");
    expect(src).toContain("scheduleBlocked");
  });

  it("page.tsx delegates to hook + OrdersNewPageMain", () => {
    const src = readFileSync(page, "utf8");
    expect(src).toContain("useOrdersNewPage");
    expect(src).toContain("OrdersNewPageMain");
    expect(src).toContain("<OrdersNewPageMain {...vm} />");
    expect(src).not.toContain("<OrdersNewPageMain vm={vm} />");
    expect(src).not.toContain("postOrder");
    expect(src).not.toContain("text-travel-500");
  });

  it("loading + suspense use dark L5 shell", () => {
    const loadingSrc = readFileSync(loading, "utf8");
    expect(loadingSrc).toContain("TT_ORDERS_NEW_L5.pageShell");
    expect(loadingSrc).not.toContain("bg-bg-main");
    expect(loadingSrc).not.toContain("border-travel-500");

    const suspenseSrc = readFileSync(suspense, "utf8");
    expect(suspenseSrc).toContain("TT_ORDERS_NEW_L5");
    expect(suspenseSrc).not.toContain("text-ink-500");
    expect(suspenseSrc).not.toContain("bg-bg-main");
  });

  it("footer uses slim OrdersProductFooter (not LandingFooter)", () => {
    const src = readFileSync(footer, "utf8");
    expect(src).toContain("OrdersProductFooter");
    expect(src).toContain("TT_ORDERS_PRODUCT_FOOTER.innerNarrow");
    expect(src).not.toMatch(/import\s+LandingFooter/);
  });
});
