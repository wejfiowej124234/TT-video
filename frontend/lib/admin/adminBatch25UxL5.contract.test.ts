import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_SHELL_COMMUNITY_EXTRA_LINKS } from "./adminShellCommunityNav";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "./adminShellSidebarModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第二十五批 UX · Shell/首页降噪 + 侧栏社区深度 + 预览诚实。 */
describe("admin batch25 UX L5 (①)", () => {
  const bar = readFileSync(join(componentsAdmin, "AdminShellBar.tsx"), "utf8");
  const sidebar = readFileSync(join(componentsAdmin, "AdminShellSidebar.tsx"), "utf8");
  const home = readFileSync(join(componentsAdmin, "AdminHomeClient.tsx"), "utf8");
  const preview = readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8");
  const domainHealth = readFileSync(join(componentsAdmin, "AdminHomeDomainHealthStrip.tsx"), "utf8");
  const shellCtx = readFileSync(join(__dir, "adminShellContextForPath.ts"), "utf8");

  it("top bar collapses nav groups on lg when sidebar layout active", () => {
    expect(bar).toContain("data-tt-admin-shell-top-nav-groups");
    expect(bar).toContain("sidebarLayoutActive ? \"lg:hidden\"");
  });

  it("permissions removed from onboarding top-nav group", () => {
    expect(bar).not.toContain('shellNav("/admin/permissions"');
  });

  it("preview role badge hidden on shell bar (homepage banner SSOT)", () => {
    expect(bar).not.toContain("data-tt-admin-shell-preview-active");
    expect(preview).toContain("data-tt-admin-home-shell-preview-readonly");
  });

  it("home drops prominent duplicate module search card", () => {
    expect(home).not.toContain("AdminHomeCardSearch");
    expect(home).toContain("admin_home_command_palette_hint");
  });

  it("sidebar expands community depth and shows domain hint + read tier badge", () => {
    const community = ADMIN_SHELL_SIDEBAR_GROUPS.find((g) => g.id === "community");
    expect(community?.links.length).toBeGreaterThanOrEqual(7);
    expect(community?.links.some((l) => l.labelKey === "admin_shell_nav_community_hub")).toBe(true);
    expect(community?.links.some((l) => l.href === ADMIN_SHELL_COMMUNITY_EXTRA_LINKS[0]?.href)).toBe(
      true,
    );
    expect(sidebar).toContain("data-tt-admin-shell-sidebar-domain-hint");
    expect(sidebar).toContain("adminHomeCardTierForHref");
    expect(sidebar).toContain("data-tt-admin-shell-kpi-badge");
  });

  it("permissions shell context mapped to more domain", () => {
    expect(shellCtx).toContain('prefix: "/admin/permissions", groupId: "more"');
  });

  it("domain health strip exposes neutral tone legend", () => {
    expect(domainHealth).toContain("data-tt-admin-domain-health-legend");
    expect(domainHealth).toContain("admin_home_domain_health_legend");
  });
});
