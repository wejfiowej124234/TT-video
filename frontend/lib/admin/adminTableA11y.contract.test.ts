import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** ① L5：Admin 列表 `<th>` 须带 `scope="col"`（a11y）。 */
describe("admin table a11y L5 (①)", () => {
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("core list tables use sticky ADMIN_TABLE_THEAD_CLASS", () => {
    for (const rel of [
      "approvals/AdminApprovalsTableSection.tsx",
      "orders/AdminOrdersPageMain.tsx",
      "community/reports/AdminCommunityReportsTable.tsx",
    ]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src, rel).toContain("ADMIN_TABLE_THEAD_CLASS");
      expect(src, rel).toContain('scope="col"');
    }
  });

  it("O10 · core queue tables use AdminSortableTh with aria-sort", () => {
    for (const rel of [
      "approvals/AdminApprovalsTableSection.tsx",
      "orders/AdminOrdersPageMain.tsx",
      "disputes/AdminDisputesPageMain.tsx",
      "community/reports/AdminCommunityReportsTable.tsx",
      "users/AdminUsersDataSection.tsx",
      "reviews/AdminReviewsTableSection.tsx",
      "audit/AdminAuditTableSection.tsx",
      "compliance/requests/AdminComplianceRequestsTableSection.tsx",
      "config/releases/AdminConfigReleasesTableSection.tsx",
      "flags/AdminFlagsListSection.tsx",
      "scheduler/jobs/AdminSchedulerJobsTableSection.tsx",
      "lifecycle/AdminLifecycleTableSection.tsx",
      "api-versions/AdminApiVersionsTableSection.tsx",
      "tenants/scopes/AdminTenantScopesListSection.tsx",
      "policies/AdminPoliciesListSection.tsx",
      "community/penalties/AdminCommunityPenaltiesListSection.tsx",
      "internal-tools/audits/AdminInternalToolAuditsTableSection.tsx",
      "media/access-logs/AdminMediaAccessLogsTableSection.tsx",
      "media/signed-url-tokens/AdminMediaSignedUrlTokensTableSection.tsx",
      "secrets/metadata/AdminSecretsMetadataTableSection.tsx",
      "jobs/AdminJobsPageMain.tsx",
      "community/appeals/AdminCommunityAppealsPageMain.tsx",
      "guides/AdminGuidesPageMain.tsx",
      "community/moderation/cases/AdminCommunityModerationCasesPageMain.tsx",
      "community/risk-signals/AdminCommunityRiskSignalsPageMain.tsx",
      "community/ranking/snapshots/AdminCommunityRankingSnapshotsPageMain.tsx",
      "community/policy-change-logs/AdminCommunityPolicyChangeLogsPageMain.tsx",
      "compliance/requests/[requestId]/events/AdminComplianceRequestEventsPageMain.tsx",
      "auth-audit-events/AdminAuthAuditEventsPageMain.tsx",
      "fee-router/AdminFeeRouterPageMain.tsx",
      "region-vault/AdminRegionVaultPageMain.tsx",
      "permissions/AdminPermissionsPageMain.tsx",
      "trust-growth/AdminTrustGrowthMetricsSection.tsx",
      "trust-growth/AdminTrustGrowthTimelineSection.tsx",
    ]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src, rel).toContain("AdminSortableTh");
      expect(src, rel).toContain("useAdminTableSort");
      expect(src, rel).toContain("ariaSort");
    }
  });

  it("O10 · audit ops catalog uses client sort with aria-sort (dark panel)", () => {
    const rel = "audit/operations/AdminAuditOperationsPageMain.tsx";
    const src = readFileSync(join(adminAppRoot, rel), "utf8");
    expect(src).toContain("useAdminTableSort");
    expect(src).toContain("AdminAuditOpsSortableTh");
    expect(src).toContain("sortedOperationRows");
    expect(src).toContain("aria-sort={ariaSort");
  });

  it("app/admin table headers use scope=col", () => {
    const offenders: string[] = [];
    for (const file of walkTsx(adminAppRoot)) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("<table")) continue;
      const bad = src.match(/<th\b(?![^>]*\bscope=)[^>]*>/g);
      if (bad?.length) offenders.push(`${file.replace(/\\/g, "/")} (${bad.length})`);
    }
    expect(offenders).toEqual([]);
  });

  it("community reports table moderate actions expose row aria-label", () => {
    const src = readFileSync(
      join(adminAppRoot, "community", "reports", "AdminCommunityReportsTable.tsx"),
      "utf8",
    );
    expect(src).toContain("data-tt-admin-reports-table");
    expect(src).toContain("admin_reports_moderate_row_aria");
    expect(src).toMatch(/aria-label=\{t\("admin_reports_moderate_row_aria"/);
  });

  it("onboarding queue lists expose review row aria-label", () => {
    for (const rel of [
      "provider-applications/AdminProviderApplicationsPageMain.tsx",
      "steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src).toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
      expect(src).toMatch(/review_row_aria/);
      expect(src).toMatch(/aria-label=\{t\("/);
    }
  });

  it("core ops tables expose row action aria-label keys", () => {
    const modules: { rel: string; keys: string[] }[] = [
      { rel: "reviews/AdminReviewsTableSection.tsx", keys: ["admin_reviews_detail_row_aria", "admin_reviews_escrow_row_aria"] },
      { rel: "audit/AdminAuditTableSection.tsx", keys: ["admin_audit_log_detail_row_aria"] },
      { rel: "orders/AdminOrdersPageMain.tsx", keys: ["admin_orders_detail_row_aria", "admin_orders_escrow_row_aria"] },
      { rel: "disputes/AdminDisputesPageMain.tsx", keys: ["admin_disputes_open_row_aria"] },
      { rel: "users/AdminUsersDataSection.tsx", keys: ["admin_users_detail_row_aria"] },
      { rel: "config/releases/AdminConfigReleasesTableSection.tsx", keys: ["admin_config_releases_open_row_aria"] },
      { rel: "indexer/reconcile-reports/ReconcileReportsTableSection.tsx", keys: ["admin_indexer_reconcile_reports_open_row_aria", "admin_indexer_reconcile_reports_prev_aria", "admin_indexer_reconcile_reports_next_aria"] },
      { rel: "tenants/scopes/AdminTenantScopesListSection.tsx", keys: ["admin_tenant_scopes_publish_row_aria"] },
      { rel: "approvals/AdminApprovalsTableSection.tsx", keys: ["admin_approvals_review_row_aria"] },
      { rel: "flags/AdminFlagsListSection.tsx", keys: ["admin_flags_publish_row_aria"] },
      { rel: "compliance/requests/AdminComplianceRequestsTableSection.tsx", keys: ["admin_compliance_requests_events_row_aria", "admin_compliance_requests_update_row_aria"] },
      { rel: "community/appeals/AdminCommunityAppealsPageMain.tsx", keys: ["admin_appeals_review_row_aria"] },
      { rel: "community/penalties/AdminCommunityPenaltiesListSection.tsx", keys: ["admin_penalties_report_row_aria"] },
    ];
    for (const { rel, keys } of modules) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      for (const key of keys) {
        expect(src, `${rel} missing ${key}`).toContain(key);
      }
    }
  });
});
