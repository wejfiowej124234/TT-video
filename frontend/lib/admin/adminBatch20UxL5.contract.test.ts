import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY,
  ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY,
  ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR,
} from "./adminListEmptyStateNextLinks";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const adminApp = join(fe, "app", "admin");

/** ① 第二十批 UX · 首页 tier 实线 / finance workflow widget / 空态交叉链 SSOT。 */
describe("admin batch20 UX L5 (①)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const home = readFileSync(join(componentsAdmin, "AdminHomeClient.tsx"), "utf8");
  const finWorkflow = readFileSync(join(componentsAdmin, "AdminFinanceWorkflowStrip.tsx"), "utf8");
  const provider = readFileSync(
    join(adminApp, "provider-applications", "AdminProviderApplicationsPageMain.tsx"),
    "utf8",
  );
  const steward = readFileSync(
    join(adminApp, "steward-applications", "AdminStewardApplicationsPageMain.tsx"),
    "utf8",
  );
  const unifiedInbox = readFileSync(join(adminApp, "inbox", "AdminUnifiedInboxPageMain.tsx"), "utf8");
  const nextLinks = readFileSync(join(__dir, "adminListEmptyStateNextLinks.ts"), "utf8");

  it("defines home tier read/placeholder + finance workflow step tokens without dashed", () => {
    expect(adminUi).toContain("ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS");
    expect(adminUi).toContain("ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS");
    expect(adminUi).toContain("ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS");
    expect(adminUi).not.toMatch(/ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS[\s\S]*border-dashed/);
  });

  it("home client uses tier badge SSOT (no dashed placeholder)", () => {
    expect(home).toContain("ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS");
    expect(home).toContain("ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS");
    expect(home).not.toContain("border-dashed");
  });

  it("finance workflow strip uses widget card + step token", () => {
    expect(finWorkflow).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(finWorkflow).toContain("ADMIN_FIN_WORKFLOW_STEP_CARD_CLASS");
    expect(finWorkflow).toContain('data-tt-admin-fin-workflow="1"');
    expect(finWorkflow).not.toMatch(
      /data-tt-admin-fin-workflow[\s\S]*rounded-\[var\(--radius-xl\)\] border border-ink-200 bg-white/,
    );
  });

  it("onboarding + unified inbox empty states wire next-link SSOT", () => {
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY");
    expect(nextLinks).toContain("ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR");
    expect(ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY).toHaveLength(3);
    expect(ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR).toHaveLength(3);
    expect(provider).toContain("ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY");
    expect(steward).toContain("ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY");
    expect(unifiedInbox).toContain("ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR");
    expect(unifiedInbox).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
  });
});
