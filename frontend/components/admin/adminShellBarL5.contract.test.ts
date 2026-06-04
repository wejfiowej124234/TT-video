import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));



describe("admin shell bar L5", () => {

  const src = [

    readFileSync(join(__dir, "AdminShellBar.tsx"), "utf8"),

    readFileSync(join(__dir, "AdminShellNavGroup.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminShellApproveBanner.tsx"), "utf8"),

    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminShellPreviewRole.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminDeployEnvBadge.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "lib", "admin", "adminMaintainerUiMode.ts"), "utf8"),

  ].join("\n");



  it("keeps phase badge, actor role, grouped nav", () => {

    expect(src).toContain('data-tt-admin-shell-bar="1"');

    expect(src).toContain("useAdminShellActor");

    expect(src).toContain("admin_shell_phase_local_badge");

    expect(src).toContain("admin_shell_nav_workspace");

    expect(src).toContain("admin_shell_nav_group_onboarding");

    expect(src).toContain("admin_shell_nav_group_operations");

    expect(src).toContain("admin_shell_nav_group_community");

    expect(src).toContain("/admin/onboarding");

    expect(src).toContain("data-tt-admin-shell-nav-group");

    expect(src).toContain("admin_shell_nav_provider_queue");

    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS.provider");
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    expect(src).toContain("/admin/auth-audit-events");
    expect(src).toContain("ADMIN_SHELL_COMMUNITY_EXTRA_LINKS");
    expect(src).toContain("ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map");

    expect(src).toContain("/admin/permissions");

    expect(src).toContain("/admin/finance-suite");
    expect(src).toContain("AdminFinanceShellNavGroupGate");
    expect(src).toContain("ADMIN_PERM.FINANCE_READ");

    expect(src).toContain("/admin/compliance");

    expect(src).toContain("/admin/community/moderation/cases");

    expect(src).toContain("shellNav");

    expect(src).toContain("adminHomeCardRequiredPermission");

    expect(src).toContain("useAdminEffectiveShellRole");
    expect(src).toContain("data-tt-admin-shell-db-role-active");

    expect(src).toContain("admU01ShellGroupVisible");

    expect(src).toContain("data-tt-admin-shell-top-nav-groups");
    expect(src).not.toContain("data-tt-admin-shell-preview-active");
    expect(src).toContain("/admin/inbox");
    expect(src).toContain("resolveAdminDeployEnv");
    expect(src).toContain("isAdminMaintainerUi");
    expect(src).toContain("data-tt-admin-approve-banner-dismiss");
    expect(src).toContain("data-tt-admin-command-palette-trigger");
    expect(src).toContain("requestAdminCommandPaletteOpen");
    expect(src).toContain("data-tt-admin-deploy-env");
    expect(src).toContain("data-tt-admin-shell-approve-banner");
    expect(src).toContain("ADMIN_ATTENTION_STRIP_CLASS");
    expect(src).toContain("data-tt-admin-shell-role-perspective-link");
    expect(src).toContain("AdminShellBarRolePerspectiveSwitcher");
  });

});
