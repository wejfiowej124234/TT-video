import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(join(root, rel));
}

function adminPageRoutes(): string[] {
  const base = join(root, "app/admin");
  const out: string[] = [];
  function walk(dir: string, prefix: string) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p, `${prefix}/${ent.name}`);
      else if (ent.name === "page.tsx") out.push(prefix);
    }
  }
  walk(base, "/admin");
  return out.sort();
}

const PERM_DENIED_JARGON = /admin\.[a-z0-9_.]+|\b403\b|Missing admin\.|writeRequestHeaders|subject_user_id/;

describe("Admin L5 perfect closure (① · enterprise zero-gap SSOT)", () => {
  it("indexes 111 admin routes for forensic matrix", () => {
    expect(adminPageRoutes().length).toBe(111);
  });

  it("dead cross-nav modules removed from tree", () => {
    expect(exists("components/admin/content/AdminContentCrossNav.tsx")).toBe(false);
    expect(exists("components/admin/ops/GrowthOpsCrossNav.tsx")).toBe(false);
    expect(read("components/admin/content/AdminContentPageShell.tsx")).not.toContain("AdminContentHubLinks");
    expect(read("app/admin/content/AdminContentHubMain.tsx")).not.toContain("AdminContentHubLinks");
  });

  it("sidebar SSOT — hubs do not duplicate nav grids or cross-nav", () => {
    expect(read("app/admin/content/AdminContentHubMain.tsx")).toContain("AdminOpsPlaneSidebarHint");
    expect(read("app/admin/growth/AdminGrowthHubMain.tsx")).toContain("AdminOpsPlaneSidebarHint");
    expect(read("app/admin/growth/AdminGrowthHubMain.tsx")).not.toContain("data-tt-admin-growth-hub-link");
    expect(read("app/admin/official/page.tsx")).not.toContain("OfficialOpsCrossNav");
    expect(read("components/admin/content/AdminContentPageShell.tsx")).not.toContain("AdminContentCrossNav");
  });

  it("ops subpages use permission banners instead of cross-nav", () => {
    for (const page of [
      "app/admin/growth/analytics/AdminGrowthAnalyticsPageMain.tsx",
      "app/admin/official/accounts/AdminOfficialAccountsPageMain.tsx",
    ]) {
      const src = read(page);
      expect(src).toContain("AdminOpsPlanePermissionBanners");
      expect(src).not.toMatch(/GrowthOpsCrossNav|OfficialOpsCrossNav/);
    }
    expect(read("components/admin/content/AdminContentPageShell.tsx")).toContain("AdminOpsPlanePermissionBanners");
  });

  it("conversion funnel admin variant uses OfficialOpsDataTable kit end-to-end", () => {
    const dash = read("components/product-enhancement/ConversionFunnelDashboard.tsx");
    expect(dash).toContain("OfficialOpsDataTable");
    expect(dash).toContain("ADMIN_FILTER_CARD_CLASS");
    expect(dash).toContain("data-tt-admin-conversion-funnel-admin-l5");
    expect(read("app/admin/conversion-analytics/AdminConversionAnalyticsPageMain.tsx")).toContain('variant="admin"');
    expect(dash).not.toMatch(/border-ink-200\/80.*admin/);
  });

  it("all admin_perm_denied_* locale strings are operator-readable", () => {
    for (const file of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(file);
      const re = /\b(admin_perm_denied_[a-z0-9_]+):\s*"((?:[^"\\]|\\.)*)"/g;
      const offenders: string[] = [];
      for (const m of src.matchAll(re)) {
        if (PERM_DENIED_JARGON.test(m[2]!)) offenders.push(`${m[1]}: ${m[2]!.slice(0, 80)}`);
      }
      expect(offenders, file).toEqual([]);
    }
  });

  it("POI batch corridor — workflow + select + review L5 confirm", () => {
    const hook = read("app/admin/content/poi-images/batches/[id]/useAdminContentPoiImageBatchPage.ts");
    expect(hook).toContain("adminConfirmPoiImageWorkflow");
    expect(hook).toContain("adminConfirmPoiImageSelect");
    expect(hook).toContain("adminConfirmPoiImageReview");
    expect(hook).toContain("useAdminL5ConfirmRequest");
    expect(hook).not.toMatch(/window\.confirm\s*\(/);
  });

  it("finance suite removes duplicate export module href", () => {
    const model = read("app/admin/finance-suite/adminFinanceSuitePageModel.ts");
    expect(model).not.toContain('id: "export"');
    expect((model.match(/href: "\/admin\/finance"/g) ?? []).length).toBe(1);
  });

  it("region share + anti-fraud align with warm ops kit", () => {
    expect(read("app/admin/region-share/reconcile/AdminRegionShareReconcilePageMain.tsx")).toContain(
      "OfficialOpsDataTable",
    );
    expect(read("app/admin/growth/anti-fraud/AdminAntiFraudPageMain.tsx")).toContain("ADMIN_FILTER_CARD_CLASS");
  });

  it("community corridor wires AdminCommunityRelatedLinks on all PageMains", () => {
    for (const page of [
      "app/admin/community/abuse-policy/AdminCommunityAbusePolicyPageMain.tsx",
      "app/admin/community/policy-change-logs/AdminCommunityPolicyChangeLogsPageMain.tsx",
      "app/admin/community/moderation/cases/AdminCommunityModerationCasesPageMain.tsx",
      "app/admin/community/ranking/snapshots/AdminCommunityRankingSnapshotsPageMain.tsx",
      "app/admin/community/appeals/review/AdminCommunityAppealReviewPageMain.tsx",
      "app/admin/community/comments/visibility/AdminCommunityCommentVisibilityPageMain.tsx",
      "app/admin/community/penalties/AdminCommunityPenaltiesPageMain.tsx",
      "app/admin/community/appeals/AdminCommunityAppealsPageMain.tsx",
      "app/admin/community/risk-signals/AdminCommunityRiskSignalsPageMain.tsx",
    ]) {
      expect(read(page)).toContain("AdminCommunityRelatedLinks");
    }
    expect(read("app/admin/community/reports/AdminCommunityReportsPageInner.tsx")).toContain(
      "AdminCommunityRelatedLinks",
    );
  });

  it("round-2 forensic — 111 routes each resolve page.tsx", () => {
    for (const route of adminPageRoutes()) {
      const pagePath = join(root, "app/admin", route.replace(/^\/admin\/?/, ""), "page.tsx");
      expect(existsSync(pagePath), route).toBe(true);
    }
  });
});
