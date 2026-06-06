import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

const CONFIG_PLATFORM_LIST_PAGES = [
  "app/admin/flags/page.tsx",
  "app/admin/policies/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/lifecycle/page.tsx",
  "app/admin/api-versions/page.tsx",
  "app/admin/config/releases/page.tsx",
  "app/admin/secrets/metadata/page.tsx",
  "app/admin/scheduler/jobs/page.tsx",
  "app/admin/tenants/scopes/page.tsx",
  "app/admin/internal-tools/audits/page.tsx",
  "app/admin/media/signed-url-tokens/page.tsx",
  "app/admin/media/access-logs/page.tsx",
] as const;

/** ① 第四十三批 UX · 配置子页 subnav + auth-audit 筛选 SSOT。 */
describe("admin batch43 UX L5 (①)", () => {
  it("config platform list routes use AdminConfigPlatformPageShell", () => {
    for (const rel of CONFIG_PLATFORM_LIST_PAGES) {
      expect(readFileSync(join(fe, rel), "utf8"), rel).toContain("AdminConfigPlatformPageShell");
    }
  });

  it("subnav SSOT exposes folded related maintainer links", () => {
    const model = readFileSync(join(fe, "app/admin/config/adminConfigHubPageModel.ts"), "utf8");
    const subnav = readFileSync(join(fe, "components/admin/AdminConfigPlatformSubnav.tsx"), "utf8");
    expect(model).toContain("CONFIG_PLATFORM_SUBNAV_LINKS");
    expect(subnav).toContain('data-tt-admin-config-platform-subnav-fold="1"');
    expect(model).toContain("/admin/scheduler/jobs");
    expect(model).toContain("/admin/media/access-logs");
    expect(subnav).toContain("CONFIG_PLATFORM_SUBNAV_LINKS");
  });

  it("maintainer list pages slim header without redundant inbox aside", () => {
    for (const rel of [
      "app/admin/flags/AdminFlagsPageMain.tsx",
      "app/admin/jobs/AdminJobsPageMain.tsx",
      "app/admin/media/signed-url-tokens/AdminMediaSignedUrlTokensPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      if (rel.includes("media/signed-url-tokens")) {
        expect(src, rel).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
      } else {
        expect(src, rel).toContain("AdminInboxQueueBackLinks");
      }
      expect(src, rel).not.toContain("AdminConfigPlatformBackLinks");
    }
  });

  it("auth audit filters use ADMIN_FILTER_* SSOT", () => {
    const main = readFileSync(
      join(fe, "app/admin/auth-audit-events/AdminAuthAuditEventsPageMain.tsx"),
      "utf8",
    );
    expect(main).toContain("ADMIN_FILTER_FIELD_LABEL_CLASS");
    expect(main).toContain("ADMIN_FILTER_GRID_CLASS");
    expect(main).toContain("ADMIN_FILTER_HINT_CLASS");
    expect(main).toContain("ADMIN_FILTER_ACTIONS_CLASS");
    expect(main).not.toContain("block text-meta text-ink-600");
  });
});
