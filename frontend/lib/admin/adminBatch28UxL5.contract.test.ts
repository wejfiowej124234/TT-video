import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 第二十八批 UX · 顶栏/侧栏标签与深度对齐 + 侧栏 tier badge。 */
describe("admin batch28 UX L5 (①)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
  const sidebar = readFileSync(join(fe, "components", "admin", "AdminShellSidebar.tsx"), "utf8");
  const finance = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "finance");

  it("top bar community queue uses community hub label SSOT", () => {
    const communityNav = readFileSync(join(__dir, "adminShellCommunityNavLinks.ts"), "utf8");
    expect(bar).toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(communityNav).toContain('"admin_shell_nav_community_hub"');
    expect(communityNav).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    expect(communityNav).not.toContain('"admin_community_reports_title"');
  });

  it("sidebar finance group expands beyond suite + reconciliation", () => {
    const hrefs = finance?.links.map((l) => l.href) ?? [];
    expect(hrefs).toContain("/admin/finance");
    expect(hrefs).toContain("/admin/fee-router");
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
  });

  it("sidebar tier badges gated by adminShellUxPolicy (pending badges only by default)", () => {
    expect(sidebar).toContain("adminShellLinkTierBadgeVisible");
    expect(sidebar).toContain("sidebarTierBadgeClass");
  });
});
