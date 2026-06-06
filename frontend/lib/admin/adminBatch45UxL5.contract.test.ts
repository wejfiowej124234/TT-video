import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十五批 UX · 配置/合规枢纽 slim header + 折叠交叉入口。 */
describe("admin batch45 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch45 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch45UxL5.contract.test.ts");
  });

  it("config hub drops platform header link wall for related fold nav", () => {
    const main = readFileSync(join(fe, "app/admin/config/AdminConfigHubPageMain.tsx"), "utf8");
    const model = readFileSync(join(fe, "app/admin/config/adminConfigHubPageModel.ts"), "utf8");
    expect(main).toContain("AdminPlatformHubRelatedNav");
    expect(main).toContain("CONFIG_HUB_RELATED_FOLD_LINKS");
    expect(main).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(main).not.toContain("AdminPlatformHubHeaderLinks");
    expect(model).toContain("CONFIG_HUB_RELATED_FOLD_LINKS");
    expect(model).toContain("COMPLIANCE_HUB_RELATED_FOLD_LINKS");
  });

  it("compliance hub drops platform header link wall for related fold nav", () => {
    const main = readFileSync(join(fe, "app/admin/compliance/AdminComplianceHubPageMain.tsx"), "utf8");
    expect(main).toContain("AdminPlatformHubRelatedNav");
    expect(main).toContain("COMPLIANCE_HUB_RELATED_FOLD_LINKS");
    expect(main).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(main).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("AdminPlatformHubRelatedNav SSOT exposes breadcrumb + fold data attrs", () => {
    const nav = readFileSync(join(fe, "components/admin/AdminPlatformHubRelatedNav.tsx"), "utf8");
    expect(nav).toContain("data-tt-admin-platform-hub-related-nav");
    expect(nav).toContain("data-tt-admin-platform-hub-related-fold");
    expect(nav).toContain("ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS");
  });

  it("i18n keys exist for config and compliance hub related folds", () => {
    const zh = readFileSync(join(fe, "locales/zh.ts"), "utf8");
    const en = readFileSync(join(fe, "locales/en.ts"), "utf8");
    for (const key of [
      "admin_config_hub_related_aria",
      "admin_config_hub_related_fold",
      "admin_compliance_hub_related_aria",
      "admin_compliance_hub_related_fold",
    ]) {
      expect(zh).toContain(key);
      expect(en).toContain(key);
    }
  });
});
