import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** VIS-05 · attention 条/面板与 RBAC 矩阵 diff 走 adminUi token。 */
describe("admin attention L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");

  it("defines attention strip + callout + matrix diff tokens", () => {
    expect(adminUi).toContain("ADMIN_ATTENTION_CALLOUT_CLASS");
    expect(adminUi).toContain("ADMIN_ATTENTION_STRIP_CLASS");
    expect(adminUi).toContain("ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS");
    expect(adminUi).toMatch(/ADMIN_ATTENTION_CALLOUT_CLASS[\s\S]*border-warning\/30/);
  });

  it("shell + route banners use attention tokens not raw amber panels", () => {
    for (const rel of [
      "components/admin/AdminShellApproveBanner.tsx",
      "components/admin/AdminRoutePermissionBanner.tsx",
      "components/admin/AdminOnboardingListPage.tsx",
      "components/admin/AdminQueueListPageChrome.tsx",
      "components/admin/AdminHomeClient.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("ADMIN_ATTENTION");
      expect(src, rel).not.toMatch(/border-amber-200 bg-amber-50/);
    }
  });

  it("permissions matrix diff uses ADMIN_ROLE_MATRIX_DIFF tokens", () => {
    const src = readFileSync(join(fe, "app", "admin", "permissions", "AdminPermissionsPageMain.tsx"), "utf8");
    expect(src).toContain("ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS");
    expect(src).toContain("ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS");
    expect(src).not.toContain("bg-amber-50/40");
    expect(src).not.toContain("text-amber-900");
  });

  it("home search mark uses ADMIN_CONSOLE_SEARCH_MARK_CLASS not raw amber highlight", () => {
    const src = readFileSync(join(fe, "components", "admin", "AdminHomeCardSearch.tsx"), "utf8");
    expect(src).toContain("ADMIN_CONSOLE_SEARCH_MARK_CLASS");
    expect(src).not.toContain("bg-amber-100");
  });

  it("deploy env badge uses adminUi tokens not raw amber staging panel", () => {
    const badge = readFileSync(join(__dir, "adminDeployEnvBadge.ts"), "utf8");
    expect(badge).toContain("ADMIN_DEPLOY_ENV_STAGING_BADGE_CLASS");
    expect(badge).not.toMatch(/border-amber-300 bg-amber-50/);
  });

  it("home domain health attention tone uses adminUi tokens", () => {
    const src = readFileSync(join(fe, "components", "admin", "AdminHomeDomainHealthStrip.tsx"), "utf8");
    expect(src).toContain("ADMIN_DOMAIN_HEALTH_ATTENTION_CARD_CLASS");
    expect(src).not.toContain("border-amber-300");
  });
});
