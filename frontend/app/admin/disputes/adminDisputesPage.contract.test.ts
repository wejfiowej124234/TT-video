import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminDisputesPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminDisputesPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminDisputesPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/adminDisputesLabels.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "components/admin/AdminListPageChrome.tsx"), "utf8"),
  ].join("\n");
}

describe("admin disputes page", () => {
  const src = readModuleSources();

  it("keeps admin disputes route + DOM anchor", () => {
    expect(src).toContain("routes.admin.disputes");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain("AdminFinanceSuiteDepthNotice");
    expect(src).toContain("AdminFinanceSuitePartialChecklist");
    const depthNotice = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteDepthNotice.tsx"),
      "utf8",
    );
    expect(depthNotice).toContain("fin_suite_depth");
    expect(depthNotice).toContain("data-tt-admin-fin-suite-depth-notice");
    expect(depthNotice).toContain("data-tt-admin-fin-suite-refunds-hint");
    expect(src).toContain('"AdminDisputesPage"');
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("ORDERS_READ");
    expect(src).toContain("ADMIN_EMPTY_NEXT_DISPUTES_FILTERED_EMPTY");
    expect(src).toContain("AdminAppliedFiltersBanner");
  });
});
