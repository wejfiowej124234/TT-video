import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { shouldShowAdminCapabilityStrip } from "./adminCapabilityStripVisibility";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十五批 UX · 预览 chrome 去重 + 筛选暖卡 + 入驻队列 related fold + 社区筛选人话。 */
describe("admin batch55 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch55 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch55UxL5.contract.test.ts");
  });

  it("shell preview notice defers to capability strip / home banner (no duplicate bar)", () => {
    const notice = readFileSync(join(fe, "components/admin/AdminShellPreviewNotice.tsx"), "utf8");
    const strip = readFileSync(join(fe, "components/admin/AdminActorCapabilityStrip.tsx"), "utf8");
    const policy = readFileSync(join(fe, "lib/admin/adminCapabilityStripVisibility.ts"), "utf8");
    expect(notice).toContain("data-tt-admin-shell-preview-notice-deferred");
    expect(notice).not.toContain("writeAdminShellPreviewRole");
    expect(strip).toContain("homeShellPreviewBannerActive");
    expect(policy).toContain("homeShellPreviewBannerActive");
  });

  it("capability strip hides on workspace when home preview banner is SSOT", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
        loading: false,
        canApprove: true,
        maintainerUi: false,
        shellPreviewActive: true,
        homeShellPreviewBannerActive: true,
      }),
    ).toBe(false);
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
        loading: true,
        canApprove: false,
        maintainerUi: false,
        shellPreviewActive: true,
        homeShellPreviewBannerActive: true,
      }),
    ).toBe(false);
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
        loading: false,
        canApprove: true,
        maintainerUi: false,
        shellPreviewActive: true,
        homeShellPreviewBannerActive: false,
      }),
    ).toBe(true);
  });

  it("workspace boot uses skeleton instead of placeholder workbench cards", () => {
    const home = readFileSync(join(fe, "components/admin/AdminHomeClient.tsx"), "utf8");
    const policy = readFileSync(join(fe, "lib/admin/adminShellUxPolicy.ts"), "utf8");
    expect(policy).toContain("adminWorkspaceBootActive");
    expect(home).toContain("adminWorkspaceBootActive");
    expect(home).toContain('variant="workspace"');
  });

  it("filter card uses warm L5 tint token", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toMatch(/ADMIN_FILTER_CARD_CLASS[\s\S]*border-ref-sun/);
    expect(adminUi).toMatch(/ADMIN_FILTER_CARD_CLASS[\s\S]*bg-ref-sun/);
  });

  it("onboarding queue chrome wires related fold SSOT", () => {
    const chrome = readFileSync(join(fe, "components/admin/AdminQueueListPageChrome.tsx"), "utf8");
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("PROVIDER_QUEUE_RELATED_FOLD_LINKS");
    expect(model).toContain("STEWARD_QUEUE_RELATED_FOLD_LINKS");
    expect(chrome).toContain("AdminOpsDetailRelatedFold");
    expect(chrome).toContain("provider-queue-list");
    expect(chrome).toContain("steward-queue-list");
  });

  it("community reports filter labels humanized (no raw API field names in zh)", () => {
    const zh = readFileSync(join(fe, "locales/zh.ts"), "utf8");
    expect(zh).toContain('admin_community_reports_reporter_id: "举报人 ID"');
    expect(zh).toContain('admin_community_reports_target_type: "目标类型"');
    expect(zh).toContain('admin_community_reports_reason_code: "举报原因码"');
    expect(zh).toContain('admin_reports_modExpectedVer: "乐观锁版本号"');
    expect(zh).toContain('admin_reports_modStatus: "工单状态"');
    expect(zh).not.toContain('admin_community_reports_reporter_id: "reporter_id"');
    expect(zh).not.toContain('admin_reports_modStatus: "status"');
  });
});
