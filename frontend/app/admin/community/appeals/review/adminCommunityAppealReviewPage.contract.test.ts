import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityAppealReviewPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityAppealReviewPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityAppealReviewPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community appeal review page", () => {
  const src = readModuleSources();

  it("keeps appeal review route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityAppealReview");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminCommunityAppealReview"');
    expect(src).toContain("AdminAppealReviewMetaBuild");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("useAdminCanWrite");
    expect(src).toContain("COMMUNITY_SUPER");
  });
});
