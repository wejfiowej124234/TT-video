import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 第四十四批 UX · 配置发布详情 subnav + 详情字段 SSOT。 */
describe("admin batch44 UX L5 (①)", () => {
  it("config release detail uses platform subnav parent trail and slim inbox header", () => {
    const main = readFileSync(
      join(fe, "app/admin/config/releases/[id]/AdminConfigReleaseDetailPageMain.tsx"),
      "utf8",
    );
    expect(main).toContain("AdminConfigPlatformSubnav");
    expect(main).toContain('labelKey: "admin_config_releases_title"');
    expect(main).toContain("releasesListHref");
    expect(main).not.toContain("AdminInboxQueueBackLinks");
    expect(main).not.toContain("AdminConfigPlatformBackLinks");
  });

  it("platform subnav supports optional parent breadcrumb segment", () => {
    const subnav = readFileSync(join(fe, "components/admin/AdminConfigPlatformSubnav.tsx"), "utf8");
    const shell = readFileSync(join(fe, "components/admin/AdminConfigPlatformPageShell.tsx"), "utf8");
    expect(subnav).toContain("data-tt-admin-config-platform-subnav-parent");
    expect(shell).toContain("parent?: { href: string; labelKey: string }");
  });

  it("release detail panel uses detail field row + mono SSOT", () => {
    const main = readFileSync(
      join(fe, "app/admin/config/releases/[id]/AdminConfigReleaseDetailPageMain.tsx"),
      "utf8",
    );
    expect(main).toContain("ADMIN_DETAIL_FIELD_ROW_CLASS");
    expect(main).toContain("ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS");
    expect(main).toContain("ADMIN_DETAIL_FIELD_LABEL_CLASS");
    expect(main).toContain('data-tt-admin-config-release-detail-panel="1"');
  });
});
