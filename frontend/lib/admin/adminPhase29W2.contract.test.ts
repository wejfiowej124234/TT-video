import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FE = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(FE, rel), "utf8");
}

describe("phase29 W2 release polish (RP-006/010/011/013)", () => {
  it("RP-010 wires capabilities boot slow hint on admin skeleton", () => {
    const loading = read("components/admin/AdminSubpageRouteLoading.tsx");
    const hint = read("components/admin/AdminSubpageRouteLoadingSlowHint.tsx");
    expect(loading).toContain("AdminSubpageRouteLoadingSlowHint");
    expect(hint).toContain('data-tt-admin-capabilities-boot-slow-hint="1"');
    expect(hint).toContain('aria-live="polite"');
    expect(hint).toContain("admin_capabilities_boot_slow_hint");
  });

  it("RP-006 disputes/reports empty + loading hints", () => {
    const empty = read("components/admin/AdminListPageEmptyState.tsx");
    const disputes = read("app/admin/disputes/AdminDisputesPageMain.tsx");
    const reports = read("app/admin/community/reports/AdminCommunityReportsPageInner.tsx");
    expect(empty).toContain("hintKey");
    expect(disputes).toContain("admin_list_empty_disputes_hint");
    expect(disputes).toContain("admin_disputes_loading_hint");
    expect(reports).toContain("admin_community_reports_empty_hint");
    expect(reports).toContain("admin_community_reports_loading_hint");
  });

  it("RP-011 git_sha unknown honest disclosure styling", () => {
    const meta = read("components/admin/AdminMetaBuildPanel.tsx");
    const adminUi = read("lib/adminUi.ts");
    expect(meta).toContain("ADMIN_META_BUILD_GIT_UNKNOWN_CLASS");
    expect(meta).toContain("data-tt-admin-build-git-unknown");
    expect(meta).toContain("admin_meta_build_git_unknown_hint");
    expect(adminUi).toContain("ADMIN_META_BUILD_GIT_UNKNOWN_CLASS");
  });
});
