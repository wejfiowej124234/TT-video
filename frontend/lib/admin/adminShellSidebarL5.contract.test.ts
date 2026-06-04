import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";
import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** U2 · 侧栏与顶栏队列 href SSOT 对拍。 */
describe("admin shell sidebar L5 (① · U2)", () => {
  const sidebar = readFileSync(join(fe, "components", "admin", "AdminShellSidebar.tsx"), "utf8");
  const model = readFileSync(join(__dir, "adminShellSidebarModel.ts"), "utf8");

  it("sidebar model imports queue SSOT for onboarding + community links", () => {
    expect(model).toContain("ADMIN_INBOX_QUEUE_HREFS");
    expect(model).not.toContain("?status=submitted");
    expect(model).not.toContain("?status=pending");
    expect(model).not.toContain("?status=open");
  });

  it("onboarding + community sidebar groups use inbox queue hrefs", () => {
    const onboarding = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding");
    const community = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "community");
    const onboardingHrefs = onboarding?.links.map((l) => l.href) ?? [];
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(community?.links[0]?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("AdminShellSidebar mounts ADMIN_SHELL_SIDEBAR_GROUPS", () => {
    expect(sidebar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(sidebar).toContain("data-tt-admin-shell-sidebar");
    expect(sidebar).toContain("useAdminHomeInbox");
    expect(sidebar).toContain("AdminShellPendingBadge");
    expect(sidebar).toContain('legacyMarker="sidebar"');
  });
});
