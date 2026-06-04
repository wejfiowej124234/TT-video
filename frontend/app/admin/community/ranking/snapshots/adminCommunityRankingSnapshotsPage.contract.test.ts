import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityRankingSnapshotsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityRankingSnapshotsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityRankingSnapshotsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community ranking snapshots page", () => {
  const src = readModuleSources();

  it("keeps ranking snapshots route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityRankingSnapshots");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminCommunityRankingSnapshotsPage"');
    expect(src).toContain("AdminPermissionDeniedBanner");
    expect(src).toContain("COMMUNITY_READ");
  });
});
