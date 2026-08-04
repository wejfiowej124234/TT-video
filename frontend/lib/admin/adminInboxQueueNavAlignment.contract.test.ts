import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { ADMIN_SHELL_COMMUNITY_NAV_LINKS } from "./adminShellCommunityNavLinks";
import { ADMIN_SHELL_ONBOARDING_NAV_LINKS } from "./adminShellOnboardingNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/**
 * Inbox Focus IA · 队列 href SSOT 对拍（①）。
 * 持久壳仅枢纽；深队列在 inbox / hub / related-links — 非侧栏深链回流。
 */
describe("admin inbox queue nav alignment (① · Inbox Focus)", () => {
  const shell = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
  const sidebarModel = readFileSync(join(__dir, "adminShellSidebarModel.ts"), "utf8");
  const related = readFileSync(
    join(fe, "components", "admin", "AdminCommunityRelatedLinks.tsx"),
    "utf8",
  );
  const onboardingHub = readFileSync(
    join(fe, "app", "admin", "onboarding", "adminOnboardingHubPageModel.ts"),
    "utf8",
  );

  it("queue href SSOT modules cover onboarding + community leaves", () => {
    const onboardingHrefs = ADMIN_SHELL_ONBOARDING_NAV_LINKS.map((l) => l.href);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS[0]?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("publish shell mounts slim ADMIN_SHELL_SIDEBAR_GROUPS (hubs, not deep queue arrays)", () => {
    expect(shell).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(shell).not.toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(shell).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(shell).not.toMatch(/shellNav\(\s*["']\/admin\/provider-applications\?status=/);
    expect(shell).not.toMatch(/shellNav\(\s*["']\/admin\/community\/reports\?status=/);
  });

  it("sidebar model is hub-first · no deep onboarding/community nav array imports", () => {
    expect(sidebarModel).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(sidebarModel).toContain("/admin/onboarding");
    expect(sidebarModel).toContain("/admin/inbox");
    expect(sidebarModel).not.toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(sidebarModel).not.toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    expect(sidebarModel).not.toContain("?status=submitted");
    expect(sidebarModel).not.toContain("?status=pending");
    expect(sidebarModel).not.toContain("?status=open");
    const onboarding = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding");
    expect(onboarding?.links.map((l) => l.href)).toEqual(["/admin/onboarding"]);
    expect(ADMIN_SHELL_SIDEBAR_GROUPS.some((g) => g.id === "community")).toBe(false);
  });

  it("deep community queues stay on hub/related surfaces (G084 bounded)", () => {
    expect(onboardingHub).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(related).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    expect(related).toContain("/admin/community/appeals");
    expect(related).toContain("/admin/audit/operations");
    expect(related).toContain('data-tt-admin-community-bounded-honesty="1"');
  });
});
