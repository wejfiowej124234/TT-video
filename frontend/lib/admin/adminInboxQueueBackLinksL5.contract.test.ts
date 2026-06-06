import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin inbox queue back links L5 (①)", () => {
  it("shared back-link component wired on community reports; queue uses related fold", () => {
    const chrome = readFileSync(join(fe, "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
    const reports = readFileSync(
      join(fe, "app", "admin", "community", "reports", "AdminCommunityReportsPageInner.tsx"),
      "utf8",
    );
    const back = readFileSync(join(fe, "components", "admin", "AdminInboxQueueBackLinks.tsx"), "utf8");
    const onboardingBack = readFileSync(
      join(fe, "components", "admin", "AdminOnboardingQueueBackLinks.tsx"),
      "utf8",
    );
    expect(back).toContain("data-tt-admin-queue-back-inbox");
    expect(onboardingBack).toContain("data-tt-admin-back-onboarding-hub");
    expect(chrome).toContain("AdminOpsDetailRelatedFold");
    expect(chrome).not.toContain("AdminOnboardingQueueBackLinks");
    expect(reports).toContain("AdminCommunityRelatedLinks");
  });

  it("observability cluster + community subpages import inbox back links", () => {
    for (const rel of [
      ["app/admin/trust-growth/AdminTrustGrowthPageMain.tsx", "AdminObservabilitySectionBackLinks"],
      ["app/admin/schema/AdminSchemaPageMain.tsx", "AdminObservabilitySectionBackLinks"],
      ["app/admin/alerts/incidents/AdminAlertIncidentsHubPageMain.tsx", "AdminObservabilitySectionBackLinks"],
      ["app/admin/alerts/incidents/[id]/AdminAlertIncidentDetailPageMain.tsx", "AdminAlertsSectionBackLinks"],
      ["app/admin/audit/logs/[id]/AdminAuditLogDetailPageMain.tsx", "AdminAuditSectionBackLinks"],
      ["app/admin/audit/operations/AdminAuditOperationsPageMain.tsx", "AdminAuditSectionBackLinks"],
      ["app/admin/indexer/reconcile-reports/ReconcileReportsPageMain.tsx", "AdminFinanceSectionBackLinks"],
    ] as const) {
      const [path, needle] = rel;
      expect(readFileSync(join(fe, path), "utf8"), path).toContain(needle);
    }
    expect(
      readFileSync(join(fe, "app/admin/observability/AdminObservabilityPageMain.tsx"), "utf8"),
    ).toContain("AdminObservabilityHubRelatedNav");
    for (const rel of [
      "app/admin/community/penalties/AdminCommunityPenaltiesPageMain.tsx",
      "app/admin/community/moderation/cases/AdminCommunityModerationCasesPageMain.tsx",
    ]) {
      expect(readFileSync(join(fe, rel), "utf8"), rel).toContain("AdminCommunityListHeaderAside");
    }
  });
});
