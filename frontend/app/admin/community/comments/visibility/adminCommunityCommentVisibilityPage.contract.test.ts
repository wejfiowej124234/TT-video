import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityCommentVisibilityPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityCommentVisibilityPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityCommentVisibilityPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community comment visibility page", () => {
  const src = readModuleSources();

  it("keeps comment visibility PATCH route + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityCommentVisibility");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain('"AdminCommunityCommentVisibility"');
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("useAdminCanWrite");
    expect(src).toContain("COMMUNITY_MODERATE");
  });
});
