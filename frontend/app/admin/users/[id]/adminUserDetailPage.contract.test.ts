import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminUserDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminUserDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminUserDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin user detail page", () => {
  const src = readModuleSources();

  it("keeps user-by-id route + admin fetch + outbound avatar + DOM anchor", () => {
    expect(src).toContain("routes.admin.userById");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("user-detail");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("outboundUrlFromPersisted");
    expect(src).toContain("ADMIN_USER_OUTBOUND_URL_KEYS");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminUserDetailPage"');
    expect(src).toContain("USER_DETAIL_RELATED_FOLD_LINKS");
    expect(src).not.toContain("AdminOpsQueueBackLinks");
    expect(src).toContain("AdminOpsDetailRelatedFold");
    expect(src).toContain("USER_DETAIL_RELATED_FOLD_LINKS");
    expect(src).toContain("AdminStewardApplicationReviewCard");
    expect(src).toContain("AdminListFetchError");
  });
});
