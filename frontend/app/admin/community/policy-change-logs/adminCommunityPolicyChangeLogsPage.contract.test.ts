import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityPolicyChangeLogsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityPolicyChangeLogsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityPolicyChangeLogsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community policy change logs page", () => {
  const src = readModuleSources();

  it("keeps policy change logs route + admin fetch + UUID actor filter + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityPolicyChangeLogs");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("isUuidString");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminCommunityPolicyChangeLogsPage"');
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("COMMUNITY_READ");
  });
});
