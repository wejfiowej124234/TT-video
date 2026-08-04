import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { ADMIN_SHELL_MORE_NAV_LINKS } from "./adminShellMoreNavLinks";
import { ADMIN_SHELL_ONBOARDING_NAV_LINKS } from "./adminShellOnboardingNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 顶栏/侧栏 Inbox Focus 对拍：壳枢纽 · 深队列在 SSOT 模块。 */
describe("admin shell nav parity L5 (① · Inbox Focus)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");

  const sidebarOnboarding =
    ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding")?.links.map((l) => l.href) ?? [];

  it("deep queue hrefs live in onboarding SSOT · sidebar is hub-only", () => {
    const ssot = ADMIN_SHELL_ONBOARDING_NAV_LINKS.map((l) => l.href);
    expect(ssot).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(ssot).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(ssot).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(sidebarOnboarding).toEqual(["/admin/onboarding"]);
    expect(ADMIN_SHELL_SIDEBAR_GROUPS.some((g) => g.id === "community")).toBe(false);
  });

  it("AdminShellBar references slim sidebar groups · no status-query deep shellNav", () => {
    expect(bar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(bar).not.toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(bar).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(bar).not.toMatch(/shellNav\(\s*["']\/admin\/provider-applications\?status=/);
    expect(bar).not.toMatch(/shellNav\(\s*["']\/admin\/community\/reports\?status=/);
  });

  it("sidebar more group is hub-trimmed · MORE_NAV_LINKS remains full SSOT for hubs", () => {
    const more = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "more");
    const sidebarHrefs = more?.links.map((l) => l.href) ?? [];
    expect(sidebarHrefs).toContain("/admin/finance-suite");
    expect(sidebarHrefs).toContain("/admin/config");
    expect(sidebarHrefs.length).toBeLessThanOrEqual(4);
    expect(ADMIN_SHELL_MORE_NAV_LINKS.length).toBeGreaterThan(6);
    expect(ADMIN_SHELL_MORE_NAV_LINKS.map((l) => l.href)).toContain("/admin/observability");
    expect(bar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
  });
});
