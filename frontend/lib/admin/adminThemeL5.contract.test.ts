import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTsx(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** U8 · ① Admin 控制台 ink 主题 token（Shell/首页 · 非营销 travel 导航色）。 */
describe("admin theme L5 (① · U8)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const shellBar = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
  const shellNav = readFileSync(join(fe, "components", "admin", "AdminShellNavGroup.tsx"), "utf8");
  const kpi = readFileSync(join(fe, "components", "admin", "AdminHomeKpiStrip.tsx"), "utf8");

  it("defines console nav + inline link tokens", () => {
    expect(adminUi).toContain("ADMIN_SHELL_NAV_IDLE_CLASS");
    expect(adminUi).toContain("ADMIN_INLINE_LINK_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_TASK_PENDING_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(adminUi).toContain("adminShellTopNavLinkClass");
    expect(adminUi).toContain("adminTableInlineLinkClass");
    expect(adminUi).toContain("ADMIN_TABLE_INLINE_LINK_CLASS");
    expect(adminUi).toMatch(/ADMIN_TABLE_INLINE_LINK_CLASS[\s\S]*text-slate-200/);
    expect(adminUi).toContain("ADMIN_TABLE_TD_MONO_CLASS");
    expect(adminUi).toContain("ADMIN_TABLE_TD_TIMESTAMP_CLASS");
    expect(adminUi).toMatch(/ADMIN_SHELL_NAV_IDLE_CLASS[\s\S]*text-slate-200/);
  });

  it("shell bar + nav group use adminShellTopNavLinkClass not travel nav colors", () => {
    expect(shellBar).toContain("adminShellTopNavLinkClass");
    expect(shellBar).not.toMatch(/text-travel-600 hover:text-travel-700/);
    expect(shellNav).toContain("adminShellTopNavLinkClass");
    expect(shellNav).not.toMatch(/text-travel-600 hover:text-travel-700/);
  });

  it("home KPI strip uses ADMIN_KPI_CARD tokens not travel card borders", () => {
    expect(kpi).toContain("ADMIN_KPI_CARD_PENDING_CLASS");
    expect(kpi).toContain("ADMIN_KPI_CARD_IDLE_CLASS");
    expect(kpi).not.toContain("border-travel-300");
  });

  it("adminPageNavLinkClass uses ADMIN_INLINE_LINK not marketing travel text", () => {
    expect(adminUi).toContain("function adminPageNavLinkClass");
    expect(adminUi).toMatch(/function adminPageNavLinkClass[\s\S]*ADMIN_INLINE_LINK_CLASS/);
    expect(adminUi).not.toMatch(/function adminPageNavLinkClass[\s\S]*TT_MARKETING_CONSOLE_INLINE_LINK/);
  });

  it("app/admin tsx modules avoid travel surface tokens", () => {
    const offenders: string[] = [];
    const travelSurfaceRe = /(?:^|[^a-z])((?:border|bg|text|ring)-travel-\d+)/;
    for (const file of walkTsx(join(fe, "app", "admin"))) {
      const base = file.replace(/\\/g, "/");
      if (base.endsWith(".contract.test.ts")) continue;
      const src = readFileSync(file, "utf8");
      if (travelSurfaceRe.test(src)) offenders.push(base);
    }
    expect(offenders).toEqual([]);
  });

  it("finance export deep-link uses ADMIN_FIN_SUITE_EXPORT_FOCUS_RING_CLASS", () => {
    const finance = readFileSync(join(fe, "app", "admin", "finance", "AdminFinancePageMain.tsx"), "utf8");
    expect(finance).toContain("ADMIN_FIN_SUITE_EXPORT_FOCUS_RING_CLASS");
    expect(finance).not.toMatch(/ring-travel-/);
  });

  it("app/admin PageMain and PageHeader avoid travel text on inline nav links", () => {
    const offenders: string[] = [];
    const travelLinkRe =
      /text-travel-[356]00\s+hover:underline|text-travel-600\/90\s+hover:underline|text-travel-300\s+hover:underline|text-travel-700\s+hover:underline/;
    const travelSurfaceRe = /border-travel-|bg-travel-/;
    for (const file of walkTsx(join(fe, "app", "admin"))) {
      const base = file.replace(/\\/g, "/");
      if (!base.endsWith("PageMain.tsx") && !base.endsWith("PageHeader.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (travelLinkRe.test(src) || travelSurfaceRe.test(src)) offenders.push(base);
    }
    expect(offenders).toEqual([]);
  });

  it("unified inbox uses ADMIN_INBOX_TASK_PENDING_CARD_CLASS not travel surface", () => {
    const inbox = readFileSync(join(fe, "app", "admin", "inbox", "AdminUnifiedInboxPageMain.tsx"), "utf8");
    expect(inbox).toMatch(/ADMIN_INBOX_TASK_PENDING_CARD_CLASS|data-tt-admin-unified-inbox-task-pending/);
    expect(inbox).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(inbox).not.toContain("TT_MARKETING_BTN_CONSOLE_TRUST");
    expect(inbox).not.toMatch(/border-travel-300 bg-travel-50/);
  });

  it("home inbox strip uses ink inbox CTA tokens not trust marketing button", () => {
    const strip = readFileSync(join(fe, "components", "admin", "AdminHomeInboxStrip.tsx"), "utf8");
    expect(strip).toContain("ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS");
    expect(strip).toContain("ADMIN_INBOX_TASK_CTA_IDLE_CLASS");
    expect(strip).not.toContain("TT_MARKETING_BTN_CONSOLE_TRUST");
    expect(strip).not.toMatch(/bg-trust-/);
  });

  it("shared shell components avoid travel-colored inline nav links", () => {
    const travelLinkRe = /text-travel-[56]00\s+hover:underline/;
    for (const rel of [
      "AdminActorCapabilityStrip.tsx",
      "AdminSearchParamsSuspense.tsx",
      "AdminAuditCompareLinks.tsx",
      "AdminSubpageBreadcrumb.tsx",
      "AdminListPageEmptyState.tsx",
    ]) {
      const src = readFileSync(join(fe, "components", "admin", rel), "utf8");
      expect(src, rel).not.toMatch(travelLinkRe);
    }
  });

  it("observability page wires AdminObservabilityOpsStrip (①)", () => {
    const strip = readFileSync(join(fe, "components", "admin", "AdminObservabilityOpsStrip.tsx"), "utf8");
    expect(strip).toContain("data-tt-admin-observability-ops");
    expect(strip).toContain("ADMIN_INLINE_LINK_CLASS");
    const page = readFileSync(join(fe, "app", "admin", "observability", "AdminObservabilityPageMain.tsx"), "utf8");
    expect(page).toContain("AdminObservabilityOpsStrip");
  });

  it("components/admin avoid raw travel surface tokens", () => {
    const offenders: string[] = [];
    const travelSurfaceRe = /(?:^|[^a-z])((?:border|bg|text)-travel-\d+)/;
    for (const file of walkTsx(join(fe, "components", "admin"))) {
      const src = readFileSync(file, "utf8");
      if (travelSurfaceRe.test(src)) offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("inbox strips use console widget tokens (no travel marketing surfaces)", () => {
    const approvals = readFileSync(
      join(fe, "app", "admin", "approvals/AdminApprovalsInboxStrip.tsx"),
      "utf8",
    );
    expect(approvals).toMatch(/AdminWarmL5Surface|data-tt-admin-warm-l5-surface/);
    expect(approvals).toContain("data-tt-admin-approvals-inbox-pending-filter");
    expect(approvals).toContain('data-tt-admin-approvals-inbox-empty');
    expect(approvals).not.toMatch(/border-travel-200 bg-travel-50/);

    const reports = readFileSync(
      join(fe, "app", "admin", "community/reports/AdminCommunityReportsInboxStrip.tsx"),
      "utf8",
    );
    expect(reports).toMatch(/AdminWarmL5Surface|data-tt-admin-warm-l5-surface/);
    expect(reports).toContain("data-tt-admin-reports-inbox-open-filter");
    expect(reports).toContain('data-tt-admin-reports-inbox-empty');
    expect(reports).not.toMatch(/border-travel-200 bg-travel-50/);
  });

  it("indexer ops hint + applied filters banner use adminUi SSOT tokens", () => {
    expect(adminUi).toContain("ADMIN_INDEXER_OPS_HINT_CARD_CLASS");
    expect(adminUi).toContain("ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS");
    const indexerHint = readFileSync(join(fe, "app", "admin", "indexer/AdminIndexerOpsHintCard.tsx"), "utf8");
    expect(indexerHint).toContain("ADMIN_INDEXER_OPS_HINT_CARD_CLASS");
    expect(indexerHint).not.toContain("border-dashed");
    const appliedBanner = readFileSync(join(fe, "components", "admin", "AdminAppliedFiltersBanner.tsx"), "utf8");
    expect(appliedBanner).toContain('data-tt-admin-applied-filters="1"');
    const emptyState = readFileSync(join(fe, "components", "admin", "AdminListPageEmptyState.tsx"), "utf8");
    expect(emptyState).toContain("data-tt-admin-list-empty-filtered");
  });

  it("onboarding queue pages wire sort toolbar + sortOnboardingQueueItems", () => {
    const toolbar = readFileSync(join(fe, "components", "admin", "AdminOnboardingQueueSortToolbar.tsx"), "utf8");
    expect(toolbar).toContain("data-tt-admin-onboarding-queue-sort");
    for (const rel of [
      "provider-applications/AdminProviderApplicationsPageMain.tsx",
      "steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, "app", "admin", rel), "utf8");
      expect(src).toContain("AdminOnboardingQueueSortToolbar");
      expect(src).toContain("sortOnboardingQueueItems");
      expect(src).toContain("sortedItems.map");
    }
  });
});

