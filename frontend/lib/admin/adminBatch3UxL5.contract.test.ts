import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const permissionsDir = join(fe, "app", "admin", "permissions");

/** ① 第三批 UX · 权限产品化 / 收件箱合计徽标 / 矩阵图例 / ONB Stripe 卡。 */
describe("admin batch3 UX L5 (①)", () => {
  it("inbox hub pending uses four-queue total SSOT", () => {
    const badge = readFileSync(join(__dir, "adminShellInboxNavBadge.ts"), "utf8");
    const sidebar = readFileSync(join(componentsAdmin, "AdminShellSidebar.tsx"), "utf8");
    const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
    expect(badge).toContain("adminHomeInboxPendingTotal");
    expect(badge).toContain('ADMIN_SHELL_INBOX_HUB_HREF = "/admin/inbox"');
    expect(sidebar).toContain("adminShellNavPendingCount");
    expect(bar).toContain("AdminShellPendingBadge");
    expect(bar).toContain('legacyMarker="hub"');
  });

  it("permissions page productizes role copy and folds maintainer panels", () => {
    const main = readFileSync(join(permissionsDir, "AdminPermissionsPageMain.tsx"), "utf8");
    const fold = readFileSync(join(componentsAdmin, "AdminPermissionsMaintainerFold.tsx"), "utf8");
    const strip = readFileSync(join(componentsAdmin, "AdminConsoleRoleEffectiveStrip.tsx"), "utf8");
    expect(main).toContain("AdminPermissionsMaintainerFold");
    expect(main).toContain("data-tt-admin-permissions-console-role-line");
    expect(main).toContain("isAdminMaintainerUi");
    expect(fold).toContain("data-tt-admin-permissions-maintainer-fold");
    expect(strip).toContain("admin_console_role_effective_title_product");
    expect(strip).toContain("admin_console_role_source_product");
  });

  it("matrix legend + self-role presets and shell preview", () => {
    const legend = readFileSync(join(componentsAdmin, "AdminPermissionsMatrixLegend.tsx"), "utf8");
    const self = readFileSync(join(componentsAdmin, "AdminPermissionsSelfConsoleRole.tsx"), "utf8");
    const main = readFileSync(join(permissionsDir, "AdminPermissionsPageMain.tsx"), "utf8");
    expect(legend).toContain("data-tt-admin-permissions-matrix-legend");
    expect(main).toContain("AdminPermissionsMatrixLegend");
    expect(self).toContain("data-tt-admin-self-role-presets");
    expect(self).toContain("data-tt-admin-self-role-preview-shell");
  });

  it("payment events stripe echo card + totp numbered steps", () => {
    const stripe = readFileSync(
      join(componentsAdmin, "AdminOnboardingPaymentEventsStripeEchoStrip.tsx"),
      "utf8",
    );
    const totp = readFileSync(join(permissionsDir, "AdminPermissionsTotpPanel.tsx"), "utf8");
    expect(stripe).toContain("data-tt-admin-onboarding-payment-stripe-echo-card");
    expect(totp).toContain("data-tt-admin-totp-steps");
    expect(totp).toContain("ADMIN_STEP_MARKER_CLASS");
  });
});
