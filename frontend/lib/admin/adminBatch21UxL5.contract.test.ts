import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第二十一批 UX · indexer attention 实线 / inbox 空态 SSOT / onboarding 列表交叉链。 */
describe("admin batch21 UX L5 (①)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const indexerHint = readFileSync(join(appAdmin, "indexer", "AdminIndexerOpsHintCard.tsx"), "utf8");
  const nextLinks = readFileSync(join(__dir, "adminListEmptyStateNextLinks.ts"), "utf8");
  const inboxNext = readFileSync(join(componentsAdmin, "AdminInboxStripEmptyNextLinks.tsx"), "utf8");
  const approvalsInbox = readFileSync(join(appAdmin, "approvals", "AdminApprovalsInboxStrip.tsx"), "utf8");
  const reportsInbox = readFileSync(
    join(appAdmin, "community", "reports", "AdminCommunityReportsInboxStrip.tsx"),
    "utf8",
  );
  const onboarding = readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8");
  const approvalsTable = readFileSync(join(appAdmin, "approvals", "AdminApprovalsTableSection.tsx"), "utf8");
  const reportsPage = readFileSync(
    join(appAdmin, "community", "reports", "AdminCommunityReportsPageInner.tsx"),
    "utf8",
  );

  it("defines indexer ops hint attention token without dashed", () => {
    expect(adminUi).toContain("ADMIN_INDEXER_OPS_HINT_CARD_CLASS");
    expect(adminUi).toMatch(/ADMIN_INDEXER_OPS_HINT_CARD_CLASS[\s\S]*border-warning/);
    expect(adminUi).not.toMatch(/ADMIN_INDEXER_OPS_HINT_CARD_CLASS[\s\S]*border-dashed/);
    expect(indexerHint).toContain("ADMIN_INDEXER_OPS_HINT_CARD_CLASS");
    expect(indexerHint).toContain('data-tt-admin-indexer-ops-hint="1"');
    expect(indexerHint).not.toContain("border-dashed");
  });

  it("extends empty next-link SSOT for approvals, reports, onboarding", () => {
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY");
    expect(approvalsTable).toContain("ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY");
    expect(reportsPage).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY");
    expect(onboarding).toContain("ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY");
  });

  it("inbox strips wire compact empty next links from SSOT", () => {
    expect(inboxNext).toContain("data-tt-admin-inbox-strip-empty-next");
    expect(approvalsInbox).toContain("AdminInboxStripEmptyNextLinks");
    expect(approvalsInbox).toContain("ADMIN_EMPTY_NEXT_APPROVALS_FILTERED_EMPTY");
    expect(approvalsInbox).toContain('data-tt-admin-approvals-inbox-empty');
    expect(reportsInbox).toContain("AdminInboxStripEmptyNextLinks");
    expect(reportsInbox).toContain("ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY");
    expect(reportsInbox).toContain('data-tt-admin-reports-inbox-empty');
  });
});
