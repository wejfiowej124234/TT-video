import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import {
  ADMIN_ONBOARDING_HUB_PAGE_LINKS,
  ADMIN_SHELL_ONBOARDING_NAV_LINKS,
} from "./adminShellOnboardingNavLinks";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 入驻组 · Inbox Focus：深链在 hub SSOT；壳仅 /admin/onboarding 枢纽。 */
describe("admin shell onboarding nav SSOT (① · Inbox Focus)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
  const hubModel = readFileSync(
    join(fe, "app", "admin", "onboarding", "adminOnboardingHubPageModel.ts"),
    "utf8",
  );

  const sidebarOnboarding =
    ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding")?.links.map((l) => l.href) ?? [];

  it("onboarding SSOT retains queue + sub-routes for hub surfaces", () => {
    expect(ADMIN_SHELL_ONBOARDING_NAV_LINKS.length).toBeGreaterThanOrEqual(7);
    const ssotHrefs = ADMIN_SHELL_ONBOARDING_NAV_LINKS.map((l) => l.href);
    expect(ssotHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(ssotHrefs).not.toContain("/admin/onboarding/payment-events");
    expect(ssotHrefs).toContain("/admin/onboarding/webhook-jobs");
    expect(ssotHrefs).toContain("/admin/onboarding/compliance-audit");
  });

  it("publish sidebar onboarding is hub-only (deep queues not in shell)", () => {
    expect(sidebarOnboarding).toEqual(["/admin/onboarding"]);
    expect(sidebarOnboarding).not.toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
  });

  it("hub page cards cover all onboarding sub-nav paths", () => {
    const hubCardHrefs = ADMIN_ONBOARDING_HUB_PAGE_LINKS.map((l) => l.href);
    for (const { href } of ADMIN_SHELL_ONBOARDING_NAV_LINKS) {
      if (!href.startsWith("/admin/onboarding/")) continue;
      expect(hubCardHrefs).toContain(href);
    }
  });

  it("AdminShellBar mounts slim groups · hub model re-exports deep SSOT", () => {
    expect(bar).toContain("ADMIN_SHELL_SIDEBAR_GROUPS");
    expect(bar).not.toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(hubModel).toContain("ADMIN_ONBOARDING_HUB_PAGE_LINKS");
    expect(hubModel).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(hubModel).toContain("ONBOARDING_HUB_LINKS");
  });
});
