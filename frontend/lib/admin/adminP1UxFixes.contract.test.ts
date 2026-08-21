import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { orderStateLabelKey, ORDER_STATE_FILTER_OPTIONS } from "./adminOrdersLabels";
import { formatAdminMoney } from "./formatAdminMoney";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "..", "..");

describe("admin P1 UX fixes (①)", () => {
  it("maps created and backend order states (P1-2)", () => {
    expect(ORDER_STATE_FILTER_OPTIONS).toContain("created");
    expect(orderStateLabelKey("created")).toBe("admin_orders_state_created");
    expect(orderStateLabelKey("refunded")).toBe("admin_orders_state_refunded");
    expect(orderStateLabelKey("partially_refunded")).toBe("admin_orders_state_partially_refunded");
    expect(orderStateLabelKey("slashed")).toBe("admin_orders_state_slashed");
  });

  it("formatAdminMoney uses 2 decimal places (P1-3)", () => {
    expect(formatAdminMoney(1000)).toBe("1,000.00");
    expect(formatAdminMoney("41.7814")).toBe("41.78");
    expect(formatAdminMoney("")).toBe("");
  });

  it("system overview footnote is human-readable without exposed API path (P1-1)", () => {
    const zh = readFileSync(join(FE, "locales", "zh.ts"), "utf8");
    const overview = readFileSync(join(FE, "components", "admin", "AdminHomeSystemOverview.tsx"), "utf8");
    expect(zh).toContain("admin_home_system_overview_honesty_dev_metrics");
    expect(zh).toMatch(
      /admin_home_system_overview_honesty_metrics:\s*\n\s*"用户与趋势来自控制台统计/,
    );
    expect(overview).toContain("admin_home_system_overview_honesty_metrics");
    expect(overview).not.toContain("admin_home_system_overview_honesty_dev_metrics");
    expect(overview).toContain("<details");
  });

  it("AdminMetaBuildSection defaults collapsed on list pages (P1-4)", () => {
    const meta = readFileSync(join(FE, "components", "admin", "AdminMetaBuildPanel.tsx"), "utf8");
    expect(meta).toContain('data-tt-admin-meta-build-fold="1"');
    expect(meta).toContain('data-tt-admin-meta-build-default-open="0"');
    expect(meta).toContain("admin_meta_build_fold_summary");
    expect(meta).toContain("<details");
    expect(meta).toContain('data-tt-admin-meta-build-observability-link="1"');
  });

  it("orders list wires formatAdminMoney", () => {
    const orders = readFileSync(join(FE, "app", "admin", "orders", "AdminOrdersPageMain.tsx"), "utf8");
    expect(orders).toContain("formatAdminMoney");
    expect(orders).toContain("ADMIN_TABLE_TD_MONO_CLASS");
  });

  it("trend chart exposes Y-axis and screen-reader readout (P1-7)", () => {
    const trends = readFileSync(join(FE, "components", "admin", "AdminHomeSystemOverviewTrends.tsx"), "utf8");
    expect(trends).toContain("data-tt-admin-system-overview-trend-y-axis");
    expect(trends).toContain("data-tt-admin-system-overview-trend-readout");
    expect(trends).toContain("admin_home_system_overview_trend_y_max");
  });

  it("table body SSOT tokens exist and list tables avoid raw font-mono text-meta (P1-8)", () => {
    const adminUi = readFileSync(join(FE, "lib", "adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_TABLE_TD_MONO_CLASS");
    expect(adminUi).toContain("ADMIN_TABLE_TD_TIMESTAMP_CLASS");
    const auditTable = readFileSync(join(FE, "app", "admin", "audit", "AdminAuditTableSection.tsx"), "utf8");
    expect(auditTable).not.toContain("font-mono text-meta");
    expect(auditTable).toContain("ADMIN_TABLE_TD_MONO_CLASS");
    expect(auditTable).not.toContain("text-ink-800");
  });

  it("governance list pages have breadcrumb leaf keys (P1-9)", () => {
    const ctx = readFileSync(join(__dir, "adminShellContextForPath.ts"), "utf8");
    expect(ctx).toContain('prefix: "/admin/cross-check"');
    expect(ctx).toContain("admin_cross_check_title");
    expect(ctx).toContain('prefix: "/admin/drift-summary"');
    const home = readFileSync(join(FE, "components", "admin", "AdminHomeClient.tsx"), "utf8");
    expect(home).toContain("previewRole");
  });

  it("filter density SSOT and orders readonly footnote (P2-5 / P2-9)", () => {
    const adminUi = readFileSync(join(FE, "lib", "adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_FILTER_FIELD_LABEL_CLASS");
    expect(adminUi).toContain("ADMIN_FILTER_GRID_CLASS");
    const orders = readFileSync(join(FE, "app", "admin", "orders", "AdminOrdersPageMain.tsx"), "utf8");
    expect(orders).toContain("data-tt-admin-orders-readonly-footnote");
    expect(orders).toContain("ADMIN_FILTER_GRID_CLASS");
    const reports = readFileSync(
      join(FE, "app", "admin", "community", "reports", "AdminCommunityReportsFilterCard.tsx"),
      "utf8",
    );
    expect(reports).toContain("data-tt-admin-reports-filter-grid");
    expect(reports).toContain("ADMIN_FILTER_GRID_CLASS");
    const audit = readFileSync(join(FE, "app", "admin", "audit", "AdminAuditFiltersBlock.tsx"), "utf8");
    expect(audit).toContain("ADMIN_FILTER_GRID_4_CLASS");
  });

  it("domain health grid uses compact gap + touch targets (P2-7)", () => {
    const strip = readFileSync(join(FE, "components", "admin", "AdminHomeDomainHealthStrip.tsx"), "utf8");
    expect(strip).toContain('const DOMAIN_HEALTH_GRID_CLASS = "mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4"');
    expect(strip).toContain("touchTargetLink44Classes");
    expect(strip).toContain("rounded-[var(--radius-md)]");
    expect(strip).toContain("min-w-0 overflow-hidden");
  });

  it("community reports drops header link wall for subnav + slim aside (P2-1)", () => {
    const inner = readFileSync(
      join(FE, "app", "admin", "community", "reports", "AdminCommunityReportsPageInner.tsx"),
      "utf8",
    );
    const page = readFileSync(join(FE, "app", "admin", "community", "reports", "page.tsx"), "utf8");
    expect(page).toContain("AdminCommunityPageShell");
    expect(inner).toContain("AdminCommunityRelatedLinks");
    expect(inner).not.toContain("AdminCommunityListHeaderAside");
    expect(inner).not.toContain("data-tt-admin-community-reports-header-aside");
    expect(inner).not.toContain("AdminCommunityReportsHeaderLinks");
    expect(inner).not.toContain("admin_community_reports_linkModCases");
    const subnav = readFileSync(join(FE, "components", "admin", "AdminCommunitySubnav.tsx"), "utf8");
    expect(subnav).toContain('href: "/admin/community/reports"');
  });

  it("core queue tables use table row action tokens (P2-4)", () => {
    const adminUi = readFileSync(join(FE, "lib", "adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_TABLE_PRIMARY_ACTION_BTN_CLASS");
    expect(adminUi).toContain("adminTableRowPrimaryActionClass");
    expect(adminUi).toContain("adminTableRowSecondaryActionClass");
    for (const rel of [
      "app/admin/community/reports/AdminCommunityReportsTable.tsx",
      "app/admin/approvals/AdminApprovalsTableSection.tsx",
      "app/admin/orders/AdminOrdersPageMain.tsx",
      "app/admin/disputes/AdminDisputesPageMain.tsx",
    ]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("adminTableRowPrimaryActionClass");
    }
    for (const rel of [
      "app/admin/provider-applications/AdminProviderApplicationsPageMain.tsx",
      "app/admin/steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("AdminOnboardingQueueRowCard");
    }
    const orders = readFileSync(join(FE, "app", "admin", "orders", "AdminOrdersPageMain.tsx"), "utf8");
    expect(orders).toContain("adminTableRowSecondaryActionClass");
  });

  it("onboarding stripe ledger cards use dark nested KPI on warm hub (batch56)", () => {
    const adminUi = readFileSync(join(FE, "lib", "adminUi.ts"), "utf8");
    const notice = readFileSync(join(FE, "components", "admin", "AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    expect(adminUi).toContain("ADMIN_HUB_NESTED_KPI_CARD_CLASS");
    expect(notice).toContain("ADMIN_HUB_NESTED_KPI_CARD_CLASS");
    expect(notice).not.toContain("ADMIN_KPI_CARD_IDLE_CLASS");
  });

  it("governance JSON pages use page scroll not nested max-h (P2-3)", () => {
    const cross = readFileSync(join(FE, "app", "admin", "cross-check", "AdminCrossCheckPageMain.tsx"), "utf8");
    const drift = readFileSync(join(FE, "app", "admin", "drift-summary", "AdminDriftSummaryPageMain.tsx"), "utf8");
    const finBack = readFileSync(join(FE, "components", "admin", "AdminFinanceSuiteBackLinks.tsx"), "utf8");
    expect(cross).toContain("data-tt-admin-gov-json-single-scroll");
    expect(cross).not.toMatch(/max-h-\[min\(24rem/);
    expect(drift).not.toMatch(/max-h-\[min\(28rem/);
    expect(finBack).toMatch(/showWorkspace = false/);
  });

  it("subpage hub depth tiles use console outline not dark KPI (P2-6)", () => {
    const adminUi = readFileSync(join(FE, "lib", "adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_HUB_DEPTH_LINK_CONSOLE_TILE_CLASS");
    expect(adminUi).toMatch(/ADMIN_HUB_DEPTH_LINK_CARD_CLASS = ADMIN_HUB_DEPTH_LINK_CONSOLE_TILE_CLASS/);
    expect(adminUi).not.toMatch(/ADMIN_HUB_DEPTH_LINK_CARD_CLASS = `[\s\S]*ADMIN_KPI_CARD_IDLE_CLASS/);
  });

  it("cross-check slot labels humanized with technical id row (P2-8)", () => {
    const zh = readFileSync(join(FE, "locales", "zh.ts"), "utf8");
    const cross = readFileSync(join(FE, "app", "admin", "cross-check", "AdminCrossCheckPageMain.tsx"), "utf8");
    expect(zh).toContain('admin_cross_check_slot_fee_pool_projection: "费用池投影"');
    expect(zh).toContain("admin_cross_check_slot_technical_id_hint");
    expect(cross).toContain("data-tt-admin-cross-check-slot-id");
    expect(cross).toContain("admin_cross_check_slot_technical_id_hint");
  });

  it("home defers primary nav to sidebar (no modules wall · P3-1)", () => {
    const home = readFileSync(join(FE, "components", "admin", "AdminHomeClient.tsx"), "utf8");
    expect(home).toContain("data-tt-admin-home-sidebar-sole-nav");
    expect(home).toContain("admin_home_sidebar_sole_nav_hint");
    expect(home).not.toContain("data-tt-admin-home-modules-fold");
    expect(home).not.toContain("data-tt-admin-home-modules-expand-all");
  });

  it("finance hub partial CTAs are per-module (P3-2)", () => {
    const model = readFileSync(
      join(FE, "app", "admin", "finance-suite", "adminFinanceSuitePageModel.ts"),
      "utf8",
    );
    const hub = readFileSync(join(FE, "components", "admin", "AdminFinanceSuiteHubDepthSection.tsx"), "utf8");
    expect(model).toContain("openCtaKey");
    expect(model).toContain("admin_fin_suite_hub_depth_open_cross_check");
    expect(hub).toContain("m.openCtaKey");
  });

  it("governance read-only pages slim header with related fold (P3-3 batch 18)", () => {
    const model = readFileSync(join(FE, "lib", "admin", "adminFinanceGovernanceRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("financeGovernanceRelatedFoldLinks");
    for (const rel of [
      "app/admin/cross-check/AdminCrossCheckPageMain.tsx",
      "app/admin/drift-summary/AdminDriftSummaryPageMain.tsx",
    ]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("AdminFinanceSuiteBackLinks");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).not.toContain("AdminFinanceGovernanceHeaderAside");
    }
  });

  it("community report reason column dedupes mapped labels (P3-4)", () => {
    const labels = readFileSync(
      join(FE, "app", "admin", "community", "reports", "adminCommunityReportsLabels.ts"),
      "utf8",
    );
    const table = readFileSync(
      join(FE, "app", "admin", "community", "reports", "AdminCommunityReportsTable.tsx"),
      "utf8",
    );
    expect(labels).toContain("reportReasonCodeIsMapped");
    expect(table).toContain("reportReasonCodeIsMapped");
    expect(table).not.toContain("text-ink-400");
  });

  it("extended queue tables use table row action tokens (P2-4 batch 7)", () => {
    for (const rel of [
      "app/admin/disputes/AdminDisputesPageMain.tsx",
      "app/admin/guides/AdminGuidesPageMain.tsx",
      "app/admin/community/appeals/AdminCommunityAppealsPageMain.tsx",
      "app/admin/reviews/AdminReviewsTableSection.tsx",
      "app/admin/users/AdminUsersDataSection.tsx",
    ]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("adminTableRowPrimaryActionClass");
    }
    for (const rel of [
      "app/admin/provider-applications/AdminProviderApplicationsPageMain.tsx",
      "app/admin/steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(FE, rel), "utf8");
      expect(src, rel).toContain("AdminOnboardingQueueRowCard");
    }
    const reviews = readFileSync(join(FE, "app", "admin", "reviews", "AdminReviewsTableSection.tsx"), "utf8");
    expect(reviews).toContain("adminTableRowSecondaryActionClass");
    const guides = readFileSync(join(FE, "app", "admin", "guides", "AdminGuidesPageMain.tsx"), "utf8");
    expect(guides).toContain("adminTableRowSecondaryActionClass");
  });

  it("ops/config/compliance list tables use row action tokens (P2-4 batch 8)", () => {
    for (const rel of [
      "app/admin/audit/AdminAuditTableSection.tsx",
      "app/admin/compliance/requests/AdminComplianceRequestsTableSection.tsx",
      "app/admin/config/releases/AdminConfigReleasesTableSection.tsx",
      "app/admin/flags/AdminFlagsListSection.tsx",
      "app/admin/policies/AdminPoliciesListSection.tsx",
      "app/admin/tenants/scopes/AdminTenantScopesListSection.tsx",
      "app/admin/scheduler/jobs/AdminSchedulerJobsTableSection.tsx",
      "app/admin/community/penalties/AdminCommunityPenaltiesListSection.tsx",
      "app/admin/indexer/reconcile-reports/ReconcileReportsTableSection.tsx",
    ]) {
      expect(readFileSync(join(FE, rel), "utf8"), rel).toContain("adminTableRowPrimaryActionClass");
    }
    const compliance = readFileSync(
      join(FE, "app", "admin", "compliance", "requests", "AdminComplianceRequestsTableSection.tsx"),
      "utf8",
    );
    expect(compliance).toContain("adminTableRowSecondaryActionClass");
    const crossCheckTest = readFileSync(join(FE, "app", "admin", "cross-check", "page.test.tsx"), "utf8");
    expect(crossCheckTest).toContain("useSearchParams");
  });

  it("finance suite module grid avoids orphan 7th card (batch 9)", () => {
    const suite = readFileSync(join(FE, "app", "admin", "finance-suite", "AdminFinanceSuitePageMain.tsx"), "utf8");
    expect(suite).toContain('data-tt-admin-fin-suite-module-grid="1"');
    expect(suite).toContain("lg:grid-cols-4");
    expect(suite).toContain("gap-3");
  });

  it("platform list pages drop header link walls (P2-1 batch 10)", () => {
    const authAudit = readFileSync(
      join(FE, "app", "admin", "auth-audit-events", "AdminAuthAuditEventsPageMain.tsx"),
      "utf8",
    );
    const observability = readFileSync(
      join(FE, "app", "admin", "observability", "AdminObservabilityPageMain.tsx"),
      "utf8",
    );
    expect(authAudit).toContain("AdminAuditSectionBackLinks");
    expect(authAudit).not.toContain("AdminPlatformHubHeaderLinks");
    expect(observability).toContain("AdminObservabilityHubRelatedNav");
    expect(observability).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("config platform subnav and auth-audit filter SSOT (batch 11)", () => {
    expect(
      readFileSync(join(FE, "app", "admin", "flags", "page.tsx"), "utf8"),
    ).toContain("AdminConfigPlatformPageShell");
    const authAudit = readFileSync(
      join(FE, "app", "admin", "auth-audit-events", "AdminAuthAuditEventsPageMain.tsx"),
      "utf8",
    );
    expect(authAudit).toContain("ADMIN_FILTER_GRID_CLASS");
    expect(readFileSync(join(FE, "app", "admin", "jobs", "AdminJobsPageMain.tsx"), "utf8")).toContain(
      "AdminInboxQueueBackLinks",
    );
  });

  it("config release detail subnav parent trail (batch 12)", () => {
    const detail = readFileSync(
      join(FE, "app", "admin", "config", "releases", "[id]", "AdminConfigReleaseDetailPageMain.tsx"),
      "utf8",
    );
    expect(detail).toContain("AdminConfigPlatformSubnav");
    expect(detail).not.toContain("AdminInboxQueueBackLinks");
    expect(detail).not.toContain("AdminConfigPlatformBackLinks");
  });

  it("config and compliance hubs drop header link walls (batch 13)", () => {
    const configHub = readFileSync(join(FE, "app", "admin", "config", "AdminConfigHubPageMain.tsx"), "utf8");
    const complianceHub = readFileSync(
      join(FE, "app", "admin", "compliance", "AdminComplianceHubPageMain.tsx"),
      "utf8",
    );
    expect(configHub).toContain("AdminPlatformHubRelatedNav");
    expect(configHub).not.toContain("AdminPlatformHubHeaderLinks");
    expect(complianceHub).toContain("AdminPlatformHubRelatedNav");
    expect(complianceHub).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("ops detail pages use row action tokens and user detail related fold (batch 14)", () => {
    const orderDetail = readFileSync(
      join(FE, "app", "admin", "orders", "[id]", "AdminOrderDetailPageMain.tsx"),
      "utf8",
    );
    const disputeDetail = readFileSync(
      join(FE, "app", "admin", "disputes", "[id]", "AdminDisputeDetailPageMain.tsx"),
      "utf8",
    );
    const userDetail = readFileSync(
      join(FE, "app", "admin", "users", "[id]", "AdminUserDetailPageMain.tsx"),
      "utf8",
    );
    expect(orderDetail).toContain("adminTableRowPrimaryActionClass");
    expect(disputeDetail).toContain("adminTableRowSecondaryActionClass");
    expect(userDetail).toContain("AdminOpsDetailRelatedFold");
  });

  it("review guide approval detail pages row-action and related fold (batch 15)", () => {
    const reviewDetail = readFileSync(
      join(FE, "app", "admin", "reviews", "[id]", "AdminReviewDetailPageMain.tsx"),
      "utf8",
    );
    const guideDetail = readFileSync(
      join(FE, "app", "admin", "guides", "[id]", "AdminGuideDetailPageMain.tsx"),
      "utf8",
    );
    const approvalDetail = readFileSync(
      join(FE, "app", "admin", "approvals", "[id]", "AdminApprovalDetailPageMain.tsx"),
      "utf8",
    );
    expect(reviewDetail).toContain("adminTableRowPrimaryActionClass");
    expect(guideDetail).toContain('data-tt-admin-guide-detail-actions="1"');
    expect(approvalDetail).toContain("AdminOpsDetailRelatedFold");
  });

  it("compliance DSAR subpages and audit log detail related fold (batch 16)", () => {
    const events = readFileSync(
      join(FE, "app", "admin", "compliance", "requests", "[requestId]", "events", "AdminComplianceRequestEventsPageMain.tsx"),
      "utf8",
    );
    const auditDetail = readFileSync(
      join(FE, "app", "admin", "audit", "logs", "[id]", "AdminAuditLogDetailPageMain.tsx"),
      "utf8",
    );
    expect(events).toContain("AdminOpsDetailRelatedFold");
    expect(auditDetail).toContain("AUDIT_LOG_DETAIL_RELATED_FOLD_LINKS");
  });

  it("ops lists and finance peer pages slim headers (batch 17)", () => {
    const users = readFileSync(join(FE, "app", "admin", "users", "AdminUsersPageMain.tsx"), "utf8");
    const feeRouter = readFileSync(join(FE, "app", "admin", "fee-router", "AdminFeeRouterPageMain.tsx"), "utf8");
    expect(users).toContain("USERS_LIST_RELATED_FOLD_LINKS");
    expect(feeRouter).toContain("financePeerRelatedFoldLinks");
  });

  it("reviews list and governance pages row-action / related fold (batch 18)", () => {
    const reviews = readFileSync(join(FE, "app", "admin", "reviews", "AdminReviewsTableSection.tsx"), "utf8");
    const crossCheck = readFileSync(join(FE, "app", "admin", "cross-check", "AdminCrossCheckPageMain.tsx"), "utf8");
    expect(reviews).not.toContain("adminTableInlineLinkClass");
    expect(crossCheck).toContain("financeGovernanceRelatedFoldLinks");
  });

  it("indexer reconcile detail and list slim headers (batch 19)", () => {
    const detail = readFileSync(
      join(FE, "app", "admin", "indexer", "reconcile", "[id]", "AdminIndexerReconcileReportPageMain.tsx"),
      "utf8",
    );
    const list = readFileSync(join(FE, "app", "admin", "indexer", "reconcile-reports", "ReconcileReportsPageMain.tsx"), "utf8");
    expect(detail).toContain("INDEXER_RECONCILE_DETAIL_RELATED_FOLD_LINKS");
    expect(list).toContain("ReconcileReportsExportToolbar");
  });

  it("observability subpages and review/guide detail related fold (batch 20)", () => {
    const schema = readFileSync(join(FE, "app", "admin", "schema", "AdminSchemaPageMain.tsx"), "utf8");
    const review = readFileSync(join(FE, "app", "admin", "reviews", "[id]", "AdminReviewDetailPageMain.tsx"), "utf8");
    expect(schema).toContain("observabilityPeerRelatedFoldLinks");
    expect(review).toContain("REVIEW_DETAIL_RELATED_FOLD_LINKS");
  });

  it("ops lists, detail folds, hubs, audit slim header (batch 21)", () => {
    const orders = readFileSync(join(FE, "app", "admin", "orders", "AdminOrdersPageMain.tsx"), "utf8");
    const authAudit = readFileSync(join(FE, "app", "admin", "auth-audit-events", "AdminAuthAuditEventsPageMain.tsx"), "utf8");
    const financeSuite = readFileSync(join(FE, "app", "admin", "finance-suite", "AdminFinanceSuitePageMain.tsx"), "utf8");
    expect(orders).toContain("ORDERS_LIST_RELATED_FOLD_LINKS");
    expect(authAudit).toContain('data-tt-admin-auth-audit-refresh="1"');
    expect(financeSuite).toContain('data-tt-admin-finance-suite');
    expect(financeSuite).toContain("AdminOpsHubNavTiles");
    expect(financeSuite).toContain("FINANCE_SUITE_MODULES");
  });
});
