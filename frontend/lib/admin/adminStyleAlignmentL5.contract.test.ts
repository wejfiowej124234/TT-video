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
  const adminError = readFileSync(join(fe, "app", "admin", "error.tsx"), "utf8");
  const rolePreview = readFileSync(
    join(fe, "app", "admin", "permissions", "AdminConsoleRoleShellPreview.tsx"),
    "utf8",
  );

  it("adminUi exposes TT_ADMIN_ZONE_ROOT and error aliases from console tokens", () => {
    expect(adminUi).toContain("TT_ADMIN_ZONE_ROOT = TT_MARKETING_ADMIN_ZONE_ROOT");
    expect(adminUi).toContain("TT_ADMIN_ERROR_MAIN");
    expect(adminUi).toContain("TT_ADMIN_ERROR_CARD");
    expect(adminUi).toMatch(/TT_ADMIN_ZONE_ROOT[\s\S]*TT_MARKETING_ADMIN_ZONE_ROOT/);
    expect(adminUi).toMatch(/ADMIN_PRIMARY_ACTION_BTN_CLASS[\s\S]*bg-ink-900/);
    expect(adminUi).not.toMatch(/ADMIN_PRIMARY_ACTION_BTN_CLASS[\s\S]*bg-travel-/);
  });

  it("AdminCapabilitiesShell wraps subtree in TT_ADMIN_ZONE_ROOT flex column", () => {
    expect(shell).toContain("TT_ADMIN_ZONE_ROOT");
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

  it("adminUi exposes home canvas + widget card tokens for page layering", () => {
    const home = readFileSync(join(fe, "components", "admin", "AdminHomeClient.tsx"), "utf8");
    const listChrome = readFileSync(join(fe, "components", "admin", "AdminListPageChrome.tsx"), "utf8");
    expect(adminUi).toContain("ADMIN_HOME_CANVAS_CLASS");
    expect(adminUi).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(adminUi).toMatch(/ADMIN_HOME_CANVAS_CLASS[\s\S]*bg-bg-console/);
    expect(home).toContain("ADMIN_HOME_CANVAS_CLASS");
    expect(home).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(listChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_DEPTH_PANEL_CLASS");
    expect(listChrome).toContain("data-tt-admin-list-page-body-canvas");
    const detailChrome = readFileSync(join(fe, "components", "admin", "AdminDetailPageChrome.tsx"), "utf8");
    const queueChrome = readFileSync(join(fe, "components", "admin", "AdminQueueListPageChrome.tsx"), "utf8");
    expect(detailChrome).toContain("data-tt-admin-detail-page-body-canvas");
    expect(queueChrome).toContain("data-tt-admin-queue-list-body-canvas");
  });
});
