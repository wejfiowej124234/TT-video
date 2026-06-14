import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDE_ORDER_CORRIDOR_SPRINT_MARKER } from "./guideOrderCorridorModel";

const root = join(process.cwd());

describe("Guide Order Corridor Closure Sprint (① local)", () => {
  it("exports sprint marker", () => {
    expect(GUIDE_ORDER_CORRIDOR_SPRINT_MARKER).toBe("guide-order-corridor-closure-20260612");
  });

  it("orders list applies hat=guide filter in core hook", () => {
    const core = readFileSync(join(root, "app/orders/useOrdersListPageCore.ts"), "utf8");
    expect(core).toContain("filterOrdersForGuideReception");
    expect(core).toContain("parseOrdersListHat");
    expect(core).toContain("getMeGuideProfile");
    expect(core).toContain("ordersListHatForApi(ordersListHat)");
  });

  it("inbox fetch uses server hat=guide", () => {
    const inbox = readFileSync(join(root, "app/guide/useGuideWorkbenchInbox.ts"), "utf8");
    expect(inbox).toContain('hat: "guide"');
  });

  it("guide orders list uses guide-specific header and empty state", () => {
    const main = readFileSync(join(root, "app/orders/OrdersListPageMain.tsx"), "utf8");
    const header = readFileSync(join(root, "app/orders/OrdersListPageHeader.tsx"), "utf8");
    const empty = readFileSync(join(root, "app/orders/OrdersListEmptyState.tsx"), "utf8");
    expect(main).toContain('data-tt-orders-list-hat": "guide"');
    expect(header).toContain("guide_orders_list_title");
    expect(empty).toContain("guide_orders_empty");
    expect(main).toContain("workspaceOrdersHat");
  });

  it("inbox model filters by guideRowId not workspace trip line", () => {
    const model = readFileSync(join(root, "lib/guide/guideWorkbenchInboxModel.ts"), "utf8");
    expect(model).toContain("filterOrdersForGuideReception");
    expect(model).not.toContain('filterOrdersForWorkspaceIdentity(items, "guide")');
  });
});
