import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第二十二批 UX · 经营列表空态 SSOT / applied_filters 横幅 token / 筛选空 marker 对拍。 */
describe("admin batch22 UX L5 (①)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const appliedBanner = readFileSync(join(componentsAdmin, "AdminAppliedFiltersBanner.tsx"), "utf8");
  const emptyState = readFileSync(join(componentsAdmin, "AdminListPageEmptyState.tsx"), "utf8");
  const orders = readFileSync(join(appAdmin, "orders", "AdminOrdersPageMain.tsx"), "utf8");
  const disputes = readFileSync(join(appAdmin, "disputes", "AdminDisputesPageMain.tsx"), "utf8");
  const users = readFileSync(join(appAdmin, "users", "AdminUsersDataSection.tsx"), "utf8");
  const nextLinks = readFileSync(join(__dir, "adminListEmptyStateNextLinks.ts"), "utf8");

  it("defines applied filters banner SSOT tokens", () => {
    expect(adminUi).toContain("ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_APPLIED_FILTERS_BANNER_INLINE_CLASS");
    expect(adminUi).toContain("ADMIN_APPLIED_FILTERS_BANNER_PANEL_CLASS");
    expect(appliedBanner).toContain("ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS");
    expect(appliedBanner).toContain('data-tt-admin-applied-filters="1"');
    expect(appliedBanner).toContain("data-tt-admin-applied-filters-variant");
  });

  it("orders/disputes/users empty states wire ops SSOT + filtered marker", () => {
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY");
    expect(orders).toContain("ADMIN_EMPTY_NEXT_ORDERS_FILTERED_EMPTY");
    expect(disputes).toContain("ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY");
    expect(users).toContain("ADMIN_EMPTY_NEXT_USERS_FILTERED_EMPTY");
    expect(emptyState).toContain("data-tt-admin-list-empty-filtered");
    expect(orders).toContain("filteredEmpty={Boolean(appliedHuman)}");
    expect(users).toContain("filteredEmpty={Boolean(appliedFilters)}");
  });

  it("disputes empty adds approvals cross-link (third hop)", () => {
    expect(disputes).toContain("ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY");
    expect(nextLinks).toMatch(/ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY[\s\S]*ADMIN_EMPTY_NEXT_APPROVALS_QUEUE/);
  });
});
