import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = join(__dirname, "../../../..");

describe("admin permissions DB prep (①)", () => {
  it("routes and RBAC v3 SSOT", () => {
    const routes = readFileSync(join(REPO, "frontend/lib/api/routesAdminCore.ts"), "utf8");
    expect(routes).toContain("userConsoleRole");
    expect(routes).toContain("rbacRouteMatrix");
    const rbac = readFileSync(join(REPO, "crates/api/src/routes/admin/admin_rbac.rs"), "utf8");
    expect(rbac).toContain("admin-rbac-v4-cms-ops-growth-2026-06-07");
    expect(rbac).toContain("put_admin_user_console_role");
    expect(rbac).toContain("post_admin_user_console_role_change_request");
    expect(rbac).toContain("console_role_use_approval_flow");
    expect(rbac).toContain("adm_u02_local_ready");
  });

  it("permissions page wires console role assign", () => {
    const page = [
      readFileSync(join(REPO, "frontend/app/admin/permissions/page.tsx"), "utf8"),
      readFileSync(join(REPO, "frontend/app/admin/permissions/AdminPermissionsPageMain.tsx"), "utf8"),
      readFileSync(join(REPO, "frontend/app/admin/permissions/useAdminPermissionsPage.ts"), "utf8"),
    ].join("\n");
    expect(page).toContain("data-tt-admin-console-role-assign");
    expect(page).toContain("userConsoleRoleChangeRequest");
    expect(page).toContain("AdminPermissions2faPolicyPanel");
  });

  it("permissions page wires TOTP enroll/verify panel", () => {
    const page = [
      readFileSync(join(REPO, "frontend/app/admin/permissions/page.tsx"), "utf8"),
      readFileSync(join(REPO, "frontend/app/admin/permissions/AdminPermissionsPageMain.tsx"), "utf8"),
      readFileSync(join(REPO, "frontend/app/admin/permissions/useAdminPermissionsPage.ts"), "utf8"),
    ].join("\n");
    const panel = readFileSync(
      join(REPO, "frontend/app/admin/permissions/AdminPermissionsTotpPanel.tsx"),
      "utf8",
    );
    expect(page).toContain("AdminPermissionsTotpPanel");
    expect(panel).toContain("data-tt-admin-totp-panel");
    expect(panel).toContain("routes.admin.totpEnroll");
    expect(panel).toContain("setAdmin2faSessionToken");
    expect(readFileSync(join(REPO, "frontend/lib/apiClient/core.ts"), "utf8")).toContain(
      "getAdmin2faSessionHeaders",
    );
  });
});
