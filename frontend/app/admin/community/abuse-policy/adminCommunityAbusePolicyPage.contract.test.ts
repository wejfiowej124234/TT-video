import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityAbusePolicyPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityAbusePolicyPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityAbusePolicyPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community abuse policy page", () => {
  const src = readModuleSources();

  it("keeps abuse policy route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityAbusePolicy");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminCommunityAbusePolicyPatch"');
    expect(src).toContain("AdminAbusePolicyMetaBuild");
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("useAdminCanWrite");
    expect(src).toContain("COMMUNITY_SUPER");
  });
});
