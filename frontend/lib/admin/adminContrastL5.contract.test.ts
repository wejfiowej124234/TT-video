import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** ① VIS-05：Admin 域对比度 token 与统一 notice 组件。 */
describe("admin contrast L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");
  const noticeBanner = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminNoticeBanner.tsx"),
    "utf8",
  );
  const shellBar = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminShellBar.tsx"), "utf8");
  const permDenied = readFileSync(
    join(__dir, "..", "..", "components", "admin", "AdminPermissionDeniedBanner.tsx"),
    "utf8",
  );

  it("defines contrast-safe primary action + notice tokens", () => {
    expect(adminUi).toContain("ADMIN_NOTICE_WARNING_CLASS");
    expect(adminUi).toContain("ADMIN_NOTICE_INFO_CLASS");
    expect(adminUi).toContain("ADMIN_NOTICE_SUCCESS_CLASS");
    expect(adminUi).toMatch(/ADMIN_NOTICE_WARNING_CLASS[\s\S]*text-ink-800/);
    expect(adminUi).toMatch(/ADMIN_NOTICE_INFO_CLASS[\s\S]*text-ink-800/);
    expect(adminUi).toContain("ADMIN_ALERT_WARN_ITEM_CLASS");
    expect(adminUi).toContain("ADMIN_ALERT_CRITICAL_ITEM_CLASS");
    expect(adminUi).toMatch(/ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS[\s\S]*TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT/);
    expect(adminUi).toMatch(/ADMIN_FILTER_CHIP_ACTIVE_CLASS[\s\S]*text-\[#0c0a09\]/);
  });

  it("AdminNoticeBanner uses adminUi notice tokens", () => {
    expect(noticeBanner).toContain("ADMIN_NOTICE_WARNING_CLASS");
    expect(noticeBanner).toContain("ADMIN_NOTICE_INFO_CLASS");
    expect(noticeBanner).toContain("ADMIN_NOTICE_SUCCESS_CLASS");
    expect(noticeBanner).toContain("data-tt-admin-notice");
  });

  it("AdminPermissionDeniedBanner delegates to AdminNoticeBanner", () => {
    expect(permDenied).toContain("AdminNoticeBanner");
    expect(permDenied).toContain("data-tt-admin-perm-denied");
  });

  it("AdminShellBar uses console surface tokens", () => {
    expect(shellBar).toMatch(/TT_MARKETING_ADMIN_SHELL_BAR|bg-\[#0c0a09\]/);
  });

  it("AdminCapabilitiesShell applies TT_ADMIN_ZONE_ROOT", () => {
    const capShell = readFileSync(
      join(__dir, "..", "..", "components", "admin", "AdminCapabilitiesShell.tsx"),
      "utf8",
    );
    const marketingUi = readFileSync(join(__dir, "..", "marketingUi.ts"), "utf8");
    expect(capShell).toContain("TT_ADMIN_ZONE_ROOT");
    expect(capShell).toContain("ADMIN_MAIN_CONTENT_COLUMN_CLASS");
    expect(capShell).toContain("flex min-h-screen flex-col");
    expect(capShell).toContain('data-tt-admin-zone-root="1"');
    expect(marketingUi).toMatch(/export const TT_MARKETING_ADMIN_ZONE_ROOT = TT_MARKETING_ORDERS_PAGE_SHELL/);
  });

  it("PageMain/PageInner avoid raw warning notice blocks without AdminNoticeBanner", () => {
    const offenders: string[] = [];
    const adminAppRoot = join(__dir, "..", "..", "app", "admin");
    for (const file of walkTsx(adminAppRoot)) {
      if (!file.endsWith("PageMain.tsx") && !file.endsWith("PageInner.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("border-warning/30 bg-warning/10")) continue;
      if (src.includes("AdminNoticeBanner")) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("page access badges use light text on dark shell headers", () => {
    expect(adminUi).toMatch(
      /export const ADMIN_PAGE_ACCESS_WRITABLE_BADGE_CLASS =[\s\S]*?text-\[#e8c96a\]/,
    );
    expect(adminUi).toMatch(
      /export const ADMIN_PAGE_ACCESS_READONLY_BADGE_CLASS =[\s\S]*?text-slate-300/,
    );
    expect(adminUi).not.toMatch(
      /export const ADMIN_PAGE_ACCESS_WRITABLE_BADGE_CLASS =[\s\S]*?text-\[#9a5f18\]/,
    );
  });

  it("dark-shell home tokens forbid cream `#faf8f6` panels and expose dark ghost CTA", () => {
    expect(adminUi).toContain("ADMIN_BTN_GHOST_DARK_CLASS");
    expect(adminUi).toMatch(/ADMIN_BTN_GHOST_DARK_CLASS[\s\S]*TT_MARKETING_HOME_HERO_PILL_GHOST/);
    expect(adminUi).toContain("ADMIN_DARK_GLASS_PANEL_CLASS");
    expect(adminUi).not.toMatch(/export const ADMIN_INBOX_FOCUS_BANNER_CLASS[^;]*#faf8f6/);
    expect(adminUi).not.toMatch(/export const ADMIN_HOME_MAINTAINER_FOLD_CLASS[^;]*#faf8f6/);
    expect(adminUi).not.toMatch(/export const ADMIN_HOME_TECH_FOLD_CLASS[^;]*#faf8f6/);
    expect(adminUi).toMatch(/ADMIN_INBOX_TASK_CTA_IDLE_CLASS[\s\S]*ADMIN_BTN_GHOST_DARK_CLASS/);
    expect(adminUi).toMatch(/ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS[\s\S]*#ffe8d4/);
    expect(adminUi).toContain("ADMIN_INBOX_FOCUS_INSET_CLASS");
    expect(adminUi).toMatch(/export const ADMIN_INBOX_FOCUS_BANNER_CLASS = ADMIN_INBOX_FOCUS_INSET_CLASS/);
    expect(adminUi).toMatch(/ADMIN_INBOX_CHANNEL_ERROR_CLASS[\s\S]*text-amber-200/);
    const marketingUi = readFileSync(join(__dir, "..", "marketingUi.ts"), "utf8");
    expect(marketingUi).toMatch(/TT_MARKETING_ADMIN_ZONE_DOT_GRID[\s\S]*opacity-\[0\.06\]/);
  });

  it("AdminHomeInboxStrip focus mode uses flat surface without duplicate hero badges", () => {
    const inbox = readFileSync(
      join(__dir, "..", "..", "components", "admin", "AdminHomeInboxStrip.tsx"),
      "utf8",
    );
    expect(inbox).toContain("data-tt-admin-home-inbox-focus-surface");
    expect(inbox).toContain("ADMIN_INBOX_TASK_CTA_FOCUS_CLASS");
    expect(inbox).not.toMatch(/data-tt-admin-inbox-focus-banner="1"/);
    expect(inbox).not.toMatch(/data-tt-admin-inbox-focus-banner="1"[\s\S]{0,600}ADMIN_PENDING_COUNT_BADGE_CLASS/);
  });

  it("PageMain/PageInner avoid raw amber readonly blocks without AdminNoticeBanner", () => {
    const offenders: string[] = [];
    const adminAppRoot = join(__dir, "..", "..", "app", "admin");
    for (const file of walkTsx(adminAppRoot)) {
      if (!file.endsWith("PageMain.tsx") && !file.endsWith("PageInner.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (!src.includes("border-amber-200")) continue;
      if (src.includes("AdminNoticeBanner") || src.includes("AdminPermissionDeniedBanner")) continue;
      offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });
});
