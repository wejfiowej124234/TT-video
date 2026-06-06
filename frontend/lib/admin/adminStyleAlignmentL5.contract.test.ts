import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/**
 * ① Admin 风格与项目 L0 控制台对齐（86 §6.0.1 · ink · 非五主 travel 营销青）。
 * 真源：`adminUi.ts` · `uiSystem` admin zone · 与 orders/escrow 同系。
 */
describe("admin style alignment L5 (① · project console)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const shell = readFileSync(join(fe, "components", "admin", "AdminCapabilitiesShell.tsx"), "utf8");
  const header = readFileSync(join(fe, "components", "Header.tsx"), "utf8");
  const adminError = readFileSync(join(fe, "app", "admin", "error.tsx"), "utf8");
  const rolePreview = readFileSync(
    join(fe, "app", "admin", "permissions", "AdminConsoleRoleShellPreview.tsx"),
    "utf8",
  );

  it("adminUi exposes TT_ADMIN_ZONE_ROOT and error aliases from console tokens", () => {
    const marketingUi = readFileSync(join(fe, "lib", "marketingUi.ts"), "utf8");
    expect(adminUi).toContain("TT_ADMIN_ZONE_ROOT = TT_MARKETING_ADMIN_ZONE_ROOT");
    expect(adminUi).toContain("TT_ADMIN_ERROR_MAIN");
    expect(adminUi).toContain("TT_ADMIN_ERROR_CARD");
    expect(adminUi).toMatch(/TT_ADMIN_ZONE_ROOT[\s\S]*TT_MARKETING_ADMIN_ZONE_ROOT/);
    expect(marketingUi).toMatch(/export const TT_MARKETING_ADMIN_ZONE_ROOT = TT_MARKETING_ORDERS_PAGE_SHELL/);
    expect(marketingUi).toContain("TT_MARKETING_ADMIN_ZONE_VIGNETTE");
    expect(marketingUi).toContain("TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW");
    expect(marketingUi).not.toMatch(
      /TT_MARKETING_ADMIN_ZONE_ROOT = TT_MARKETING_PRODUCT_PAGE_SHELL;/,
    );
    expect(adminUi).toMatch(
      /ADMIN_PRIMARY_ACTION_BTN_CLASS[\s\S]*TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT/,
    );
    expect(adminUi).toMatch(
      /ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS[\s\S]*TT_MARKETING_BTN_PRIMARY_WARM_WIDGET/,
    );
    expect(adminUi).not.toMatch(/ADMIN_PRIMARY_ACTION_BTN_CLASS[\s\S]*bg-travel-/);
    expect(adminUi).toContain("ADMIN_SHELL_BRAND_ACCENT_CLASS");
    expect(adminUi).toContain("border-ref-sun");
    expect(adminUi).toContain("ADMIN_HEADER_RETURN_SITE_CLASS");
  });

  it("Admin shell mounts global preview notice and Header return-site pill", () => {
    expect(shell).toContain("AdminShellPreviewNotice");
    expect(shell).toContain('data-tt-admin-zone-root="1"');
    expect(header).toContain('data-tt-admin-return-site-prominent="1"');
    expect(header).toContain("ADMIN_HEADER_RETURN_SITE_CLASS");
  });

  it("AdminCapabilitiesShell wraps subtree in TT_ADMIN_ZONE_ROOT flex column", () => {
    expect(shell).toContain("TT_ADMIN_ZONE_ROOT");
    expect(shell).toContain("AdminZoneAmbientBackdrop");
    expect(shell).toContain("ADMIN_ZONE_CONTENT_STACK_CLASS");
    expect(shell).toContain("ADMIN_MAIN_CONTENT_COLUMN_CLASS");
    expect(shell).toContain('data-tt-admin-main-content="1"');
    expect(shell).toContain("flex min-h-screen flex-col");
    expect(shell).toContain('data-tt-admin-zone-root="1"');
    expect(shell).toContain("flex min-h-0 flex-1");
  });

  it("admin error boundary uses TT_ADMIN_* not raw TT_MARKETING_ADMIN_ERROR_*", () => {
    expect(adminError).toContain("TT_ADMIN_ERROR_MAIN");
    expect(adminError).toContain("TT_ADMIN_ERROR_CARD");
    expect(adminError).not.toContain("TT_MARKETING_ADMIN_ERROR_MAIN");
  });

  it("permissions shell preview uses ADMIN_FOCUS_RING_CORE_CLASS not marketing focus export", () => {
    expect(rolePreview).toContain("ADMIN_FOCUS_RING_CORE_CLASS");
    expect(rolePreview).not.toContain("TT_MARKETING_FOCUS_RING_CONSOLE");
  });

  it("adminUi exposes warm L5 + home canvas tokens (同源 `/` WARM_L5 · ADM-UX-VIS-09)", () => {
    const home = readFileSync(join(fe, "components", "admin", "AdminHomeClient.tsx"), "utf8");
    const inbox = readFileSync(join(fe, "components", "admin", "AdminHomeInboxStrip.tsx"), "utf8");
    const warmSurface = readFileSync(join(fe, "components", "admin", "AdminWarmL5Surface.tsx"), "utf8");
    const listChrome = readFileSync(join(fe, "components", "admin", "AdminListPageChrome.tsx"), "utf8");
    const shellBar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
    const recentVisits = readFileSync(join(fe, "components", "admin", "AdminHomeRecentVisits.tsx"), "utf8");
    expect(adminUi).toContain("ADMIN_WARM_L5_FRAME_CLASS");
    expect(adminUi).toMatch(/ADMIN_WARM_L5_FRAME_CLASS[\s\S]*TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE/);
    expect(adminUi).toMatch(/ADMIN_WARM_L5_INNER_CLASS[\s\S]*TT_MARKETING_ORDERS_DARK_GLASS_INNER/);
    expect(adminUi).toContain("ADMIN_WORKSPACE_TITLE_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_FOCUS_BANNER_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_TASK_PENDING_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_TASK_PENDING_CARD_FOCUS_CLASS");
    expect(adminUi).toContain("ADMIN_COMMAND_PALETTE_KBD_CLASS");
    expect(adminUi).toContain("ADMIN_WORKSPACE_TITLE_FOCUS_CLASS");
    expect(adminUi).toContain("ADMIN_SURFACE_PLAIN_CLASS");
    expect(adminUi).toContain("ADMIN_MAIN_CONTENT_COLUMN_CLASS");
    expect(adminUi).toContain("ADMIN_HOME_CANVAS_CLASS");
    expect(adminUi).toMatch(/ADMIN_HOME_CANVAS_CLASS[\s\S]*slate-950/);
    expect(adminUi).toContain("ADMIN_SHELL_SIDEBAR_SURFACE_CLASS");
    expect(warmSurface).toContain("data-tt-admin-warm-l5-surface");
    expect(home).toContain("AdminWarmL5Surface");
    expect(home).toContain("ADMIN_WORKSPACE_TITLE_CLASS");
    expect(home).toContain("ADMIN_WORKSPACE_TITLE_FOCUS_CLASS");
    expect(home).toContain("ADMIN_COMMAND_PALETTE_KBD_CLASS");
    expect(inbox).toContain("AdminWarmL5Surface");
    expect(inbox).toContain("data-tt-admin-home-inbox-focus-surface");
    expect(inbox).toContain("ADMIN_INBOX_TASK_CTA_FOCUS_CLASS");
    expect(listChrome).toContain("AdminWarmL5Surface");
    expect(listChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(adminUi).toContain("ADMIN_FILTER_RESET_BTN_CLASS");
    expect(adminUi).toContain("ADMIN_HUB_DEPTH_LINK_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_CAPABILITY_STRIP_CLASS");
    expect(adminUi).toContain("ADMIN_SHELL_SECONDARY_BTN_CLASS");
    expect(adminUi).toContain("ADMIN_RECENT_VISIT_CHIP_CLASS");
    expect(adminUi).toMatch(/ADMIN_FILTER_CHIP_ACTIVE_CLASS[\s\S]*TT_MARKETING_ACTION_GRADIENT_FILL/);
    expect(shellBar).toContain("ADMIN_SHELL_META_CHIP_CLASS");
    expect(shellBar).toContain("ADMIN_SHELL_DB_ROLE_BADGE_CLASS");
    expect(recentVisits).toContain("ADMIN_RECENT_VISIT_CHIP_CLASS");
    expect(listChrome).toContain("data-tt-admin-list-page-body-canvas");
    const detailChrome = readFileSync(join(fe, "components", "admin", "AdminDetailPageChrome.tsx"), "utf8");
    const queueChrome = readFileSync(join(fe, "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
    expect(detailChrome).toContain("data-tt-admin-detail-page-body-canvas");
    expect(queueChrome).toContain("data-tt-admin-queue-list-body-canvas");
  });
});
