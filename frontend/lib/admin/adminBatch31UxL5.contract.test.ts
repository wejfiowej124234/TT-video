import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");



/** ① 第三十一批 UX · 窄屏顶栏分组折叠 + 提示文案。 */

describe("admin batch31 UX L5 (①)", () => {

  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("shell bar exposes mobile nav fold + hint markers", () => {

    expect(bar).toContain('data-tt-admin-shell-mobile-nav-fold="1"');

    expect(bar).toContain('data-tt-admin-shell-mobile-nav-hint="1"');

    expect(bar).toContain("admin_shell_mobile_nav_summary");

    expect(bar).toContain("admin_shell_mobile_nav_hint");

  });



  it("en locale mobile nav hint is English product copy", () => {

    const hint = en.match(/admin_shell_mobile_nav_hint:\s*"([^"]*)"/)?.[1] ?? "";

    expect(hint).toMatch(/Ctrl\+K/);

    expect(hint).not.toMatch(/窄屏/);

  });

});


