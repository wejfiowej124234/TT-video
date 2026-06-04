import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第十四批 UX · Shell 徽标降噪 / 首页待办去重 / 预览横幅紧凑。 */
describe("admin batch14 UX L5 (①)", () => {
  const policy = readFileSync(join(__dir, "adminShellPendingBadgePolicy.ts"), "utf8");
  const badge = readFileSync(join(componentsAdmin, "AdminShellPendingBadge.tsx"), "utf8");
  const navGroup = readFileSync(join(componentsAdmin, "AdminShellNavGroup.tsx"), "utf8");
  const sidebar = readFileSync(join(componentsAdmin, "AdminShellSidebar.tsx"), "utf8");
  const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
  const inbox = readFileSync(join(componentsAdmin, "AdminHomeInboxStrip.tsx"), "utf8");
  const preview = readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8");
  const hook = readFileSync(join(__dir, "useAdminShellSidebarVisible.ts"), "utf8");

  it("defines shell pending badge policy SSOT", () => {
    expect(policy).toContain("adminShellPendingBadgeVisible");
    expect(policy).toContain("adminShellNavGroupPendingRollup");
    expect(policy).toContain("top_inbox_hub");
    expect(policy).toContain("sidebar_queue_leaf");
  });

  it("shell surfaces wire policy + sidebar layout hook", () => {
    expect(hook).toContain("ADMIN_SHELL_SIDEBAR_LAYOUT_MEDIA");
    expect(badge).toContain("adminShellPendingBadgeVisible");
    expect(navGroup).toContain("useAdminShellSidebarVisible");
    expect(navGroup).toContain("AdminShellPendingBadge");
    expect(navGroup).toContain("data-tt-admin-shell-nav-group-pending");
    expect(sidebar).toContain("sidebarBadgePlacement");
    expect(bar).toContain('placement="top_inbox_hub"');
  });

  it("home inbox strip drops duplicate total badge header", () => {
    expect(inbox).not.toContain("ADMIN_INBOX_PENDING_BADGE_CLASS");
    expect(inbox).not.toContain("admin_home_inbox_total_pending");
    expect(inbox).toContain("data-tt-admin-home-inbox-unified-link");
  });

  it("shell preview banner is compact without maintainer prep cmd block", () => {
    expect(preview).toContain("sm:flex-row sm:items-center");
    expect(preview).not.toContain("admin_home_shell_preview_banner_prep_cmd");
    expect(preview).not.toContain("ADMIN_ADM_U01_SHELL_PREP_FLOWS");
  });
});
