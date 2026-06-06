import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import {
  ADMIN_ROUTE_PREFETCH_PRIMARY,
  ADMIN_ROUTE_PREFETCH_SECONDARY,
} from "./adminRoutePrefetchPaths";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin route prefetch paths (①)", () => {
  it("primary queue hrefs match ADMIN_INBOX_QUEUE_HREFS", () => {
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain("/admin");
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain("/admin/inbox");
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(ADMIN_ROUTE_PREFETCH_PRIMARY).toContain(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("shell mounts AdminRoutePrefetcher", () => {
    const shell = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminCapabilitiesShell.tsx"), "utf8");
    expect(shell).toContain("AdminRoutePrefetcher");
  });

  it("sidebar links prefetch via adminShellLinkPrefetchProps", () => {
    const sidebar = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminShellSidebar.tsx"), "utf8");
    expect(sidebar).toContain("adminShellLinkPrefetchProps");
    expect(readFileSync(join(__dir, "adminShellPrefetchHref.ts"), "utf8")).toContain("prefetch");
  });

  it("queue routes expose AdminRouteLoadingBoundary shells", () => {
    const fe = join(__dir, "..", "..", "app", "admin");
    for (const segment of [
      "provider-applications",
      "steward-applications",
      "onboarding",
      "inbox",
    ]) {
      const src = readFileSync(join(fe, segment, "loading.tsx"), "utf8");
      expect(src).toContain("AdminRouteLoadingBoundary");
    }
  });

  it("warm-dev-routes includes admin queue paths", () => {
    const warm = readFileSync(join(__dir, "..", "..", "scripts", "warm-dev-routes.mjs"), "utf8");
    expect(warm).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(warm).toContain("/admin/onboarding");
    expect(ADMIN_ROUTE_PREFETCH_SECONDARY.length).toBeGreaterThan(0);
  });
});
