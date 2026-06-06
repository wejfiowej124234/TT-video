import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十八批 UX · 首页趋势图 slate 轴 · 枢纽顶栏 dedupe · 列表可观测折叠入口。 */
describe("admin batch58 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch58 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch58UxL5.contract.test.ts");
  });

  it("system overview trend charts use slate axis + centered bar value tokens", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS");
    expect(adminUi).toMatch(/ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS[\s\S]*text-slate-400/);
    expect(adminUi).toContain("ADMIN_SYSTEM_OVERVIEW_TREND_BAR_VALUE_CLASS");
    const trends = readFileSync(
      join(fe, "components/admin/AdminHomeSystemOverviewTrends.tsx"),
      "utf8",
    );
    expect(trends).toContain("ADMIN_SYSTEM_OVERVIEW_TREND_Y_AXIS_CLASS");
    expect(trends).toContain("ADMIN_SYSTEM_OVERVIEW_TREND_BAR_VALUE_CLASS");
    expect(trends).not.toContain("text-ink-500");
  });

  it("hub pages drop empty headerAside inbox back links", () => {
    for (const rel of [
      "app/admin/onboarding/AdminOnboardingHubPageMain.tsx",
      "app/admin/permissions/AdminPermissionsPageMain.tsx",
      "app/admin/finance-suite/AdminFinanceSuitePageMain.tsx",
      "app/admin/compliance/AdminComplianceHubPageMain.tsx",
      "app/admin/config/AdminConfigHubPageMain.tsx",
      "app/admin/observability/AdminObservabilityPageMain.tsx",
      "app/admin/operator-guide/AdminOperatorGuidePageMain.tsx",
      "app/admin/media/signed-url-tokens/AdminMediaSignedUrlTokensPageMain.tsx",
      "app/admin/media/access-logs/AdminMediaAccessLogsPageMain.tsx",
      "app/admin/config/releases/[id]/AdminConfigReleaseDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    }
    expect(
      readFileSync(join(fe, "app/admin/inbox/AdminUnifiedInboxPageMain.tsx"), "utf8"),
    ).toContain('headerAside={<AdminInboxQueueBackLinks showWorkspace />}');
  });

  it("ops list pages move observability into related fold not headerAside", () => {
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("ADMIN_OPS_OBSERVABILITY_RELATED_LINK");
    expect(model).toMatch(/ORDERS_LIST_RELATED_FOLD_LINKS[\s\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK/);
    for (const rel of [
      "app/admin/orders/AdminOrdersPageMain.tsx",
      "app/admin/guides/AdminGuidesPageMain.tsx",
      "app/admin/reviews/AdminReviewsPageMain.tsx",
      "app/admin/users/AdminUsersPageMain.tsx",
      "app/admin/approvals/AdminApprovalsPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    }
    const communityRelated = readFileSync(
      join(fe, "components/admin/AdminCommunityRelatedLinks.tsx"),
      "utf8",
    );
    expect(communityRelated).toContain("data-tt-admin-back-observability-hub");
  });
});
