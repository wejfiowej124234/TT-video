import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Official + Growth ops L5 (① · enterprise UX)", () => {
  it("shared publish actions + L5 confirm wiring", () => {
    expect(read("components/admin/ops/OfficialOpsPublishRowActions.tsx")).toContain(
      "adminConfirmOfficialPublish",
    );
    expect(read("lib/admin/adminOpsWriteConfirm.ts")).toContain("adminConfirmOfficialPublish");
    expect(read("lib/admin/adminOpsWriteConfirm.ts")).toContain("adminConfirmEarlyBirdMultiplier");
  });

  it("official pages use permission banners + warm L5 table shell", () => {
    for (const page of [
      "app/admin/official/accounts/AdminOfficialAccountsPageMain.tsx",
      "app/admin/official/guides/AdminOfficialGuidesPageMain.tsx",
      "app/admin/official/itinerary-templates/AdminOfficialItineraryTemplatesPageMain.tsx",
      "app/admin/official/cold-start/AdminOfficialColdStartPageMain.tsx",
    ]) {
      const src = read(page);
      expect(src).toContain("AdminOpsPlanePermissionBanners");
      expect(src).not.toContain("OfficialOpsCrossNav");
      expect(src).toContain("OfficialOpsDataTable");
      expect(src).toContain("OfficialOpsPublishRowActions");
    }
  });

  it("official hub dashboard + probe", () => {
    expect(read("app/admin/official/page.tsx")).toContain("AdminOfficialOpsHubDashboard");
    expect(read("app/admin/official/page.tsx")).toContain("OFFICIAL_OPS_L5_PROBE");
    expect(read("app/admin/official/useAdminOfficialOpsHubPage.ts")).toContain("getAdminOfficialAccounts");
    expect(read("app/admin/official/page.tsx")).toContain("AdminOpsPlaneSidebarHint");
  });

  it("early bird L5 confirm + conversion analytics warm admin shell", () => {
    expect(read("app/admin/growth/early-bird/AdminEarlyBirdPageMain.tsx")).toContain(
      "adminConfirmEarlyBirdToggle",
    );
    expect(read("app/admin/conversion-analytics/AdminConversionAnalyticsPageMain.tsx")).toContain(
      'variant="admin"',
    );
  });

  it("growth subpages use permission banners not cross-nav", () => {
    const pages = [
      "app/admin/growth/referral-codes/AdminReferralCodesPageMain.tsx",
      "app/admin/growth/early-bird/AdminEarlyBirdPageMain.tsx",
      "app/admin/growth/airdrop-campaigns/AdminAirdropCampaignsPageMain.tsx",
      "app/admin/growth/kol-center/AdminKolCenterPageMain.tsx",
      "app/admin/growth/analytics/AdminGrowthAnalyticsPageMain.tsx",
      "app/admin/growth/reward-ledger/AdminRewardLedgerPageMain.tsx",
      "app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx",
    ];
    for (const page of pages) {
      const src = read(page);
      expect(src).toContain("AdminOpsPlanePermissionBanners");
      expect(src).not.toContain("GrowthOpsCrossNav");
    }
  });

  it("reward ledger drift uses AdminNoticeBanner (contrast L5)", () => {
    expect(read("app/admin/growth/reward-ledger/AdminRewardLedgerPageMain.tsx")).toContain(
      "AdminNoticeBanner",
    );
    expect(read("app/admin/growth/reward-ledger/AdminRewardLedgerPageMain.tsx")).not.toMatch(
      /border-amber-200|bg-amber-50/,
    );
  });

  it("referral codes warm L5 form + table", () => {
    const page = read("app/admin/growth/referral-codes/AdminReferralCodesPageMain.tsx");
    expect(page).toContain("ADMIN_FILTER_CARD_CLASS");
    expect(page).toContain("OfficialOpsDataTable");
    expect(page).toContain("admin_ops_risk_banner_referral_codes");
  });

  it("all growth subpages use warm L5 ops kit (panel/filter/table)", () => {
    for (const page of [
      "app/admin/growth/airdrop-campaigns/AdminAirdropCampaignsPageMain.tsx",
      "app/admin/growth/kol-center/AdminKolCenterPageMain.tsx",
      "app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx",
      "app/admin/growth/analytics/AdminGrowthAnalyticsPageMain.tsx",
    ]) {
      const src = read(page);
      expect(src).toMatch(/OfficialOpsPanelCard|OfficialOpsFilterBar|OfficialOpsDataTable/);
      expect(src).toContain("AdminOpsRiskBanner");
      expect(src).not.toMatch(/rounded border border-ink-200 p-4/);
    }
  });

  it("shared ops L5 components exported", () => {
    expect(read("components/admin/ops/OfficialOpsPanelCard.tsx")).toContain("ADMIN_FILTER_CARD_CLASS");
    expect(read("components/admin/ops/OfficialOpsFilterBar.tsx")).toContain("data-tt-admin-official-ops-filter");
  });

  it("official pages use risk banner on publish corridor", () => {
    for (const page of [
      "app/admin/official/accounts/AdminOfficialAccountsPageMain.tsx",
      "app/admin/official/guides/AdminOfficialGuidesPageMain.tsx",
      "app/admin/official/itinerary-templates/AdminOfficialItineraryTemplatesPageMain.tsx",
    ]) {
      expect(read(page)).toContain("admin_ops_risk_banner_official_publish");
    }
  });
});
