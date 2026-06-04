import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第二批 UX · 顶栏徽标 / 命令面板 / 财务枢纽深度 / Ops 引导。 */
describe("admin batch2 UX L5 (①)", () => {
  it("shell nav shows pending badges from inbox SSOT", () => {
    const nav = readFileSync(join(componentsAdmin, "AdminShellNavGroup.tsx"), "utf8");
    const badge = readFileSync(join(componentsAdmin, "AdminShellPendingBadge.tsx"), "utf8");
    expect(nav).toContain("AdminShellPendingBadge");
    expect(nav).toContain("data-tt-admin-shell-nav-group-pending");
    expect(badge).toContain("admin_shell_nav_pending_aria");
  });

  it("command palette bus + shell trigger", () => {
    const bus = readFileSync(join(__dir, "adminCommandPaletteBus.ts"), "utf8");
    const palette = readFileSync(join(componentsAdmin, "AdminCommandPalette.tsx"), "utf8");
    const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
    expect(bus).toContain("ADMIN_COMMAND_PALETTE_OPEN_EVENT");
    expect(palette).toContain("ADMIN_COMMAND_PALETTE_OPEN_EVENT");
    expect(bar).toContain("data-tt-admin-command-palette-trigger");
    expect(bar).toContain("requestAdminCommandPaletteOpen");
  });

  it("finance suite hub inline depth section", () => {
    const section = readFileSync(join(componentsAdmin, "AdminFinanceSuiteHubDepthSection.tsx"), "utf8");
    const main = readFileSync(join(fe, "app", "admin", "finance-suite", "AdminFinanceSuitePageMain.tsx"), "utf8");
    expect(section).toContain("data-tt-admin-fin-suite-hub-depth");
    expect(main).toContain("AdminFinanceSuiteHubDepthSection");
  });

  it("home ops role guide for users without approve", () => {
    const guide = readFileSync(join(componentsAdmin, "AdminHomeOpsRoleGuide.tsx"), "utf8");
    const maintainer = readFileSync(join(componentsAdmin, "AdminHomeMaintainerFold.tsx"), "utf8");
    expect(guide).toContain("data-tt-admin-home-ops-role-guide");
    expect(maintainer).toContain("AdminHomeOpsRoleGuide");
  });

  it("unified inbox scope honesty + all-clear empty state", () => {
    const inbox = readFileSync(join(fe, "app", "admin", "inbox", "AdminUnifiedInboxPageMain.tsx"), "utf8");
    expect(inbox).toContain("data-tt-admin-unified-inbox-scope-honesty");
    expect(inbox).toContain("admin_unified_inbox_all_clear");
    expect(inbox).toContain("AdminListPageEmptyState");
  });
});
