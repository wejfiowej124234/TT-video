import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("/pay hub L5 (① · orders list continuity)", () => {
  it("exports warm dark tokens without cyan", () => {
    const src = readFileSync(join(ROOT, "lib", "pay", "payHubL5.ts"), "utf8");
    expect(src).toContain("TT_PAY_HUB_PAGE_SHELL");
    expect(src).toContain("border-ref-sun");
    expect(src).not.toContain("border-cyan");
    expect(src).toContain("data-tt-pay-hub-l5");
  });

  it("page.tsx delegates to PayPageInner", () => {
    const page = readFileSync(join(ROOT, "app", "pay", "page.tsx"), "utf8");
    expect(page).toContain("./PayPageInner");
    expect(page.length).toBeLessThan(400);
  });

  it("PayPageMain uses pay hub L5 shell and breadcrumb", () => {
    const main = readFileSync(join(ROOT, "app", "pay", "PayPageMain.tsx"), "utf8");
    expect(main).toContain("TT_PAY_HUB_PAGE_SHELL");
    expect(main).toContain("PayPageOrdersBreadcrumb");
    expect(main).toContain("payHubL5MainDataAttrs");
    expect(main).not.toContain("bg-bg-main");
  });

  it("orders list exposes pay deep-link marker", () => {
    const card = readFileSync(join(ROOT, "app", "orders", "OrdersListCardItem.tsx"), "utf8");
    expect(card).toContain('data-tt-orders-list-pay-link="1"');
    expect(card).toContain("stashEscrowOrderPrefetchFromListItem");
  });
});
