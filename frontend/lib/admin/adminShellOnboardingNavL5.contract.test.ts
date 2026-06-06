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

/** ① 入驻组 · 侧栏 / 顶栏 / 枢纽页 SSOT 对拍。 */
describe("admin shell onboarding nav SSOT (①)", () => {
  const bar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
  const hubModel = readFileSync(
    join(fe, "app", "admin", "onboarding", "adminOnboardingHubPageModel.ts"),
    "utf8",
  );

  const sidebarOnboarding =
    ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "onboarding")?.links.map((l) => l.href) ?? [];

  it("sidebar onboarding includes hub sub-routes from SSOT", () => {
    expect(ADMIN_SHELL_ONBOARDING_NAV_LINKS.length).toBeGreaterThanOrEqual(8);
    for (const { href } of ADMIN_SHELL_ONBOARDING_NAV_LINKS) {
      expect(sidebarOnboarding).toContain(href);
    }
    expect(sidebarOnboarding).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(sidebarOnboarding).toContain("/admin/onboarding/payment-events");
    expect(sidebarOnboarding).toContain("/admin/onboarding/webhook-jobs");
    expect(sidebarOnboarding).toContain("/admin/onboarding/compliance-audit");
  });

  it("hub page cards cover all onboarding sub-nav paths", () => {
    const hubCardHrefs = ADMIN_ONBOARDING_HUB_PAGE_LINKS.map((l) => l.href);
    for (const { href } of ADMIN_SHELL_ONBOARDING_NAV_LINKS) {
      if (!href.startsWith("/admin/onboarding/")) continue;
      expect(hubCardHrefs).toContain(href);
    }
  });

  it("AdminShellBar maps onboarding links from SSOT", () => {
    expect(bar).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(bar).toContain("adminShellOnboardingNavLinkMatch");
  });

  it("hub page model re-exports SSOT hub links", () => {
    expect(hubModel).toContain("ADMIN_ONBOARDING_HUB_PAGE_LINKS");
    expect(hubModel).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(hubModel).toContain("ONBOARDING_HUB_LINKS");
  });
});
