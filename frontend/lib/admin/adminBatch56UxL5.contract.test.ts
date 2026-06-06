import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { shouldShowAdminCapabilityStrip } from "./adminCapabilityStripVisibility";
import { adminShellPreviewBadgeVisible } from "./adminShellUxPolicy";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十六批 UX · 筛选暖 input · 子页 boot · chrome 去重 · 面包屑/表框/返回站点。 */
describe("admin batch56 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch56 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch56UxL5.contract.test.ts");
  });

  it("defines warm dark filter input tokens", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_FILTER_INPUT_MD_CLASS");
    expect(adminUi).toContain("ADMIN_FILTER_INPUT_SM_CLASS");
    expect(adminUi).toMatch(/ADMIN_FILTER_CARD_CLASS[\s\S]*admin-filter-card/);
    expect(adminUi).toMatch(/ADMIN_FILTER_INPUT_MD_CLASS[\s\S]*bg-\[#0c0a09\]/);
    expect(adminUi).toContain("ADMIN_TABLE_WARM_FRAME_CLASS");
    expect(adminUi).toContain("ADMIN_HUB_NESTED_KPI_CARD_CLASS");
    expect(adminUi).toMatch(
      /export const ADMIN_HEADER_RETURN_SITE_CLASS =[\s\S]*?TT_MARKETING_BTN_GHOST_WARM_DARK/,
    );
  });

  it("community reports filter uses ADMIN_FILTER_INPUT not cream form control", () => {
    const filter = readFileSync(
      join(fe, "app/admin/community/reports/AdminCommunityReportsFilterCard.tsx"),
      "utf8",
    );
    expect(filter).toContain("ADMIN_FILTER_INPUT_MD_CLASS");
    expect(filter).not.toContain("ADMIN_FORM_CONTROL_MD_CLASS");
  });

  it("subpage boot gate wraps admin main content", () => {
    const shell = readFileSync(join(fe, "components/admin/AdminCapabilitiesShell.tsx"), "utf8");
    const gate = readFileSync(join(fe, "components/admin/AdminMainBootGate.tsx"), "utf8");
    expect(shell).toContain("AdminMainBootGate");
    expect(gate).toContain("adminSubpageBootBlocked");
    expect(gate).toContain('variant="table-wide"');
  });

  it("capability strip hides during global capabilities boot", () => {
    expect(
      shouldShowAdminCapabilityStrip({
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
        loading: true,
        canApprove: false,
        maintainerUi: true,
        onWorkspace: false,
      }),
    ).toBe(false);
  });

  it("shell preview badges defer to capability strip on subpages", () => {
    expect(
      adminShellPreviewBadgeVisible({
        maintainerUi: true,
        onWorkspace: false,
        pendingTotal: null,
        shellPreviewActive: true,
      }),
    ).toBe(false);
    const bar = readFileSync(join(fe, "components/admin/AdminShellBar.tsx"), "utf8");
    expect(bar).toContain("shellPreviewActive: Boolean(previewRole)");
  });

  it("breadcrumb uses dedicated group/leaf tokens", () => {
    const crumb = readFileSync(join(fe, "components/admin/AdminSubpageBreadcrumb.tsx"), "utf8");
    expect(crumb).toContain("ADMIN_BREADCRUMB_GROUP_CLASS");
    expect(crumb).toContain("ADMIN_BREADCRUMB_LEAF_CLASS");
  });

  it("onboarding hub ledger cards use dark nested KPI token", () => {
    const notice = readFileSync(join(fe, "components/admin/AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    expect(notice).toContain("ADMIN_HUB_NESTED_KPI_CARD_CLASS");
    expect(notice).not.toContain("ADMIN_KPI_CARD_CONSOLE_IDLE_CLASS");
  });

  it("inbox back links default workspace link off (breadcrumb SSOT)", () => {
    const back = readFileSync(join(fe, "components/admin/AdminInboxQueueBackLinks.tsx"), "utf8");
    expect(back).toMatch(/showWorkspace\s*=\s*false/);
    expect(back).toMatch(/showInbox\s*=\s*false/);
  });
});
