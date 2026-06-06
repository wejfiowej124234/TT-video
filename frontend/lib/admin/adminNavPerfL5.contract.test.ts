import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_ROUTE_PREFETCH_DEV_WARM,
  ADMIN_ROUTE_PREFETCH_PRIMARY,
  collectAdminShellNavPrefetchHrefs,
} from "./adminRoutePrefetchPaths";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin nav perf SSOT (①)", () => {
  it("collects full sidebar href set for prefetch", () => {
    const hrefs = collectAdminShellNavPrefetchHrefs();
    expect(hrefs.length).toBeGreaterThan(20);
    expect(hrefs).toContain("/admin/finance-suite");
    expect(hrefs).toContain("/admin/community/abuse-policy");
    expect(ADMIN_ROUTE_PREFETCH_DEV_WARM.length).toBe(hrefs.length);
  });

  it("primary prefetch stays queue-first", () => {
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY.length).toBe(6);
  });

  it("shell defers inbox/kpi + lazy command palette + list cache invalidator", () => {
    const shell = readFileSync(join(fe, "components", "admin", "AdminCapabilitiesShell.tsx"), "utf8");
    expect(shell).toContain("AdminCommandPaletteLazyGate");
    expect(shell).toContain("AdminListFetchCacheInvalidator");
    expect(shell).not.toMatch(/import \{ AdminCommandPalette \}/);
    expect(readFileSync(join(__dir, "useAdminHomeInbox.ts"), "utf8")).toContain(
      "scheduleAdminDeferredShellWork",
    );
    expect(readFileSync(join(__dir, "useAdminHomeKpi.ts"), "utf8")).toContain(
      "scheduleAdminDeferredShellWork",
    );
    expect(readFileSync(join(__dir, "useAdminStandardListFetch.ts"), "utf8")).toContain(
      "readAdminListFetchCache",
    );
    expect(readFileSync(join(__dir, "useAdminStandardDetailFetch.ts"), "utf8")).toContain(
      "readAdminListFetchCache",
    );
    expect(readFileSync(join(fe, "app/admin/orders/useAdminOrdersPage.ts"), "utf8")).toContain(
      "useAdminStandardListFetch",
    );
    const listFetchPages = [
      "app/admin/disputes/useAdminDisputesPage.ts",
      "app/admin/users/useAdminUsersPage.ts",
      "app/admin/guides/useAdminGuidesPage.ts",
      "app/admin/reviews/useAdminReviewsPage.ts",
      "app/admin/approvals/useAdminApprovalsPage.ts",
      "app/admin/community/reports/useAdminCommunityReportsPage.ts",
      "app/admin/flags/useAdminFlagsPage.ts",
      "app/admin/compliance/requests/useAdminComplianceRequestsPage.ts",
      "app/admin/config/releases/useAdminConfigReleasesPage.ts",
      "app/admin/policies/useAdminPoliciesPage.ts",
      "app/admin/tenants/scopes/useAdminTenantScopesPage.ts",
      "app/admin/community/appeals/useAdminCommunityAppealsPage.ts",
      "app/admin/community/moderation/cases/useAdminModerationCasesPage.ts",
      "app/admin/jobs/useAdminJobsPage.ts",
      "app/admin/audit/useAdminAuditPage.ts",
      "app/admin/scheduler/jobs/useAdminSchedulerJobsPage.ts",
      "app/admin/media/access-logs/useAdminMediaAccessLogsPage.ts",
      "app/admin/community/policy-change-logs/useAdminCommunityPolicyChangeLogsPage.ts",
      "app/admin/community/penalties/useAdminCommunityPenaltiesPage.ts",
      "app/admin/community/risk-signals/useAdminCommunityRiskSignalsPage.ts",
      "app/admin/secrets/metadata/useAdminSecretsMetadataPage.ts",
      "app/admin/audit/operations/useAdminAuditOperationsPage.ts",
      "app/admin/indexer/reconcile-reports/useAdminIndexerReconcileReportsPage.ts",
      "app/admin/api-versions/useAdminApiVersionsPage.ts",
      "app/admin/media/signed-url-tokens/useAdminMediaSignedUrlTokensPage.ts",
      "app/admin/internal-tools/audits/useAdminInternalToolAuditsPage.ts",
      "app/admin/community/ranking/snapshots/useAdminCommunityRankingSnapshotsPage.ts",
      "app/admin/auth-audit-events/useAdminAuthAuditEventsPage.ts",
      "app/admin/lifecycle/useAdminLifecyclePage.ts",
      "app/admin/schema/useAdminSchemaPage.ts",
      "app/admin/observability/useAdminObservabilityPage.ts",
      "app/admin/cross-check/useAdminCrossCheckPage.ts",
      "app/admin/drift-summary/useAdminDriftSummaryPage.ts",
      "app/admin/indexer/useAdminIndexerPage.ts",
      "app/admin/trust-growth/useAdminTrustGrowthPage.ts",
      "app/admin/region-vault/useAdminRegionVaultPage.ts",
      "app/admin/fee-router/useAdminFeeRouterPage.ts",
      "app/admin/compliance/requests/[requestId]/events/useAdminComplianceRequestEventsPage.ts",
      "app/admin/provider-applications/useAdminProviderApplicationsPage.ts",
      "app/admin/steward-applications/useAdminStewardApplicationsPage.ts",
    ];
    for (const rel of listFetchPages) {
      expect(readFileSync(join(fe, rel), "utf8")).toContain("useAdminStandardListFetch");
    }
    const detailFetchPages = [
      "app/admin/orders/[id]/useAdminOrderDetailPage.ts",
      "app/admin/disputes/[id]/useAdminDisputeDetailPage.ts",
      "app/admin/users/[id]/useAdminUserDetailPage.ts",
      "app/admin/guides/[id]/useAdminGuideDetailPage.ts",
      "app/admin/reviews/[id]/useAdminReviewDetailPage.ts",
      "app/admin/approvals/[id]/useAdminApprovalDetailPage.ts",
      "app/admin/audit/logs/[id]/useAdminAuditLogDetailPage.ts",
      "app/admin/alerts/incidents/[id]/useAdminAlertIncidentDetailPage.ts",
      "app/admin/config/releases/[id]/useAdminConfigReleaseDetailPage.ts",
      "app/admin/onboarding/entitlements/[id]/useAdminOnboardingEntitlementDetailPage.ts",
      "app/admin/indexer/reconcile/[id]/useAdminIndexerReconcileReportPage.ts",
    ];
    for (const rel of detailFetchPages) {
      expect(readFileSync(join(fe, rel), "utf8")).toContain("useAdminStandardDetailFetch");
    }
  });

  it("boot gate skips re-block after capabilities ready once", () => {
    const gate = readFileSync(join(fe, "components", "admin", "AdminMainBootGate.tsx"), "utf8");
    expect(gate).toContain("adminSubpageBootBlocked");
    expect(readFileSync(join(__dir, "useAdminCapabilities.ts"), "utf8")).toContain(
      "markAdminCapabilitiesBootReady",
    );
  });

  it("route prefetcher batches tertiary sidebar paths", () => {
    const prefetcher = readFileSync(join(fe, "components", "admin", "AdminRoutePrefetcher.tsx"), "utf8");
    expect(prefetcher).toContain("prefetchAdminRoutesBatched");
    expect(prefetcher).toContain("adminRoutePrefetchTertiaryHrefs");
    expect(prefetcher).toContain("markAdminRoutePrefetchSessionStarted");
    expect(readFileSync(join(__dir, "adminRoutePrefetchSession.ts"), "utf8")).toContain(
      "resetAdminRoutePrefetchSession",
    );
    const navGroup = readFileSync(join(fe, "components", "admin", "AdminShellNavGroup.tsx"), "utf8");
    expect(navGroup).toContain("prefetch");
    expect(navGroup).toContain("onPointerEnter={prefetchGroupLinks}");
  });

  it("shell prefetch SSOT + finance summary SWR + recent visits warm", () => {
    const shell = readFileSync(join(fe, "components", "admin", "AdminCapabilitiesShell.tsx"), "utf8");
    expect(shell).toContain("AdminNavContentTransition");
    expect(shell).not.toContain("AdminNavPendingIndicator");
    const transition = readFileSync(join(fe, "components", "admin", "AdminNavContentTransition.tsx"), "utf8");
    expect(transition).toContain('data-tt-admin-nav-frozen="1"');
    expect(transition).toContain('addEventListener("click", onClick, false)');
    expect(transition).toContain("blockInteraction");
    const boundary = readFileSync(join(fe, "components", "admin", "AdminRouteLoadingBoundary.tsx"), "utf8");
    expect(boundary).toContain("adminNavBootReady");
    const usersLoading = readFileSync(join(fe, "app/admin/users/loading.tsx"), "utf8");
    expect(usersLoading).toContain("AdminRouteLoadingBoundary");
    expect(usersLoading).not.toContain("AdminSubpageRouteLoading");
    expect(readFileSync(join(__dir, "adminCapabilitiesFetchCache.ts"), "utf8")).toContain(
      "ADMIN_CAPABILITIES_FETCH_CACHE_TTL_MS",
    );
    expect(readFileSync(join(__dir, "useAdminCapabilities.ts"), "utf8")).toContain(
      "readAdminCapabilitiesFetchCache",
    );
    expect(readFileSync(join(__dir, "adminNavBootReady.ts"), "utf8")).toContain("adminNavBootReady");
    const invalidator = readFileSync(
      join(fe, "components", "admin", "AdminListFetchCacheInvalidator.tsx"),
      "utf8",
    );
    expect(invalidator).toContain("resetAdminAuthSessionState");
    expect(readFileSync(join(__dir, "adminBatchADataFreshnessL5.contract.test.ts"), "utf8")).toContain(
      "ADM-P0-02",
    );
  });

  it("shell prefetch SSOT + finance summary SWR + recent visits warm", () => {
    expect(readFileSync(join(__dir, "adminShellPrefetchHref.ts"), "utf8")).toContain(
      "prefetchAdminShellHref",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminRecentVisitsTracker.tsx"), "utf8")).toContain(
      "prefetchAdminRoutesBatched",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminCommandPalette.tsx"), "utf8")).toContain(
      "useAdminShellPrefetchHref",
    );
    expect(readFileSync(join(fe, "app/admin/finance/useAdminFinancePage.ts"), "utf8")).toContain(
      "useAdminStandardListFetch",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8")).toContain(
      "useAdminShellLinkPrefetch",
    );
  });

  it("home + finance-reconciliation nav perf batch", () => {
    expect(readFileSync(join(fe, "components", "admin", "AdminShellPrefetchLink.tsx"), "utf8")).toContain(
      "adminShellLinkPrefetchProps",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminHomeClient.tsx"), "utf8")).toContain(
      "AdminShellPrefetchLink",
    );
    expect(readFileSync(join(fe, "components", "admin", "AdminHomeKpiStrip.tsx"), "utf8")).toContain(
      "AdminShellPrefetchLink",
    );
    expect(readFileSync(join(__dir, "adminFinanceReconciliationBundleFetch.ts"), "utf8")).toContain(
      "Promise.all",
    );
    expect(readFileSync(join(fe, "app/admin/finance-reconciliation/useAdminFinanceReconciliationPage.ts"), "utf8")).toContain(
      "loadAdminFinanceReconciliationBundle",
    );
  });
});
