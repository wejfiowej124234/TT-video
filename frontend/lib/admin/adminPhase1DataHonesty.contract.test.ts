import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const FE = join(__dir, "..", "..");

describe("admin phase ① data honesty anchors", () => {
  it("wires home, shell, queues, and build disclosure", () => {
    const home = readFileSync(join(FE, "components/admin/AdminHomeClient.tsx"), "utf8");
    const inbox = readFileSync(join(FE, "components/admin/AdminHomeInboxStrip.tsx"), "utf8");
    const shell = readFileSync(join(FE, "components/admin/AdminShellBar.tsx"), "utf8");
    const meta = readFileSync(join(FE, "components/admin/AdminMetaBuildPanel.tsx"), "utf8");
    const chrome = readFileSync(join(FE, "components/admin/AdminQueueListPageChrome.tsx"), "utf8");
    const breadcrumb = readFileSync(join(FE, "components/admin/AdminSubpageBreadcrumb.tsx"), "utf8");
    const users = readFileSync(join(FE, "app/admin/users/page.tsx"), "utf8");

    expect(home).toContain('data-tt-admin-home="1"');
    expect(inbox).toContain('data-tt-admin-home-inbox="1"');
    expect(inbox).toContain("data-tt-admin-home-inbox-scope-honesty");
    expect(inbox).toContain("admin_home_inbox_scope_honesty");
    expect(inbox).toContain("admin_home_inbox_retry");
    expect(shell).toContain("admin_shell_nav_group_onboarding");
    expect(shell).toContain("resolveAdminDeployEnv");
    expect(shell).toContain("adminDeployEnvLabelKey");
    expect(meta).toContain("data-tt-admin-build-git-unknown");
    expect(chrome).toContain('data-tt-admin-app-page="1"');
    expect(breadcrumb).toContain("data-tt-admin-subpage-breadcrumb");
    const adminShell = readFileSync(join(FE, "components/admin/AdminCapabilitiesShell.tsx"), "utf8");
    expect(adminShell).toContain("AdminLayoutSubpageNav");
    expect(adminShell).toContain("AdminActorCapabilityStrip");
    const capStrip = readFileSync(join(FE, "components/admin/AdminActorCapabilityStrip.tsx"), "utf8");
    expect(capStrip).toContain("admin_capability_strip_permission_model_hint");
    expect(capStrip).toContain("shouldShowAdminCapabilityStrip");
    expect(capStrip).toContain("data-tt-admin-capability-strip-suppressed");
    expect(capStrip).toContain("data-tt-admin-capability-strip-collapsible");
    expect(adminShell).toContain("AdminCapabilitiesProvider");
    expect(adminShell).toContain("AdminHomeQueuesProvider");
    expect(adminShell).toContain("AdminL5ConfirmProvider");
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeInbox.ts"), "utf8")).toContain("fetchAdminQueueList");
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeInbox.ts"), "utf8")).toContain("AdminHomeInboxProvider");
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeKpi.ts"), "utf8")).toContain("AdminHomeKpiProvider");
    expect(
      readFileSync(join(FE, "..", "scripts", "dev", "check-frontend-api-routes-admin.ps1"), "utf8"),
    ).toContain("AdminHomeQueuesProvider");
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeInbox.ts"), "utf8")).toContain(
      "runAdminQueueFetchesInSeries",
    );
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeKpi.ts"), "utf8")).toContain("ADMIN_PERM.ORDERS_READ");
    expect(readFileSync(join(FE, "lib/admin/useAdminHomeInbox.ts"), "utf8")).toContain(
      "AdminHomeInbox.reports",
    );
    expect(readFileSync(join(FE, "lib/admin/adminInboxChannelPermission.ts"), "utf8")).toContain(
      "ADMIN_INBOX_CHANNEL_PERMISSION",
    );
    expect(
      [
        readFileSync(join(FE, "app/admin/onboarding/page.tsx"), "utf8"),
        readFileSync(join(FE, "app/admin/onboarding/AdminOnboardingHubPageMain.tsx"), "utf8"),
      ].join("\n"),
    ).toContain("data-tt-admin-onboarding-hub");
    expect(readFileSync(join(FE, "app/admin/permissions/AdminPermissionsPageMain.tsx"), "utf8")).toContain("data-tt-admin-permissions");
    expect(readFileSync(join(FE, "lib/admin/useAdminCapabilities.ts"), "utf8")).toContain("routes.admin.capabilities");
    const apiRoutes = readFileSync(join(FE, "lib/api.ts"), "utf8");
    expect(apiRoutes).toContain('capabilities: "/api/v1/admin/capabilities"');
    expect(apiRoutes).toContain('adminProviderApplications: "/api/v1/admin/provider-applications"');
    expect(apiRoutes).toContain('adminStewardApplications: "/api/v1/admin/steward-applications"');
    expect(readFileSync(join(FE, "app/api/v1/admin/capabilities/route.ts"), "utf8")).toContain(
      "/api/v1/admin/capabilities",
    );
    expect(
      [
        readFileSync(join(FE, "app/admin/onboarding/entitlements/[id]/page.tsx"), "utf8"),
        readFileSync(join(FE, "app/admin/onboarding/entitlements/[id]/AdminOnboardingEntitlementDetailPageMain.tsx"), "utf8"),
      ].join("\n"),
    ).toContain("data-tt-admin-onboarding-entitlement-detail");
    expect(readFileSync(join(FE, "app/admin/onboarding/entitlements/page.tsx"), "utf8")).toContain("detailHref");
    expect(readFileSync(join(FE, "app/admin/flags/useAdminFlagsPage.ts"), "utf8")).toContain(
      "ADMIN_PERM.PLATFORM_PUBLISH",
    );
    const adminMod = readFileSync(join(FE, "..", "crates/api/src/routes/admin/mod.rs"), "utf8");
    const adminRbac = readFileSync(join(FE, "..", "crates/api/src/routes/admin/admin_rbac.rs"), "utf8");
    expect(adminMod).toContain("require_admin_perm_uid");
    expect(adminMod).toContain("PERM_COMMUNITY_MODERATE");
    expect(adminRbac).toContain("console_role_70");
    expect(adminRbac).toContain("admin-rbac-v3-db-prep");
    expect(adminRbac).toContain("role_matrix_preview");
    expect(
      readFileSync(join(FE, "..", "scripts", "dev", "smoke-admin-rbac-matrix-local.sh"), "utf8"),
    ).toContain("smoke-admin-rbac-matrix-local");
    expect(
      readFileSync(
        join(FE, "evidence", "GO_local_admin_workspace_closure", "ADMIN-L5-PHASE-GAP-TASK-LIST.md"),
        "utf8",
      ),
    ).toContain("P1-ADM-CONF-02");
    expect(readFileSync(join(FE, "app/admin/permissions/AdminPermissionsPageMain.tsx"), "utf8")).toContain(
      "data-tt-admin-phase2-prep-banner",
    );
    expect(readFileSync(join(FE, "components/admin/AdminHomeClient.tsx"), "utf8")).toContain(
      "filterAdminHomeCardsForCapabilities",
    );
    expect(readFileSync(join(FE, "components/admin/AdminPermissionDeniedBanner.tsx"), "utf8")).toContain(
      "data-tt-admin-perm-denied",
    );
    expect(readFileSync(join(FE, "components/admin/AdminPermissionDeniedBanner.tsx"), "utf8")).toContain(
      "capabilitiesUnavailable",
    );
    expect(readFileSync(join(FE, "components/admin/AdminCapabilitiesShell.tsx"), "utf8")).toContain(
      "AdminRoutePermissionBanner",
    );
    expect(readFileSync(join(FE, "components/admin/AdminCapabilitiesShell.tsx"), "utf8")).toMatch(
      /AdminDevChunkRecoveryNotice[\s\S]*ssr:\s*false/,
    );
    expect(readFileSync(join(FE, "components/admin/AdminShellNavGroup.tsx"), "utf8")).toContain(
      "permissionsLoaded",
    );
    const zh = readFileSync(join(FE, "locales/zh.ts"), "utf8");
    expect(zh).toContain("admin_indexer_last_reconcile_issues");
    expect(zh).toMatch(/admin_indexer_last_reconcile_issues:.*\{\{count\}\}/);
  });
});
