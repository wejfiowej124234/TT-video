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



  it("keeps phase badge, actor role, grouped nav (Batch-7 sidebar SSOT)", () => {

    expect(src).toContain('data-tt-admin-shell-bar="1"');

    expect(src).toContain("useAdminShellActor");

    expect(src).toContain("admin_shell_phase_local_badge");

    expect(src).toContain("admin_shell_nav_workspace");

    expect(src).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(src).toContain('filter((group) => group.id !== "workspace")');
    expect(src).toContain("adminShellTopNavLinksFromSidebarGroup");
    expect(src).toContain("adminShellNavLinkMatch");

    expect(src).toContain("AdminFinanceShellNavGroupGate");

    expect(src).toContain("shellNav");

    expect(src).toContain("adminHomeCardRequiredPermission");

    expect(src).toContain("useAdminEffectiveShellRole");
    expect(src).toContain("data-tt-admin-shell-db-role-active");

    expect(src).toContain("admU01ShellGroupVisible");

    expect(src).toContain("data-tt-admin-shell-top-nav-groups");
    expect(src).toContain("data-tt-admin-shell-preview-active");
    expect(src).toContain("data-tt-admin-shell-account-role");
    expect(src).toContain("ADMIN_SHELL_PREVIEW_BADGE_CLASS");
    expect(src).toContain("ADMIN_SHELL_BRAND_ACCENT_CLASS");
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
    expect(src).toContain("adminShellRolePerspectiveSwitcherVisible");
    expect(src).toContain("adminShellPreviewBadgeVisible");
    expect(src).toContain("adminShellNavGroupDefaultOpen");
    expect(src).toContain("adminShellCommandPaletteTriggerVisible");
    expect(src).toContain("data-tt-admin-shell-preview-deferred");
  });

});
