import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminOrdersPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminOrdersPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminOrdersPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/adminOrdersLabels.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminListPageChrome.tsx"), "utf8"),
  ].join("\n");
}

describe("admin orders page", () => {
  const src = readModuleSources();

  it("keeps admin orders route + escrow prefetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.orders");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("stashEscrowOrderPrefetchFromAdminOrderListRow");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("admin_orders_subtitle_l5");
    expect(src).toContain("shortAdminId");
    expect(src).toContain('"AdminOrdersPage"');
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("ORDERS_READ");
    expect(src).toContain("ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY");
    expect(src).toContain("AdminAppliedFiltersBanner");
    expect(src).toContain("ORDERS_LIST_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    expect(src).toContain("formatAdminMoney");
    expect(src).toContain("created");
    expect(src).toContain("admin_orders_readonly_escrow_footnote");
    expect(src).toContain("AdminOrdersOpsJumpPack");
    // Batch-13 FP-C · FO6/FO7/FO8/FO10
    expect(src).toContain("data-tt-admin-orders-id-input");
    expect(src).toContain("data-tt-admin-orders-q");
    expect(src).toContain("data-tt-admin-orders-state-select");
    expect(src).toContain("data-tt-admin-orders-ops-jump-default-closed");
    expect(src).toContain("data-tt-admin-orders-party-user");
    expect(src).toContain("/admin/disputes?orderId=");
    expect(src).toContain("data-tt-admin-orders-op-more");
    expect(src).toContain("admin_orders_op_view");
  });
});
