import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第十五批 UX · 能力条降噪 / 首页 CTA 去重 / 统一收件箱 / 列表页 canvas。 */
describe("admin batch15 UX L5 (①)", () => {
  const visibility = readFileSync(join(__dir, "adminCapabilityStripVisibility.ts"), "utf8");
  const capStrip = readFileSync(join(componentsAdmin, "AdminActorCapabilityStrip.tsx"), "utf8");
  const home = readFileSync(join(componentsAdmin, "AdminHomeClient.tsx"), "utf8");
  const inbox = readFileSync(join(fe, "app", "admin", "inbox", "AdminUnifiedInboxPageMain.tsx"), "utf8");
  const listChrome = readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8");
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");

  it("defines capability strip visibility SSOT", () => {
    expect(visibility).toContain("shouldShowAdminCapabilityStrip");
    expect(visibility).toContain("homeInboxFocus");
    expect(visibility).toContain("maintainerUi");
    expect(visibility).toContain("canApprove");
  });

  it("capability strip suppresses healthy approver chrome with sr-only marker", () => {
    expect(capStrip).toContain("shouldShowAdminCapabilityStrip");
    expect(capStrip).toContain("data-tt-admin-capability-strip-suppressed");
    expect(capStrip).toContain("admin_capability_strip_no_approve_short");
  });

  it("home primary CTAs only render when inbox has zero pending", () => {
    expect(home).toContain("inboxPendingTotal === 0");
    expect(home).toContain("data-tt-admin-home-primary-cta-fallback");
  });

  it("unified inbox drops duplicate total line; task cards carry counts", () => {
    expect(inbox).not.toContain("admin_unified_inbox_total");
    expect(inbox).not.toContain("data-tt-admin-unified-inbox-total");
    expect(inbox).toContain("adminHomeKpiMetricDisplay");
  });

  it("list page chrome wraps body in console canvas token", () => {
    expect(adminUi).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(listChrome).toContain("ADMIN_LIST_PAGE_BODY_CANVAS_CLASS");
    expect(listChrome).toContain("data-tt-admin-list-page-body-canvas");
  });
});
