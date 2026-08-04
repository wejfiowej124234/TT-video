import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** U2 · Inbox Focus 发布侧栏：≤5 组 · 枢纽叶子 · 无深队列回流。 */
describe("admin shell sidebar L5 (① · Inbox Focus)", () => {
  const sidebar = readFileSync(join(fe, "components", "admin", "AdminShellSidebar.tsx"), "utf8");
  const model = readFileSync(join(__dir, "adminShellSidebarModel.ts"), "utf8");

  it("sidebar model is slim publish IA (hubs only · no deep nav SSOT imports)", () => {
    expect(ADMIN_SHELL_SIDEBAR_GROUPS.length).toBeLessThanOrEqual(5);
    const leafCount = ADMIN_SHELL_SIDEBAR_GROUPS.reduce((n, g) => n + g.links.length, 0);
    expect(leafCount).toBeLessThanOrEqual(12);
    expect(model).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(model).not.toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(model).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(model).not.toContain("ADMIN_SHELL_FINANCE_NAV_LINKS");
    expect(model).not.toContain("?status=submitted");
    expect(model).not.toContain("?status=pending");
    expect(model).not.toContain("?status=open");
  });

  it("onboarding + content groups are hub leaves · finance demoted from persistent shell", () => {
    const onboarding = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding");
    const content = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "content");
    expect(onboarding?.links.map((l) => l.href)).toEqual(["/admin/onboarding"]);
    expect(content?.links.some((l) => l.href === "/admin/content")).toBe(true);
    expect(ADMIN_SHELL_SIDEBAR_GROUPS.some((g) => g.id === "finance")).toBe(false);
    expect(ADMIN_SHELL_SIDEBAR_GROUPS.some((g) => g.id === "community")).toBe(false);
  });

  it("AdminShellSidebar mounts ADMIN_SHELL_SIDEBAR_GROUPS + fold/pending honesty", () => {
    expect(sidebar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(sidebar).toContain("data-tt-admin-shell-sidebar");
    expect(sidebar).toContain("useAdminHomeInbox");
    expect(sidebar).toContain("AdminShellPendingBadge");
    expect(sidebar).toContain('legacyMarker="sidebar"');
    expect(sidebar).toContain("adminShellNavGroupDefaultOpen");
    expect(sidebar).toContain("data-tt-admin-shell-sidebar-fold");
    expect(sidebar).toContain("ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT");
    expect(sidebar).toContain("data-tt-admin-shell-sidebar-group-pending");
  });
});
