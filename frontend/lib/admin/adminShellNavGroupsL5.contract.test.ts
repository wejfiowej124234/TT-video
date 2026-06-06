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

/** ① 全分组侧栏 / 顶栏 / 枢纽页并集对拍。 */
describe("admin shell nav groups SSOT (①)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");

  function sidebarHrefs(groupId: string): string[] {
    return ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === groupId)?.links.map((l) => l.href) ?? [];
  }

  it("finance sidebar includes suite supplements missing before", () => {
    const hrefs = sidebarHrefs("finance");
    expect(hrefs).toContain("/admin/indexer");
    expect(hrefs).toContain("/admin/region-vault");
    expect(hrefs).toContain("/admin/alerts/incidents");
    expect(ADMIN_SHELL_FINANCE_NAV_LINKS.length).toBeGreaterThanOrEqual(8);
  });

  it("governance sidebar includes trust-growth", () => {
    expect(sidebarHrefs("governance")).toContain("/admin/trust-growth");
    expect(ADMIN_SHELL_GOVERNANCE_NAV_LINKS).toHaveLength(3);
  });

  it("community sidebar includes abuse-policy", () => {
    expect(sidebarHrefs("community")).toContain("/admin/community/abuse-policy");
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS.length).toBeGreaterThanOrEqual(9);
  });

  it("more sidebar includes config hub sub-pages and compliance requests", () => {
    const hrefs = sidebarHrefs("more");
    expect(hrefs).toContain("/admin/compliance/requests");
    for (const { href } of CONFIG_HUB_LINKS) {
      expect(hrefs).toContain(href);
    }
    expect(ADMIN_SHELL_MORE_NAV_LINKS.length).toBeGreaterThan(6);
  });

  it("AdminShellBar maps all group SSOT arrays", () => {
    expect(bar).toContain("ADMIN_SHELL_FINANCE_NAV_LINKS");
    expect(bar).toContain("ADMIN_SHELL_GOVERNANCE_NAV_LINKS");
    expect(bar).toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(bar).toContain("ADMIN_SHELL_OPERATIONS_NAV_LINKS");
    expect(bar).toContain("adminShellNavLinkMatch");
  });
});
