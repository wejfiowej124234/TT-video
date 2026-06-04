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
    expect(adminUi).toContain("bg-ink-900");
    expect(adminUi).toContain("text-white");
    expect(adminUi).toMatch(/ADMIN_NOTICE_WARNING_CLASS[\s\S]*text-ink-800/);
    expect(adminUi).toMatch(/ADMIN_NOTICE_INFO_CLASS[\s\S]*text-ink-800/);
    expect(adminUi).toContain("ADMIN_ALERT_WARN_ITEM_CLASS");
    expect(adminUi).toContain("ADMIN_ALERT_CRITICAL_ITEM_CLASS");
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
    expect(shellBar).toMatch(/bg-bg-console|TT_MARKETING_ADMIN_SHELL_BAR/);
  });

  it("AdminCapabilitiesShell applies TT_ADMIN_ZONE_ROOT", () => {
    const capShell = readFileSync(
      join(__dir, "..", "..", "components", "admin", "AdminCapabilitiesShell.tsx"),
      "utf8",
    );
    expect(capShell).toContain("TT_ADMIN_ZONE_ROOT");
    expect(capShell).toContain("flex min-h-screen flex-col");
    expect(capShell).toContain('data-tt-admin-zone-root="1"');
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
