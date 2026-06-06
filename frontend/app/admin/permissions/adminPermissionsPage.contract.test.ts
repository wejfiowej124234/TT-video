import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  const componentsAdmin = join(__dir, "..", "..", "..", "components", "admin");
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminPermissionsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminPermissionsPage.ts"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminPermissionsSelfConsoleRole.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminPermissionsMaintainerFold.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminPermissionsMatrixLegend.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminAdmU01LocalPrepPanel.tsx"), "utf8"),
    readFileSync(join(componentsAdmin, "AdminPhase2StagingRecordPanel.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminPermissions2faPolicyPanel.tsx"), "utf8"),
  ].join("\n");
}

describe("admin permissions page", () => {
  const src = readModuleSources();

  it("keeps permissions center anchors + console role assign + AdminListFetchError", () => {
    expect(src).toContain('"data-tt-admin-permissions": "1"');
    expect(src).toContain('"data-tt-admin-permissions-phase2-prep": "1"');
    expect(src).toContain('data-tt-admin-console-role-assign="1"');
    expect(src).toContain("AdminPermissionsSelfConsoleRole");
    expect(src).toContain("AdminConsoleRoleEffectiveStrip");
    expect(src).toContain("AdminPermissionsProductionSafetyPanel");
    expect(src).toContain("AdminPhase2ClosurePrepPanel");
    expect(src).toContain("AdminPhase2RemainingBacklogPanel");
    expect(src).toContain("AdminPermissionsPhase2RunbookStrip");
    expect(src).toContain("AdminPermissionsMaintainerFold");
    expect(src).toContain("AdminPermissionsMatrixLegend");
    expect(src).toContain("console_role_direct_allowed");
    expect(src).toContain("data-tt-admin-console-role-self-assign");
    expect(src).toContain("AdminWarmL5Surface");
    expect(src).toContain('id="admin-console-role-self-assign"');
    expect(src).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(src).not.toContain("data-tt-admin-permissions-footer-nav");
    expect(src).toContain("userConsoleRoleChangeRequest");
    expect(src).toContain("router.refresh");
    expect(src).toContain("AdminPermissions2faPolicyPanel");
    expect(src).toContain("ADMIN_STEP_MARKER_CLASS");
    expect(src).toContain("ADMIN_2FA_POLICY_ACTIVE_BADGE_CLASS");
    expect(src).not.toContain("bg-amber-100");
    expect(src).toContain("AdminPermissionsTotpPanel");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain("AdminConsoleRoleShellPreview");
    expect(src).toContain("data-tt-admin-permissions-matrix-card");
    expect(src).toContain("data-tt-admin-role70-current");
    expect(src).toContain("AdminAdmU01LocalPrepPanel");
    expect(src).toContain("admin-adm-u01-local-prep");
    expect(src).toContain("AdminPhase2StagingRecordPanel");
    expect(src).toContain("admin-phase2-staging-record");
  });
});
