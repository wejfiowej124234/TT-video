import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const adminApp = join(fe, "app", "admin");
const componentsAdmin = join(fe, "components", "admin");

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkTsx(p));
    else if (name.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** ADM-UX-VIS-09 · ① Admin 暖金 L5 覆盖与 token 卫生（非 ②③ GO）。 */
describe("admin warm L5 coverage (① · ADM-UX-VIS-09)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const warmSurface = readFileSync(join(componentsAdmin, "AdminWarmL5Surface.tsx"), "utf8");

  it("adminUi exports warm L5 + hub link + table surface tokens", () => {
    expect(adminUi).toContain("ADMIN_WARM_L5_FRAME_CLASS");
    expect(adminUi).toMatch(/ADMIN_WARM_L5_FRAME_CLASS[\s\S]*TT_MARKETING_WARM_L5_CARD_FRAME_CONSOLE/);
    expect(adminUi).toContain("ADMIN_HUB_LINK_CARD_FRAME_CLASS");
    expect(adminUi).toContain("ADMIN_TABLE_SURFACE_CLASS");
    expect(adminUi).toContain("bg-bg-console");
    const tableSurfaceDef =
      adminUi.match(/export const ADMIN_TABLE_SURFACE_CLASS = `([^`]*)`/)?.[1] ?? "";
    expect(tableSurfaceDef).not.toMatch(/\bbg-white\b/);
  });

  it("AdminWarmL5Surface is the shared double-layer wrapper", () => {
    expect(warmSurface).toContain("data-tt-admin-warm-l5-surface");
    expect(warmSurface).toContain("ADMIN_WARM_L5_INNER_GLOW_CLASS");
  });

  it("list + detail chrome use AdminWarmL5Surface for page headers", () => {
    const list = readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8");
    const detail = readFileSync(join(componentsAdmin, "AdminDetailPageChrome.tsx"), "utf8");
    const queue = readFileSync(join(componentsAdmin, "AdminQueueListPageChrome.tsx"), "utf8");
    expect(list).toContain("AdminWarmL5Surface");
    expect(detail).toContain("AdminWarmL5Surface");
    expect(queue).toContain("AdminWarmL5Surface");
    expect(list).not.toContain("ADMIN_PAGE_HEADER_CARD_CLASS");
    expect(detail).not.toContain("ADMIN_PAGE_HEADER_CARD_CLASS");
  });

  it("admin app + components avoid raw bg-white", () => {
    const offenders: string[] = [];
    for (const root of [adminApp, componentsAdmin]) {
      for (const file of walkTsx(root)) {
        const src = readFileSync(file, "utf8");
        if (/\bbg-white\b/.test(src)) offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders, "use bg-bg-console or adminUi tokens").toEqual([]);
  });

  it("home surfaces + workflow chips use warm L5 tokens", () => {
    const home = readFileSync(join(componentsAdmin, "AdminHomeInboxStrip.tsx"), "utf8");
    const search = readFileSync(join(componentsAdmin, "AdminHomeCardSearch.tsx"), "utf8");
    const workflow = readFileSync(join(componentsAdmin, "AdminInboxWorkflowQuickNav.tsx"), "utf8");
    const inbox = readFileSync(join(adminApp, "inbox", "AdminUnifiedInboxPageMain.tsx"), "utf8");
    const onboarding = readFileSync(join(adminApp, "onboarding", "AdminOnboardingHubPageMain.tsx"), "utf8");
    const finSuite = readFileSync(join(adminApp, "finance-suite", "AdminFinanceSuitePageMain.tsx"), "utf8");
    const compliance = readFileSync(join(adminApp, "compliance", "AdminComplianceHubPageMain.tsx"), "utf8");
    expect(home).toContain("AdminWarmL5Surface");
    expect(search).toContain("AdminWarmL5Surface");
    expect(workflow).toContain("ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS");
    expect(inbox).toContain("AdminWarmL5Surface");
    expect(onboarding).toContain("adminHubEntryLinkClass");
    expect(finSuite).toContain("AdminWarmL5Surface");
    expect(compliance).toContain("AdminWarmL5Surface");
  });

  it("adminUi exports workflow chip + search hit tokens", () => {
    expect(adminUi).toContain("ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS");
    expect(adminUi).toContain("ADMIN_HOME_SEARCH_HIT_LINK_CLASS");
    expect(adminUi).toContain("ADMIN_SECONDARY_PILL_BTN_CLASS");
    expect(adminUi).toContain("ADMIN_PHASE2_STAGING_NOTICE_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_PARTIAL_FALLBACK_CLASS");
    expect(adminUi).toContain("ADMIN_FORM_CONTROL_SM_CLASS");
    expect(adminUi).toContain("ADMIN_PAGINATION_DISABLED_CLASS");
    expect(adminUi).toContain("ADMIN_INNER_DIVIDER_CLASS");
    expect(adminUi).toContain("ADMIN_TABLE_DIVIDE_CLASS");
    expect(adminUi).toContain("ADMIN_DEFINITION_LIST_CLASS");
    expect(adminUi).toContain("ADMIN_BREADCRUMB_SEPARATOR_CLASS");
    expect(adminUi).toContain("ADMIN_MODAL_CANCEL_BTN_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_ALL_CLEAR_CLASS");
    expect(adminUi).toMatch(/ADMIN_SURFACE_PLAIN_CLASS[\s\S]*border-ref-sun/);
    expect(adminUi).toMatch(/ADMIN_FILTER_CARD_CLASS[\s\S]*border-ref-sun/);
    expect(adminUi).toMatch(/ADMIN_FILTER_CARD_CLASS[\s\S]*bg-ref-sun/);
    expect(adminUi).toMatch(/ADMIN_KPI_CARD_IDLE_CLASS[\s\S]*border-ref-sun/);
    expect(adminUi).toMatch(/ADMIN_TABLE_SURFACE_CLASS[\s\S]*ADMIN_SURFACE_PLAIN_CLASS/);
    expect(adminUi).toContain("ADMIN_FORM_ERROR_BANNER_CLASS");
    expect(adminUi).toContain("ADMIN_WIZARD_STEP_DONE_CLASS");
    expect(adminUi).toMatch(/ADMIN_WIZARD_STEP_DONE_CLASS[\s\S]*success/);
    expect(adminUi).not.toMatch(/ADMIN_KPI_CARD_PENDING_CLASS[\s\S]*from-white/);
    expect(adminUi).toContain("ADMIN_CONSOLE_MUTED_PANEL_PAD_CLASS");
    expect(adminUi).toContain("ADMIN_ACQUISITION_SUSPEND_ACTIVE_STATUS_CLASS");
    expect(adminUi).toContain("ADMIN_ALERT_ERROR_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_RECON_MISALIGNED_BADGE_CLASS");
    expect(adminUi).toContain("ADMIN_FORM_FIELD_ERROR_BORDER_CLASS");
    expect(adminUi).toContain("ADMIN_META_NOTE_LINK_CLASS");
    expect(adminUi).toContain("ADMIN_MODAL_OVERLAY_CLASS");
    expect(adminUi).toContain("ADMIN_MODAL_SCRIM_CLASS");
    expect(adminUi).toMatch(/ADMIN_WARM_L5_INNER_CLASS[\s\S]*TT_MARKETING_ORDERS_DARK_GLASS_INNER/);
    expect(adminUi).toContain("ADMIN_TEXT_BODY_CLASS");
    expect(adminUi).toMatch(/export const ADMIN_KPI_CARD_IDLE_CLASS =[\s\S]*?slate-950/);
    expect(adminUi).toContain("ADMIN_SHELL_PREVIEW_BANNER_CLASS");
    expect(adminUi).toContain("ADMIN_SHELL_PREVIEW_NOTICE_CLASS");
    expect(adminUi).toContain("ADMIN_WORKFLOW_INNER_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_HOME_TECH_FOLD_CLASS");
    expect(adminUi).toContain("ADMIN_KPI_SCOPE_NOTE_CLASS");
    expect(adminUi).toContain("ADMIN_APPROVAL_APPROVE_ACTION_CLASS");
  });

  it("admin app avoids broken adminUi import typos", () => {
    const offenders: string[] = [];
    for (const root of [adminApp, componentsAdmin]) {
      for (const file of walkTsx(root)) {
        const src = readFileSync(file, "utf8");
        if (/import\s*\{,/.test(src)) offenders.push(file.replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("modals + phase2/fin fallback use warm L5 (no raw amber panels)", () => {
    const phase2 = readFileSync(join(componentsAdmin, "AdminPhase2StagingRecordPanel.tsx"), "utf8");
    const finFb = readFileSync(join(componentsAdmin, "AdminFinanceDepthModuleFallback.tsx"), "utf8");
    const roleModal = readFileSync(join(adminApp, "users", "AdminUsersRoleChangeModal.tsx"), "utf8");
    const acquisition = readFileSync(join(componentsAdmin, "AdminAcquisitionPublishSuspendModal.tsx"), "utf8");
    expect(phase2).toContain("AdminWarmL5Surface");
    expect(phase2).toContain("ADMIN_PHASE2_STAGING_NOTICE_CLASS");
    expect(phase2).not.toMatch(/border-amber-200 bg-amber-50/);
    expect(finFb).toContain("ADMIN_FIN_PARTIAL_FALLBACK_CLASS");
    expect(finFb).not.toMatch(/border-amber-200/);
    expect(roleModal).toContain("AdminModalWarmL5Panel");
    expect(acquisition).toContain("AdminModalWarmL5Panel");
    expect(acquisition).toContain("AdminDialogScrim");
    expect(acquisition).toContain("AdminDialogFocusPanel");
    expect(acquisition).not.toContain("bg-black/40");
    const dialogScrim = readFileSync(join(componentsAdmin, "AdminDialogScrim.tsx"), "utf8");
    expect(dialogScrim).toContain("ADMIN_MODAL_SCRIM_CLASS");
    expect(dialogScrim).not.toContain("bg-black/40");
    const finReconModel = readFileSync(
      join(adminApp, "finance-reconciliation", "adminFinanceReconciliationPageModel.ts"),
      "utf8",
    );
    expect(finReconModel).toContain("ADMIN_FIN_RECON_MISALIGNED_BADGE_CLASS");
    expect(finReconModel).not.toMatch(/bg-warning text-white/);
    const feeRouter = readFileSync(join(adminApp, "fee-router", "AdminFeeRouterPageMain.tsx"), "utf8");
    const financeGrid = readFileSync(join(adminApp, "finance", "AdminFinanceSummaryGridSection.tsx"), "utf8");
    expect(feeRouter).toContain("adminHubKpiLinkClass");
    expect(financeGrid).toContain("ADMIN_HUB_LINK_CARD_INNER_CLASS");
    const partialChecklist = readFileSync(
      join(componentsAdmin, "AdminFinanceSuitePartialChecklist.tsx"),
      "utf8",
    );
    expect(partialChecklist).toContain("AdminWarmL5Surface");
    expect(feeRouter).toContain("ADMIN_TABLE_SCROLL_SECTION_CLASS");
    const regionVault = readFileSync(
      join(adminApp, "region-vault", "AdminRegionVaultPageMain.tsx"),
      "utf8",
    );
    expect(regionVault).toContain("ADMIN_TABLE_SCROLL_SECTION_CLASS");
  });

  it("list tables use ADMIN_TABLE_SECTION_CLASS token SSOT", () => {
    const audit = readFileSync(join(adminApp, "audit", "AdminAuditTableSection.tsx"), "utf8");
    const orders = readFileSync(join(adminApp, "orders", "AdminOrdersPageMain.tsx"), "utf8");
    expect(audit).toContain("ADMIN_TABLE_SECTION_CLASS");
    expect(orders).toContain("ADMIN_TABLE_SECTION_CLASS");
    expect(adminUi).toContain("ADMIN_TABLE_SURFACE_CLASS");
  });

  it("subpage loading uses warm frame + table section tokens", () => {
    const loading = readFileSync(join(componentsAdmin, "AdminSubpageRouteLoading.tsx"), "utf8");
    expect(loading).toContain("ADMIN_WARM_L5_FRAME_CLASS");
    expect(loading).toContain("ADMIN_TABLE_SECTION_CLASS");
  });

  it("cross-check slots use AdminWarmL5Surface", () => {
    const cross = readFileSync(join(adminApp, "cross-check", "AdminCrossCheckPageMain.tsx"), "utf8");
    expect(cross).toContain("AdminWarmL5Surface");
    expect(cross).not.toMatch(/border border-ink-200 bg-bg-console\/60/);
  });

  it("IA-06 shell preview surfaces use warm preview tokens not raw sky panels", () => {
    const homeBanner = readFileSync(join(componentsAdmin, "AdminHomeShellPreviewBanner.tsx"), "utf8");
    const notice = readFileSync(join(componentsAdmin, "AdminShellPreviewNotice.tsx"), "utf8");
    const switcher = readFileSync(join(componentsAdmin, "AdminShellBarRolePerspectiveSwitcher.tsx"), "utf8");
    expect(homeBanner).toContain("ADMIN_SHELL_PREVIEW_BANNER_CLASS");
    expect(notice).toContain("ADMIN_SHELL_PREVIEW_NOTICE_CLASS");
    expect(switcher).toContain("data-tt-admin-shell-role-perspective-switcher");
    expect(homeBanner).not.toMatch(/border-sky-200 bg-sky-50/);
    const operatorGuide = readFileSync(join(componentsAdmin, "AdminHomeOperatorGuide.tsx"), "utf8");
    const auditLinks = readFileSync(join(componentsAdmin, "AdminAuditCompareLinks.tsx"), "utf8");
    expect(operatorGuide).toContain("AdminWarmL5Surface");
    expect(auditLinks).not.toContain("dark:bg-ink");
    const selfRole = readFileSync(join(componentsAdmin, "AdminPermissionsSelfConsoleRole.tsx"), "utf8");
    const subnav = readFileSync(join(componentsAdmin, "AdminCommunitySubnav.tsx"), "utf8");
    expect(selfRole).toContain("AdminWarmL5Surface");
    expect(subnav).toContain("ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS");
  });

  it("approval workflow uses approve/reject action tokens", () => {
    const workflow = readFileSync(
      join(adminApp, "approvals", "[id]", "AdminApprovalDetailWorkflowPanel.tsx"),
      "utf8",
    );
    expect(workflow).toContain("ADMIN_APPROVAL_APPROVE_ACTION_CLASS");
    expect(workflow).toContain("ADMIN_APPROVAL_REJECT_ACTION_CLASS");
  });

  it("detail routes use AdminDetailContentPanel not ADMIN_FILTER_CARD for identity blocks", () => {
    const detailPanel = readFileSync(join(componentsAdmin, "AdminDetailContentPanel.tsx"), "utf8");
    expect(detailPanel).toContain("data-tt-admin-detail-content-panel");
    for (const rel of [
      "orders/[id]/AdminOrderDetailPageMain.tsx",
      "users/[id]/AdminUserDetailPageMain.tsx",
      "approvals/[id]/AdminApprovalDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(adminApp, ...rel.split("/")), "utf8");
      expect(src, rel).toContain("AdminDetailContentPanel");
      expect(src, rel).not.toMatch(/ADMIN_FILTER_CARD_CLASS.*shadow-soft/);
    }
  });
});
