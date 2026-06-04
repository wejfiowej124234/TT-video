import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADM_U01_SHELL_GROUP_VISIBILITY,
  admU01ShellGroupVisible,
} from "./admU01ShellGroupVisibility";

const __dir = dirname(fileURLToPath(import.meta.url));

/** IA-06 · ① 六角色 Shell 预览（非 ② 真切换）。 */
describe("admin console role shell preview L5 (①)", () => {
  const preview = readFileSync(
    join(__dir, "..", "..", "app", "admin", "permissions", "AdminConsoleRoleShellPreview.tsx"),
    "utf8",
  );
  const pageMain = readFileSync(
    join(__dir, "..", "..", "app", "admin", "permissions", "AdminPermissionsPageMain.tsx"),
    "utf8",
  );

  it("defines shell preview panel with honesty marker", () => {
    expect(preview).toContain("data-tt-admin-console-role-shell-preview");
    expect(preview).toContain("id=\"admin-shell-preview\"");
    expect(preview).toContain("data-tt-admin-shell-preview-honesty");
    expect(preview).toContain("data-tt-admin-shell-preview-apply");
    expect(preview).toContain("data-tt-admin-shell-preview-quick-roles");
    expect(preview).toContain("data-tt-admin-shell-preview-quick-role-current");
    expect(preview).toContain("orderConsoleRoles70WithCurrentFirst");
    expect(preview).toContain("data-tt-admin-shell-preview-self-role-link");
    expect(preview).toContain("writeAdminShellPreviewRole");
    expect(preview).toContain('router.push("/admin")');
    expect(preview).toContain("admU01ShellGroupVisible");
    expect(preview).toContain("admin_permissions_shell_preview_honesty");
  });

  it("permissions page mounts shell preview when matrix available", () => {
    expect(pageMain).toContain("AdminConsoleRoleShellPreview");
  });

  it("Finance role hides finance shell group per ADM-U01 matrix", () => {
    expect(admU01ShellGroupVisible("finance", "Finance")).toBe(true);
    expect(admU01ShellGroupVisible("finance", "CS")).toBe(false);
    expect(ADM_U01_SHELL_GROUP_VISIBILITY.community.Finance).toBe(false);
  });
});
