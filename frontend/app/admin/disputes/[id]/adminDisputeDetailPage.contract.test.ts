import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminDisputeDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminDisputeDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminDisputeDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin dispute detail page", () => {
  const src = readModuleSources();

  it("keeps admin dispute by id route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.disputeById");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("dispute-detail");
    expect(src).toContain("data-tt-admin-detail-refreshing");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminDisputeDetailPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminFinanceSectionBackLinks");
    expect(src).toContain("data-tt-admin-dispute-detail-back-list");
  });
});
