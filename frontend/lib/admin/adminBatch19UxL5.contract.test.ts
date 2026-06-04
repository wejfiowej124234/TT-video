import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const adminApp = join(fe, "app", "admin");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第十九批 UX · inbox 无权限实线 / 队列 widget 行卡 / finance hub depth SSOT。 */
describe("admin batch19 UX L5 (①)", () => {
  const adminUi = readFileSync(join(fe, "lib", "adminUi.ts"), "utf8");
  const inbox = readFileSync(join(componentsAdmin, "AdminHomeInboxStrip.tsx"), "utf8");
  const finHub = readFileSync(join(componentsAdmin, "AdminFinanceSuiteHubDepthSection.tsx"), "utf8");
  const provider = readFileSync(
    join(adminApp, "provider-applications", "AdminProviderApplicationsPageMain.tsx"),
    "utf8",
  );
  const steward = readFileSync(
    join(adminApp, "steward-applications", "AdminStewardApplicationsPageMain.tsx"),
    "utf8",
  );

  it("defines inbox perm-denied and queue row card tokens", () => {
    expect(adminUi).toContain("ADMIN_INBOX_PERM_DENIED_ROW_CLASS");
    expect(adminUi).toContain("ADMIN_QUEUE_LIST_ROW_CARD_CLASS");
    expect(adminUi).toMatch(/ADMIN_QUEUE_LIST_ROW_CARD_CLASS[\s\S]*ADMIN_HOME_WIDGET_CARD_CLASS/);
    expect(adminUi).not.toMatch(/ADMIN_INBOX_PERM_DENIED_ROW_CLASS[\s\S]*border-dashed/);
  });

  it("home inbox perm-denied rows use solid token (no dashed)", () => {
    expect(inbox).toContain("ADMIN_INBOX_PERM_DENIED_ROW_CLASS");
    expect(inbox).toContain('data-tt-admin-inbox-permission-denied="1"');
    expect(inbox).not.toMatch(/data-tt-admin-inbox-channel-denied[\s\S]*border-dashed/);
  });

  it("finance suite hub depth section uses widget card token", () => {
    expect(finHub).toContain("ADMIN_HOME_WIDGET_CARD_CLASS");
    expect(finHub).toContain('data-tt-admin-fin-suite-hub-depth="1"');
    expect(finHub).not.toMatch(/data-tt-admin-fin-suite-hub-depth[\s\S]*rounded-\[var\(--radius-xl\)\] border border-ink-200 bg-white/);
  });

  it("provider/steward queue pages use canvas spacing + widget row cards + onboarding empty links", () => {
    for (const [src, queue, emptyConst] of [
      [provider, "provider", "ADMIN_EMPTY_NEXT_PROVIDER_QUEUE_EMPTY"],
      [steward, "steward", "ADMIN_EMPTY_NEXT_STEWARD_QUEUE_EMPTY"],
    ] as const) {
      expect(src).toContain("ADMIN_QUEUE_LIST_ROW_CARD_CLASS");
      expect(src).toContain(`data-tt-admin-onboarding-queue-list="${queue}"`);
      expect(src).toContain(`data-tt-admin-queue-list-filter="${queue}"`);
      expect(src).not.toContain("mt-6 flex flex-wrap items-end");
      expect(src).not.toContain('className="mt-6" aria-live="polite"');
      expect(src).toContain(emptyConst);
      expect(src).not.toMatch(/sortedItems\.map[\s\S]*ADMIN_FILTER_CARD_CLASS/);
    }
  });
});
