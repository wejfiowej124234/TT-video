import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";



const ROOT = process.cwd();



describe("community me reports page L5 (①)", () => {

  it("page uses auth gate + refactored VM (no inline monolith)", () => {

    const page = readFileSync(join(ROOT, "app/community/me/reports/page.tsx"), "utf8");

    expect(page).toContain("CommunityMeDedicatedPageAuthGate");

    expect(page).toContain("useCommunityMeReportsPage");

    expect(page).toContain("CommunityMeReportsPageMain");

    expect(page).toContain("community_me_reports_auth_gate");

    expect(page).not.toContain("getMyCommunityReports");

  });



  it("VM loads reports via shared list query hook", () => {

    const hook = readFileSync(join(ROOT, "app/community/me/reports/useCommunityMeReportsPage.ts"), "utf8");

    const query = readFileSync(join(ROOT, "lib/useCommunityMeReportsListQuery.ts"), "utf8");

    expect(hook).toContain("useCommunityMeReportsListQuery");

    expect(hook).toContain("deriveListDataState");

    expect(hook).toContain("communityMeLoginReturnUrl");

    expect(hook).toContain("loadMoreReports");

    expect(query).toContain("getMyCommunityReports");

    expect(query).toContain("COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE");

    expect(query).toContain("COMMUNITY_ME_REPORTS_LIST_API_MAX");

  });



  it("main keeps data-tt reports page marker + load-more", () => {

    const main = readFileSync(join(ROOT, "app/community/me/reports/CommunityMeReportsPageMain.tsx"), "utf8");

    expect(main).toContain('data-tt-community-me-reports-page="1"');

    expect(main).toContain("MeReportsEmptyPanel");

    expect(main).toContain("CommunityMeListLoadMoreButton");

    expect(main).toContain("community_me_reports_list_truncated_hint");

  });

});

