import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { ADMIN_SHELL_MORE_NAV_LINKS } from "./adminShellMoreNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 顶栏 AdminShellBar 与持久侧栏 onboarding/community 队列 href 对拍。 */
describe("admin shell nav parity L5 (① · U2)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");

  const sidebarOnboarding =
    ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding")?.links.map((l) => l.href) ?? [];
  const sidebarCommunity =
    ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "community")?.links.map((l) => l.href) ?? [];

  it("sidebar onboarding + community first link match inbox SSOT", () => {
    expect(sidebarOnboarding).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(sidebarOnboarding).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(sidebarOnboarding).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(sidebarOnboarding).toContain("/admin/onboarding/payment-events");
    expect(sidebarCommunity[0]).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("AdminShellBar references onboarding + community nav SSOT", () => {
    expect(bar).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(bar).toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(bar).not.toMatch(/shellNav\(\s*["']\/admin\/provider-applications\?status=/);
    expect(bar).not.toMatch(/shellNav\(\s*["']\/admin\/community\/reports\?status=/);
  });

  it("sidebar more group matches ADMIN_SHELL_MORE_NAV_LINKS SSOT", () => {
    const more = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "more");
    const sidebarHrefs = more?.links.map((l) => l.href) ?? [];
    for (const { href } of ADMIN_SHELL_MORE_NAV_LINKS) {
      expect(sidebarHrefs).toContain(href);
    }
    expect(bar).toContain("ADMIN_SHELL_MORE_NAV_LINKS");
  });
});
