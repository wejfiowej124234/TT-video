import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① Batch A · 数据 freshness + capabilities 失败最小侧栏（ADM-P0-02 / P1-01～03）。 */
describe("admin batch A data freshness L5 (①)", () => {
  const sidebar = readFileSync(join(componentsAdmin, "AdminShellSidebar.tsx"), "utf8");
  const navGroup = readFileSync(join(componentsAdmin, "AdminShellNavGroup.tsx"), "utf8");
  const invalidator = readFileSync(join(componentsAdmin, "AdminListFetchCacheInvalidator.tsx"), "utf8");
  const confirmState = readFileSync(join(__dir, "useAdminL5ConfirmState.ts"), "utf8");
  const queueFetch = readFileSync(join(__dir, "fetchAdminQueueList.ts"), "utf8");
  const inbox = readFileSync(join(__dir, "useAdminHomeInbox.ts"), "utf8");
  const permissions = readFileSync(
    join(fe, "app", "admin", "permissions", "useAdminPermissionsPage.ts"),
    "utf8",
  );

  it("defines capabilities failure nav SSOT", () => {
    const policy = readFileSync(join(__dir, "adminShellCapabilitiesFailureNav.ts"), "utf8");
    expect(policy).toContain("ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS");
    expect(policy).toContain("/admin/permissions");
    expect(policy).toContain("filterAdminShellLinksForCapabilitiesFailure");
  });

  it("sidebar and top nav filter links when capabilities unavailable", () => {
    expect(sidebar).toContain("filterAdminShellLinksForCapabilitiesFailure");
    expect(sidebar).toContain("data-tt-admin-shell-sidebar-capabilities-failure");
    expect(sidebar).not.toMatch(/capabilitiesUnavailable\) return true/);
    expect(navGroup).toContain("filterAdminShellLinksForCapabilitiesFailure");
    expect(navGroup).not.toMatch(/capabilitiesUnavailable\s*\?\s*links/);
  });

  it("auth-change resets boot latch, prefetch, and caches", () => {
    const authReset = readFileSync(join(__dir, "adminAuthSessionReset.ts"), "utf8");
    expect(invalidator).toContain("resetAdminAuthSessionState");
    expect(authReset).toContain("resetAdminCapabilitiesBootState");
    expect(authReset).toContain("resetAdminRoutePrefetchSession");
    expect(authReset).toContain("invalidateAdminListFetchCache");
    expect(authReset).toContain("ADMIN_AUTH_SESSION_RESET_EVENT");
  });

  it("L5 confirm and permissions assign invalidate caches after write", () => {
    expect(confirmState).toContain("invalidateAdminCachesAfterWrite");
    expect(permissions).toContain("invalidateAdminCachesAfterWrite");
  });

  it("home inbox shares list SWR cache with queue list fetch", () => {
    expect(inbox).toContain("adminInboxQueueListFetchConfig");
    expect(inbox).toContain("ADMIN_DATA_MUTATED_EVENT");
    expect(queueFetch).toContain("readAdminListFetchCache");
    expect(queueFetch).toContain("writeAdminListFetchCache");
    expect(queueFetch).toContain("dedupeAdminListFetch");
  });
});
