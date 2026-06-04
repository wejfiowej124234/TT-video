import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF } from "@/lib/admin/adminPhase2RemainingBacklogPrepHref";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第十三批 UX · backlog 深链 / CI-02 staging 面板 / ONB 双台账 / FIN partial 诚实。 */
describe("admin batch13 UX L5 (①)", () => {
  it("CI-02 staging record panel on permissions", () => {
    const panel = readFileSync(join(componentsAdmin, "AdminPhase2StagingRecordPanel.tsx"), "utf8");
    const perms = readFileSync(
      join(appAdmin, "permissions", "AdminPermissionsPageMain.tsx"),
      "utf8",
    );
    expect(panel).toContain("ADMIN_PHASE2_STAGING_ONLY_COMMANDS");
    expect(panel).toContain("data-tt-admin-phase2-staging-record-panel");
    expect(perms).toContain("AdminPhase2StagingRecordPanel");
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-CI-02"]).toContain(
      "admin-phase2-staging-record",
    );
  });

  it("ONB-04 dual ledger nav on onboarding list pages", () => {
    const list = readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8");
    const nav = readFileSync(join(componentsAdmin, "AdminOnboardingDualLedgerNavStrip.tsx"), "utf8");
    expect(list).toContain("AdminOnboardingDualLedgerNavStrip");
    expect(nav).toContain("data-tt-admin-onboarding-dual-ledger-nav");
    expect(nav).toContain("admin-onboarding-hub-ledger");
  });

  it("ONB-04 hub ledger anchor + webhook retry", () => {
    const notice = readFileSync(join(componentsAdmin, "AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    const webhook = readFileSync(
      join(componentsAdmin, "AdminOnboardingWebhookStripeEchoStrip.tsx"),
      "utf8",
    );
    expect(notice).toContain('id="admin-onboarding-hub-ledger"');
    expect(notice).toContain("data-tt-admin-onboarding-webhook-ledger-retry");
    expect(webhook).toContain("onWebhookReload");
  });

  it("FIN-02 partial depth honesty on compact nav", () => {
    const nav = readFileSync(join(componentsAdmin, "AdminFinanceWorkflowCompactNav.tsx"), "utf8");
    expect(nav).toContain("data-tt-admin-fin-partial-depth-honesty");
    expect(nav).toContain("admin_fin_workflow_partial_honesty");
  });

  it("closure prep links staging record panel", () => {
    const closure = readFileSync(join(componentsAdmin, "AdminPhase2ClosurePrepPanel.tsx"), "utf8");
    expect(closure).toContain("admin-phase2-staging-record");
  });

  it("RBAC-05 e2e asserts ADM-U01 prep panel on permissions", () => {
    const spec = readFileSync(
      join(fe, "e2e", "admin-adm-u01-shell-local-prep.spec.ts"),
      "utf8",
    );
    expect(spec).toContain("data-tt-admin-adm-u01-local-prep-panel");
    expect(spec).toContain("admin-adm-u01-local-prep");
  });
});
