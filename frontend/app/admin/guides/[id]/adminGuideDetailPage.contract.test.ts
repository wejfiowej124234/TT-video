import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminGuideDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminGuideDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminGuideDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin guide detail page", () => {
  const src = readModuleSources();

  it("keeps admin guide by id route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.guideById");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("guide-detail");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("data-tt-admin-detail-refreshing");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminGuideDetailPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("GUIDE_DETAIL_RELATED_FOLD_LINKS");
    expect(src).not.toContain("AdminOpsQueueBackLinks");
    expect(src).toContain("adminTableRowPrimaryActionClass");
  });
});
