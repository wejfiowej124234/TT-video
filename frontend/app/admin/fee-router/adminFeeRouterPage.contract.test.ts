import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFeeRouterPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminFeeRouterPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminFeeRouterPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin fee-router page", () => {
  const src = readModuleSources();

  it("keeps fee router routed-events route and admin fetch", () => {
    expect(src).toContain("routes.admin.feeRouterRoutedEvents");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("apiUrl(");
  });

  it("keeps page limit constant and admin DOM anchor", () => {
    expect(src).toContain("ADMIN_FEE_ROUTER_PAGE_LIMIT");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminFeeRouterPage"');
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("AdminFinanceModuleDepthWorkspace");
  });
});
