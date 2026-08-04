import { CONFIG_HUB_LINKS } from "@/app/admin/config/adminConfigHubPageModel";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_COMMUNITY_NAV_LINKS } from "./adminShellCommunityNavLinks";
import { ADMIN_SHELL_FINANCE_NAV_LINKS } from "./adminShellFinanceNavLinks";
import { ADMIN_SHELL_GOVERNANCE_NAV_LINKS } from "./adminShellGovernanceNavLinks";
import { ADMIN_SHELL_MORE_NAV_LINKS } from "./adminShellMoreNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① Inbox Focus：深分组 SSOT 仍在专属模块；发布壳仅 slim groups。 */
describe("admin shell nav groups SSOT (① · Inbox Focus)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");

  function sidebarHrefs(groupId: string): string[] {
    return ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === groupId)?.links.map((l) => l.href) ?? [];
  }

  it("finance deep SSOT retained · not mounted as persistent sidebar group", () => {
    expect(sidebarHrefs("finance")).toEqual([]);
    expect(ADMIN_SHELL_FINANCE_NAV_LINKS.map((l) => l.href)).toContain("/admin/indexer");
    expect(ADMIN_SHELL_FINANCE_NAV_LINKS.map((l) => l.href)).toContain("/admin/region-vault");
    expect(ADMIN_SHELL_FINANCE_NAV_LINKS.length).toBeGreaterThanOrEqual(8);
    expect(bar).toContain("/admin/finance-suite");
  });

  it("governance deep SSOT retained (trust-growth)", () => {
    expect(ADMIN_SHELL_GOVERNANCE_NAV_LINKS.map((l) => l.href)).toContain("/admin/trust-growth");
    expect(ADMIN_SHELL_GOVERNANCE_NAV_LINKS).toHaveLength(4);
  });

  it("community deep SSOT includes abuse-policy · not a publish sidebar group", () => {
    expect(sidebarHrefs("community")).toEqual([]);
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS.map((l) => l.href)).toContain(
      "/admin/community/abuse-policy",
    );
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS.length).toBeGreaterThanOrEqual(9);
  });

  it("more sidebar is hub-trimmed · config hub deep links stay in MORE/config SSOT", () => {
    const hrefs = sidebarHrefs("more");
    expect(hrefs).toContain("/admin/config");
    expect(hrefs).toContain("/admin/finance-suite");
    expect(hrefs).not.toContain("/admin/observability");
    expect(CONFIG_HUB_LINKS.length).toBeGreaterThan(0);
    expect(ADMIN_SHELL_MORE_NAV_LINKS.map((l) => l.href)).toContain("/admin/observability");
    expect(ADMIN_SHELL_MORE_NAV_LINKS.length).toBeGreaterThan(6);
  });

  it("AdminShellBar maps slim ADMIN_SHELL_SIDEBAR_GROUPS only", () => {
    expect(bar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(bar).not.toContain("ADMIN_SHELL_FINANCE_NAV_LINKS");
    expect(bar).not.toContain("ADMIN_SHELL_GOVERNANCE_NAV_LINKS");
    expect(bar).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(bar).not.toContain("ADMIN_SHELL_OPERATIONS_NAV_LINKS");
  });
});
