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

  /** Batch-13 FP-A · 全站暗底副文 AA（HU-496/504/512/520/528/536/544/552/560） */
  it("FP-A: dark-shell secondary/muted tokens + zone ink remap are AA-bright", () => {
    expect(adminUi).toMatch(/export const ADMIN_TEXT_SECONDARY_CLASS =\s*"text-slate-300"/);
    expect(adminUi).toMatch(/export const ADMIN_TEXT_MUTED_CLASS =\s*"text-slate-300"/);
    expect(adminUi).not.toMatch(/export const ADMIN_TEXT_MUTED_CLASS =\s*TT_MARKETING_ORDERS_TEXT_MUTED/);
    expect(adminUi).toMatch(/ADMIN_FILTER_HINT_CLASS[\s\S]*text-slate-300/);
    const globalsCss = readFileSync(join(__dir, "..", "..", "app", "globals.css"), "utf8");
    const zoneInk600 = globalsCss.match(
      /\[data-tt-admin-zone-content-stack\] \.text-ink-600 \{([^}]+)\}/,
    );
    expect(zoneInk600?.[1]).toMatch(/203 213 225/);
    expect(zoneInk600?.[1]).toMatch(/!important/);
    const zoneInk500 = globalsCss.match(
      /\[data-tt-admin-zone-content-stack\] \.text-ink-500 \{([^}]+)\}/,
    );
    expect(zoneInk500?.[1]).toMatch(/203 213 225/);
    expect(globalsCss).toMatch(
      /\[data-tt-admin-zone-content-stack\] \.text-slate-400 \{[\s\S]*?203 213 225/,
    );
    expect(globalsCss).toMatch(
      /\[data-tt-admin-warm-l5-surface\] \.text-ink-600,[\s\S]*?203 213 225/,
    );
    expect(globalsCss).toContain("tt-admin-gold-fill");
    expect(adminUi).toContain("tt-admin-gold-fill");
    expect(adminUi).toMatch(/ADMIN_TABLE_PRIMARY_ACTION_BTN_CLASS[\s\S]*text-\[#0c0a09\]/);
    expect(adminUi).toMatch(/ADMIN_TABLE_SECONDARY_ACTION_BTN_CLASS[\s\S]*text-slate-200/);
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
    // Batch-12 HU-438 · banner is secondary outline (not filled INSET)
    expect(adminUi).toMatch(
      /export const ADMIN_INBOX_FOCUS_BANNER_CLASS =\s*"inline-flex[\s\S]*border-ref-sun\/40[\s\S]*bg-transparent/,
    );
    expect(adminUi).toContain("TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK");
    expect(adminUi).toContain("ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS");
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
