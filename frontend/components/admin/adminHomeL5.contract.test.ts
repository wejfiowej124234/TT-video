import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS } from "@/lib/admin/adminHomeModel";



const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir);



function readAdminHomeSources(): string {

  return [

    readFileSync(join(__dir, "AdminHomeClient.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomePhase2PrepNotice.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeMaintainerFold.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeFocusCompanion.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeSystemOverview.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomeSystemOverviewTrends.tsx"), "utf8"),
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
    readFileSync(join(__dir, "AdminInboxWorkflowQuickNav.tsx"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminInboxWorkflowOrder.ts"), "utf8"),
    readFileSync(join(__dir, "AdminHomeCollapsibleSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminHomePinnedShortcuts.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminHomeKpiStrip.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminHomeTreasuryPoolStrip.tsx"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeTreasuryPools.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeModel.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeVisibility.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeKpiMetric.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeInboxPendingTotal.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeSystemOverviewMetrics.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "useAdminHomeSystemOverview.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeOverviewFetchCache.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminShellUxPolicy.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminShellMoreNavLinks.ts"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "useAdminHomeInbox.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminHomeInboxQueueListCache.ts"), "utf8"),

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



  it("keeps onboarding section, inbox, kpi, tiers; Batch-9 overview-first + treasury; no home tech/dev", () => {

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
    expect(src).toContain("admin_home_sidebar_sole_nav_hint");
    expect(src).toContain("data-tt-admin-home-sidebar-sole-nav");
    expect(src).toContain("sectionDefaultOpenByPending");
    expect(src).toContain("adminInboxQueueListFetchConfig");
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
    expect(src).toContain("adminHomeInboxFocusLayoutActive");
    expect(src).toContain("AdminHomeSystemOverviewSection");
    expect(src).toContain("adminHomeSystemOverviewDefaultOpen");
    expect(src).toContain("home-system-overview");
    expect(src).toContain("data-tt-admin-home-inbox-column");
    expect(src).toContain("metricsHomeOverview");
    expect(src).toContain("AdminHomeSystemOverviewTrends");
    expect(src).toContain("admin_home_system_overview_trend_signups");
    expect(src).toContain("writeAdminHomeInboxPendingTotalCache");
    expect(src).toContain("resolveAdminHomeInboxPendingTotal");
    expect(src).toContain("adminHomeKpiFoldDefaultOpen");
    expect(src).toContain("data-tt-admin-home-inbox-focus");
    expect(src).toContain("data-tt-admin-home-shell-preview-banner-collapsible");
    expect(src).toContain("adminShellLinkTierBadgeVisible");
    expect(src).toContain("adminHomeModuleCardTierBadgeVisible");
    expect(src).toContain("data-tt-admin-home-inbox-focus-surface");
    expect(src).toContain("admin_home_inbox_open_unified");
    expect(src).toContain("data-tt-admin-home-kpi-embedded");
    expect(src).toContain("ADMIN_SHELL_MORE_NAV_LINKS");
    expect(src).toContain("AdminInboxWorkflowQuickNav");
    expect(src).toContain("data-tt-admin-inbox-workflow-quick-nav");
    expect(src).toContain("adminInboxWorkflowOrder");
    expect(src).toContain("data-tt-admin-home-domain-health-embedded");
    expect(src).toContain("AdminShellSidebar");
    expect(src).toContain("data-tt-admin-shell-sidebar");
    expect(src).toContain("data-tt-admin-home-recent");
    expect(src).toContain("/admin/inbox");
    expect(src).toContain("data-tt-admin-home-inbox-unified-link");

    const inboxStrip = readFileSync(join(__dir, "AdminHomeInboxStrip.tsx"), "utf8");
    const maintainer = readFileSync(join(__dir, "AdminHomeMaintainerFold.tsx"), "utf8");
    const sidebar = readFileSync(join(__dir, "AdminShellSidebar.tsx"), "utf8");
    const companion = readFileSync(join(__dir, "AdminHomeFocusCompanion.tsx"), "utf8");
    expect(inboxStrip).toContain("data-tt-admin-home-inbox-focus-defer");
    expect(inboxStrip).toContain("data-tt-admin-inbox-focus-unified-link");
    expect(inboxStrip).not.toContain("ADMIN_INBOX_FOCUS_CTA_CLASS");
    expect(inboxStrip).toContain("ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS");
    expect(inboxStrip).toContain("data-tt-admin-home-inbox-focus-surface");
    expect(inboxStrip).toContain("admin_home_inbox_focus_banner_aria");
    expect(src).toContain("ADMIN_COMMAND_PALETTE_KBD_CLASS");
    expect(src).toContain("ADMIN_WORKSPACE_TITLE_FOCUS_CLASS");
    expect(src).toContain("ADMIN_HOME_FOCUS_CANVAS_CLASS");
    expect(src).toContain("data-tt-admin-home-workspace-header-compact");
    expect(src).toContain("useAdminHomeInboxFocusMode");
    expect(src).toContain("ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS");
    expect(src).toContain("adminHomeMaintainerFoldVisible");
    expect(src).toContain("AdminHomeFocusCompanion");
    expect(src).toContain("data-tt-admin-home-focus-companion");
    expect(src).not.toContain("home-secondary-insights");
    expect(sidebar).toContain("suppressSidebarLeafOnWorkspaceInboxFocus");
    expect(sidebar).toContain("adminShellNavGroupSummaryAttentionDotVisible");
    expect(sidebar).toContain("AdminShellNavIcon");
    expect(sidebar).toContain("ADMIN_SHELL_SIDEBAR_LINK_CLASS");
    expect(companion).toContain("ADMIN_TEXT_FOOTNOTE_CLASS");
    expect(companion).toContain('data-tt-admin-home-focus-companion-recent-only="od-r012"');
    expect(companion).toContain("data-tt-admin-home-focus-companion-recent");
    expect(companion).not.toContain("data-tt-admin-home-focus-companion-todos");
    expect(companion).not.toContain("buildAdminUnifiedInboxTasks");
    expect(companion).not.toContain("data-tt-admin-home-ops-kpi-promoted");
    expect(companion).not.toContain("data-tt-admin-home-focus-companion-health");
    expect(companion).not.toContain("admin_home_focus_companion_kpi_links_prefix");
    // Cut B OD R019 · Overview inbox-pending KPI removed (dedupe with Companion recent-only).
    expect(src).toContain('data-tt-admin-home-overview-pending-dedupe="od-r019"');
    expect(maintainer).toContain("admin_home_maintainer_fold_summary_focus");
    expect(inboxStrip).toContain("singleQueueFocus");
    expect(inboxStrip).toContain("hideZeroCounts");
    expect(inboxStrip).toContain("hasFocusWork ?");
    expect(src).toContain("admin_home_workspace_heading");
    expect(src).toContain("data-tt-admin-home-workspace-heading");
    expect(src).toContain("data-tt-admin-home-shell-preview-deferred");
    expect(inboxStrip).not.toContain("data-tt-admin-home-inbox-operator-guide");
    expect(inboxStrip).not.toContain("/admin/operator-guide");

    const operatorGuide = readFileSync(join(__dir, "AdminHomeOperatorGuide.tsx"), "utf8");
    expect(operatorGuide).toContain("AdminWarmL5Surface");
    expect(operatorGuide).toContain("ADMIN_STEP_MARKER_CLASS");

    expect(src).toContain("data-tt-admin-home-kpi");

    expect(src).toContain("data-tt-admin-kpi-perm-denied");
    expect(src).toContain("adminHomeKpiMetricDisplay");
    expect(src).toContain("data-tt-admin-home-command-palette-hint");
    expect(src).toContain("data-tt-admin-home-sidebar-sole-nav");
    expect(src).toContain("admin_home_sidebar_sole_nav_hint");
    expect(src).toContain("AdminHomeInbox.reports");
    // Batch-7: queue cards live in Inbox strip only (not home module wall inboxKey)
    expect(inboxStrip).toContain('key: "guide"');
    expect(inboxStrip).toContain('key: "reports"');
    expect(src).toContain("data-tt-admin-home-treasury-pools");
    expect(src).toContain("resolveAdminHomeTreasuryPoolsSnapshot");
    expect(src).toContain("not_deployed");

    const homeClient = readFileSync(join(__dir, "AdminHomeClient.tsx"), "utf8");
    // HU-455 · focus: Inbox before overview; V65 UX · non-focus: Inbox → KPI → System
    expect(homeClient).toContain('data-tt-admin-home-focus-inbox-first="1"');
    const focusMatch = homeClient.match(
      /data-tt-admin-home-focus-inbox-first="1"[\s\S]*?<\/div>\s*\)\s*:\s*\(/,
    );
    expect(focusMatch).toBeTruthy();
    const focusCol = focusMatch![0];
    const focusInboxIdx = focusCol.indexOf("<AdminHomeInboxStrip");
    const focusOverviewIdx = focusCol.indexOf("<AdminHomeSystemOverviewSection");
    expect(focusInboxIdx).toBeGreaterThan(-1);
    expect(focusOverviewIdx).toBeGreaterThan(-1);
    expect(focusInboxIdx).toBeLessThan(focusOverviewIdx);
    const nonFocusTail = homeClient.slice((focusMatch!.index ?? 0) + focusCol.length);
    const calmFragment = nonFocusTail.match(
      /<>[\s\S]*?<AdminHomeInboxStrip[\s\S]*?<AdminHomeSystemOverviewSection[\s\S]*?\/>/,
    )?.[0];
    expect(calmFragment).toBeTruthy();
    const calmInbox = calmFragment!.indexOf("<AdminHomeInboxStrip");
    const calmSys = calmFragment!.indexOf("<AdminHomeSystemOverviewSection");
    expect(calmInbox).toBeGreaterThan(-1);
    expect(calmSys).toBeGreaterThan(-1);
    expect(calmInbox).toBeLessThan(calmSys);
    expect(homeClient).not.toContain("AdminHomeKpiStrip");
    expect(homeClient).not.toContain("AdminHomeFocusCompanion");
    expect(homeClient).not.toContain("AdminHomeMaintainerFold");
    expect(homeClient).not.toContain("admin_home_kpi_fold_title");
    expect(homeClient).not.toContain("data-tt-admin-home-tech-fold");
    expect(homeClient).not.toContain("data-tt-admin-home-modules-fold");
    expect(homeClient).not.toContain("data-tt-admin-home-modules-expand-all");
    expect(homeClient).not.toContain("AdminHomeDevApiReference");
    expect(homeClient).not.toContain("AdminMetaBuildSection");

    const overviewSection = readFileSync(join(__dir, "AdminHomeSystemOverviewSection.tsx"), "utf8");
    expect(overviewSection).toContain("AdminHomeTreasuryPoolStrip");

    const overviewBody = readFileSync(join(__dir, "AdminHomeSystemOverview.tsx"), "utf8");
    expect(overviewBody).not.toContain("admin_home_tech_fold_summary");

    // Card taxonomy remains for search/palette; home no longer renders a modules card wall.
    expect(ADMIN_HOME_CARDS.length).toBeGreaterThan(0);
    expect(homeClient).not.toMatch(/data-tt-admin-card-tier=/);
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
    const capStrip = readFileSync(join(__dir, "AdminActorCapabilityStrip.tsx"), "utf8");
    const previewNotice = readFileSync(join(__dir, "AdminShellPreviewNotice.tsx"), "utf8");
    expect(capStrip).toContain("shouldShowAdminCapabilityStrip");
    expect(capStrip).toContain("useAdminHomeInboxFocusMode");
    expect(capStrip).toContain("homeInboxFocus");
    expect(previewNotice).toContain("data-tt-admin-shell-preview-isolation");
    expect(previewNotice).toContain("writeAdminShellPreviewRole");
    expect(previewNotice).toContain("admin_shell_preview_isolation_banner");
    const inboxFocusHook = readFileSync(
      join(__dir, "..", "..", "lib", "admin", "useAdminHomeInboxFocusMode.ts"),
      "utf8",
    );
    expect(inboxFocusHook.indexOf("useAdminHomeInbox()")).toBeLessThan(
      inboxFocusHook.indexOf("if (!onWorkspace) return false"),
    );
    expect(src).toContain("data-tt-admin-capability-strip-suppressed");
    expect(src).toContain("data-tt-admin-capability-strip-collapsible");
    expect(src).toContain("data-tt-admin-capability-strip-permissions-link");

    // KPI list URLs live in adminHomeKpiQueueListCache; home surfaces use path hrefs.
    expect(src).toContain("/admin/orders");
    expect(src).toContain("/admin/disputes");
    expect(
      readFileSync(
        join(__dir, "..", "..", "lib", "admin", "adminHomeKpiQueueListCache.ts"),
        "utf8",
      ),
    ).toContain("routes.admin.orders");

    expect(src).toContain("superAdminOnly");
    expect(src).toContain('"placeholder"');

    const systemOverviewSection = readFileSync(
      join(__dir, "AdminHomeSystemOverviewSection.tsx"),
      "utf8",
    );
    expect(systemOverviewSection).toContain("AdminHomeCollapsibleSection");
    expect(systemOverviewSection).toContain("adminHomeSystemOverviewDefaultOpen");
    expect(systemOverviewSection).toContain("persistOpen");

    const systemOverview = readFileSync(join(__dir, "AdminHomeSystemOverview.tsx"), "utf8");
    expect(systemOverview).toContain("admin_home_system_overview_users_memory");
    expect(systemOverview).toContain("admin_home_system_overview_console_roles_heading");
    expect(systemOverview).toContain("data-tt-admin-system-overview-trends-hidden");
    expect(systemOverview).toContain("isAdminHomeMetricsPostgresSource");

    const systemOverviewTrends = readFileSync(join(__dir, "AdminHomeSystemOverviewTrends.tsx"), "utf8");
    expect(systemOverviewTrends).toContain("data-tt-admin-system-overview-trend-grid");
    expect(systemOverviewTrends).not.toMatch(/<ul[\s\S]*data-tt-admin-system-overview-trend-grid/);

    expect(src).toContain("readAdminHomeOverviewCache");
    expect(src).toContain("invalidateAdminHomeOverviewCache");
  });

});

