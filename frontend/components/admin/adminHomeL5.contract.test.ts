import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir);



function readAdminHomeSources(): string {

  return [

    readFileSync(join(__dir, "AdminHomeClient.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomePhase2PrepNotice.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeMaintainerFold.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomePrimaryCtas.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeDomainHealthStrip.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommandPalette.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminShellApproveBanner.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminShellBar.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminShellNavGroup.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminShellSidebar.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminApprovePermissionHint.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminMaintainerUiMode.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeSectionPersist.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminShellSidebarPending.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminCommandPaletteBus.ts"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminHomeOpsRoleGuide.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminFinanceSuiteHubDepthSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeCardSearch.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeRecentVisits.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeOperatorGuide.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminHomeInboxStrip.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeCollapsibleSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomePinnedShortcuts.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminHomeKpiStrip.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminHomeDevApiReference.tsx"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeModel.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeVisibility.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeKpiMetric.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeInboxPendingTotal.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "useAdminHomeInbox.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "useAdminHomeKpi.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeSectionPending.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeCardCapability.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomePrimaryCtaByRole.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminShellSidebarModel.ts"), "utf8"),

    readFileSync(join(__dir, "AdminCapabilitiesShell.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminRecentVisitsTracker.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminActorCapabilityStrip.tsx"), "utf8"),

  ].join("\n");

}



describe("admin home L5", () => {

  const src = readAdminHomeSources();



  it("keeps onboarding section, inbox, kpi, tiers, and dev API fold", () => {

    expect(src).toContain('data-tt-admin-home="1"');

    expect(src).toContain("onboarding");

    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");

    expect(src).toContain("/admin/provider-applications");

    expect(src).toContain("/admin/auth-audit-events");

    expect(src).toContain("data-tt-admin-home-pinned");
    expect(src).toContain("/admin/finance-suite");
    expect(src).toContain("admin-shell-preview");
    expect(src).toContain("data-tt-admin-home-inbox-workflow");
    expect(src).toContain("data-tt-admin-home-inbox");
    expect(src).toContain("data-tt-admin-home-guide");
    expect(src).toContain("AdminHomePhase2PrepNotice");
    expect(src).toContain("data-tt-admin-home-phase2-prep");
    expect(src).toContain("data-tt-admin-home-phase2-quick-prep");
    expect(src).toContain("data-tt-admin-home-maintainer-fold");
    expect(src).toContain("data-tt-admin-home-primary-cta");
    expect(src).toContain("data-tt-admin-home-primary-cta-fallback");
    expect(src).toContain("data-tt-admin-home-phase2-prep-tech");
    expect(src).toContain("data-tt-admin-home-phase2-backlog-link");
    expect(src).toContain("admin-phase2-remaining-backlog");
    expect(src).toContain("admin_home_section_collapsed_summary");
    expect(src).toContain("sectionDefaultOpenByPending");
    expect(src).toContain("communityReports");
    expect(src).toContain("data-tt-admin-home-domain-health");
    expect(src).toContain("AdminCommandPalette");
    expect(src).toContain("data-tt-admin-command-palette");
    expect(src).toContain("AdminShellApproveBanner");
    expect(src).toContain("data-tt-admin-shell-approve-banner");
    expect(src).toContain("data-tt-admin-approve-hint-unified");
    expect(src).toContain("data-tt-admin-approve-banner-dismiss");
    expect(src).toContain("data-tt-admin-home-command-palette-hint");
    expect(src).toContain("data-tt-admin-home-recent");
    expect(src).toContain("data-tt-admin-home-section-persist");
    expect(src).toContain("data-tt-admin-kpi-scope-honesty");
    expect(src).toContain("AdminShellPendingBadge");
    expect(src).toContain("useAdminShellSidebarVisible");
    expect(src).toContain("isAdminMaintainerUi");
    expect(src).toContain("admin_home_inbox_approve_fallback");
    expect(src).toContain("data-tt-admin-command-palette-trigger");
    expect(src).toContain("data-tt-admin-shell-nav-group-pending");
    expect(src).toContain("data-tt-admin-home-ops-role-guide");
    expect(src).toContain("data-tt-admin-home-shell-preview-banner");
    expect(src).toContain("AdminFinanceSuiteHubDepthSection");
    expect(src).toContain("rolePrimaryCtaFallback");
    expect(src).toContain("admin_home_card_tier_read");
    expect(src).toContain("data-tt-admin-home-widget-grid");
    expect(src).toContain("AdminShellSidebar");
    expect(src).toContain("data-tt-admin-shell-sidebar");
    expect(src).toContain("data-tt-admin-home-recent");
    expect(src).toContain("/admin/inbox");
    expect(src).toContain("data-tt-admin-home-inbox-unified-link");

    expect(src).toContain("data-tt-admin-home-kpi");

    expect(src).toContain("data-tt-admin-kpi-perm-denied");
    expect(src).toContain("adminHomeKpiMetricDisplay");
    expect(src).toContain("data-tt-admin-home-command-palette-hint");
    expect(src).toContain("data-tt-admin-home-modules-fold");
    expect(src).toContain("adminHomeModulesFoldDefaultOpen");
    expect(src).toContain("AdminHomeInbox.reports");
    expect(src).toContain('inboxKey: "reports"');

    expect(src).toContain("data-tt-admin-home-dev-api");

    expect(src).toContain("data-tt-admin-card-tier");

    expect(src).toContain("filterAdminHomeCardsForRole(ADMIN_HOME_CARDS");

    expect(src).toContain("admin_home_inbox_retry");

    expect(src).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(src).not.toContain("admin_home_inbox_total_pending");
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");
    expect(src).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(src).toContain("AdminNoticeBanner");

    expect(src).toContain("onRetry");

    expect(src).toContain("fetchAdminQueueList");

    expect(src).toContain("adminProviderApplications");

    expect(src).toContain("routes.admin.approvals");

    expect(src).toContain("resolveAdminHomeCardTier");

    expect(src).toContain("admin_home_card_tier_write");

    expect(src).toContain('tier === "write"');

    expect(src).toContain("/admin/onboarding");

    expect(src).toContain("data-tt-admin-inbox-channel-error");
    expect(src).toContain("adminInboxChannelPermission");
    expect(src).toContain("data-tt-admin-inbox-all-clear");
    expect(src).toContain("data-tt-admin-inbox-permission-denied");
    expect(src).toContain("data-tt-admin-inbox-approve-denied-cta");

    expect(src).toContain("AdminActorCapabilityStrip");
    expect(src).toContain("shouldShowAdminCapabilityStrip");
    expect(src).toContain("data-tt-admin-capability-strip-suppressed");
    expect(src).toContain("data-tt-admin-capability-strip-collapsible");
    expect(src).toContain("data-tt-admin-capability-strip-permissions-link");

    expect(src).toContain("routes.admin.orders");

    expect(src).toContain("routes.admin.disputes");

    expect(src).toContain("superAdminOnly");
    expect(src).toContain('"placeholder"');

  });

});

