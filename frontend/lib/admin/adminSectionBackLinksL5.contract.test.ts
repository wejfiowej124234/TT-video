import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin section back links L5 (①)", () => {
  it("platform / compliance / onboarding / observability back-link SSOT exist", () => {
    expect(
      readFileSync(join(fe, "components", "admin", "AdminConfigPlatformBackLinks.tsx"), "utf8"),
    ).toContain("AdminInboxQueueBackLinks");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminComplianceSectionBackLinks.tsx"), "utf8"),
    ).toContain("AdminInboxQueueBackLinks");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminOnboardingHubBackLinks.tsx"), "utf8"),
    ).toContain("AdminInboxQueueBackLinks");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminCommunityRelatedLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminConfigPlatformBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminComplianceSectionBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminObservabilitySectionBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminAuditSectionBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-audit-list");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminAlertsSectionBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-alerts-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminOpsQueueBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
    expect(
      readFileSync(join(fe, "components", "admin", "AdminOpsQueueBackLinks.tsx"), "utf8"),
    ).not.toContain("AdminInboxQueueBackLinks");
  });

  it("maintainer platform pages use AdminConfigPlatformPageShell and slim inbox header", () => {
    expect(
      readFileSync(join(fe, "app", "admin", "jobs", "AdminJobsPageMain.tsx"), "utf8"),
    ).toContain("AdminInboxQueueBackLinks");
    expect(
      readFileSync(join(fe, "app", "admin", "jobs", "page.tsx"), "utf8"),
    ).toContain("AdminConfigPlatformPageShell");
    expect(
      readFileSync(join(fe, "app", "admin", "compliance", "requests", "AdminComplianceRequestsPageMain.tsx"), "utf8"),
    ).toContain("AdminComplianceSectionBackLinks");
  });

  it("finance disputes use section back links; onboarding queues use related fold SSOT", () => {
    expect(
      readFileSync(join(fe, "components", "admin", "AdminFinanceSectionBackLinks.tsx"), "utf8"),
    ).toContain("AdminFinanceSuiteBackLinks");
    expect(
      readFileSync(join(fe, "app", "admin", "disputes", "AdminDisputesPageMain.tsx"), "utf8"),
    ).toContain("AdminFinanceSectionBackLinks");
    const queueChrome = readFileSync(join(fe, "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
    expect(queueChrome).toContain("AdminOpsDetailRelatedFold");
    expect(queueChrome).not.toContain("AdminOnboardingQueueBackLinks");
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toMatch(/PROVIDER_QUEUE_RELATED_FOLD_LINKS[\s\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK/);
  });

  it("ops queue pages expose observability via related fold SSOT", () => {
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("ADMIN_OPS_OBSERVABILITY_RELATED_LINK");
    for (const rel of [
      "app/admin/orders/AdminOrdersPageMain.tsx",
      "app/admin/users/AdminUsersPageMain.tsx",
      "app/admin/approvals/AdminApprovalsPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
    }
    for (const rel of [
      "app/admin/orders/[id]/AdminOrderDetailPageMain.tsx",
      "app/admin/approvals/[id]/AdminApprovalDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).not.toContain("AdminOpsQueueBackLinks");
      expect(src, rel).not.toContain("headerAside=");
    }
    expect(
      readFileSync(join(fe, "app/admin/orders/[id]/adminOrderDetailPageModel.ts"), "utf8"),
    ).toContain("ADMIN_OPS_OBSERVABILITY_RELATED_LINK");
  });

  it("community list pages use AdminCommunityListHeaderAside without duplicate observability", () => {
    const penalties = readFileSync(
      join(fe, "app", "admin", "community", "penalties", "AdminCommunityPenaltiesPageMain.tsx"),
      "utf8",
    );
    expect(penalties).toContain("AdminCommunityListHeaderAside");
    expect(penalties).not.toMatch(/AdminCommunityListHeaderAside[\s\S]*href="\/admin\/observability"/);
  });

  it("observability cluster pages use section back-link SSOT", () => {
    expect(
      readFileSync(join(fe, "app", "admin", "schema", "AdminSchemaPageMain.tsx"), "utf8"),
    ).toContain("AdminObservabilitySectionBackLinks");
    expect(
      readFileSync(join(fe, "app", "admin", "trust-growth", "AdminTrustGrowthPageMain.tsx"), "utf8"),
    ).toContain("AdminObservabilitySectionBackLinks");
    expect(
      readFileSync(join(fe, "app", "admin", "audit", "operations", "AdminAuditOperationsPageMain.tsx"), "utf8"),
    ).toContain("AdminAuditSectionBackLinks");
    expect(
      readFileSync(join(fe, "app", "admin", "alerts", "incidents", "[id]", "AdminAlertIncidentDetailPageMain.tsx"), "utf8"),
    ).toContain("AdminAlertsSectionBackLinks");
    const obsHub = readFileSync(
      join(fe, "app", "admin", "observability", "AdminObservabilityPageMain.tsx"),
      "utf8",
    );
    expect(obsHub).toContain("AdminObservabilityHubRelatedNav");
    expect(obsHub).not.toContain("AdminPlatformHubHeaderLinks");
    const authAudit = readFileSync(
      join(fe, "app", "admin", "auth-audit-events", "AdminAuthAuditEventsPageMain.tsx"),
      "utf8",
    );
    expect(authAudit).toContain("AdminAuditSectionBackLinks");
    expect(authAudit).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("onboarding list uses hub back links; hub root dedupes self link", () => {
    expect(
      readFileSync(join(fe, "components", "admin", "AdminOnboardingListPage.tsx"), "utf8"),
    ).toContain("AdminOnboardingHubBackLinks");
    const hub = readFileSync(
      join(fe, "app", "admin", "onboarding", "AdminOnboardingHubPageMain.tsx"),
      "utf8",
    );
    expect(hub).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(hub).not.toContain("AdminOnboardingHubBackLinks");
  });

  it("permissions + finance suite omit empty headerAside inbox (no footer nav dup)", () => {
    const permissions = readFileSync(
      join(fe, "app", "admin", "permissions", "AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    expect(permissions).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(permissions).not.toContain("data-tt-admin-permissions-footer-nav");

    const finSuite = readFileSync(
      join(fe, "app", "admin", "finance-suite", "AdminFinanceSuitePageMain.tsx"),
      "utf8",
    );
    expect(finSuite).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(finSuite).not.toContain("data-tt-admin-fin-suite-footer-nav");
  });

  it("breadcrumb uses workspace label not schema_back", () => {
    const breadcrumb = readFileSync(
      join(fe, "components", "admin", "AdminSubpageBreadcrumb.tsx"),
      "utf8",
    );
    expect(breadcrumb).toContain("admin_shell_nav_workspace");
    expect(breadcrumb).not.toContain("admin_schema_back");
  });
});
