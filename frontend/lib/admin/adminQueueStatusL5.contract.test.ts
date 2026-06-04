import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const adminAppRoot = join(__dir, "..", "..", "app", "admin");

/** O10 · 队列状态 pill 走 adminUi token（审批 / 举报）。 */
describe("admin queue status badge L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");

  it("defines queue status badge tokens", () => {
    expect(adminUi).toContain("ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS");
    expect(adminUi).toContain("ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS");
    expect(adminUi).toContain("ADMIN_INBOX_CHANNEL_ERROR_CLASS");
  });

  it("approvals + reports tables use status badge tokens not raw amber pill classes", () => {
    for (const rel of [
      "approvals/AdminApprovalsTableSection.tsx",
      "community/reports/AdminCommunityReportsTable.tsx",
      "approvals/[id]/AdminApprovalDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src, rel).toContain("ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS");
      expect(src, rel).not.toMatch(/bg-amber-100 text-amber-950/);
    }
  });
});
