import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const adminAppRoot = join(__dir, "..", "..", "app", "admin");

/** VIS-07 / VIS-05：quick filter chip 与步骤标记走 adminUi token。 */
describe("admin filter chip L5 (①)", () => {
  const adminUi = readFileSync(join(__dir, "..", "adminUi.ts"), "utf8");

  it("defines filter chip + step marker tokens", () => {
    expect(adminUi).toContain("ADMIN_FILTER_CHIP_ACTIVE_CLASS");
    expect(adminUi).toContain("adminFilterChipClass");
    expect(adminUi).toContain("ADMIN_STEP_MARKER_CLASS");
    expect(adminUi).toContain("ADMIN_TIMELINE_DOT_CLASS");
    expect(adminUi).toContain("ADMIN_TIER_SUPER_WRITE_BADGE_CLASS");
  });

  it("approvals quick filters use adminFilterChipClass", () => {
    const src = readFileSync(join(adminAppRoot, "approvals", "AdminApprovalsQuickFilters.tsx"), "utf8");
    expect(src).toContain("adminFilterChipClass");
    expect(src).not.toContain("border-travel-500 bg-travel-500 text-white");
  });

  it("operator guide uses ADMIN_STEP_MARKER_CLASS", () => {
    const src = readFileSync(
      join(adminAppRoot, "operator-guide", "AdminOperatorGuidePageMain.tsx"),
      "utf8",
    );
    expect(src).toContain("ADMIN_STEP_MARKER_CLASS");
    expect(src).not.toContain("bg-travel-600 text-small font-bold text-white");
  });

  it("approval detail timeline uses ADMIN_TIMELINE_DOT_CLASS", () => {
    const src = readFileSync(
      join(adminAppRoot, "approvals", "[id]", "AdminApprovalDetailTimeline.tsx"),
      "utf8",
    );
    expect(src).toContain("ADMIN_TIMELINE_DOT_CLASS");
    expect(src).toContain("ADMIN_TIMELINE_RAIL_CLASS");
    expect(src).not.toMatch(/bg-travel-500"/);
    expect(src).not.toContain("border-travel-200");
  });

  it("dispute detail timeline uses ADMIN_DISPUTE_STATUS_ACTIVE_CLASS", () => {
    const src = readFileSync(join(adminAppRoot, "disputes", "AdminDisputeDetailTimeline.tsx"), "utf8");
    expect(src).toContain("ADMIN_DISPUTE_STATUS_ACTIVE_CLASS");
    expect(src).not.toContain("bg-travel-600");
  });

  it("audit limit presets use adminFilterChipClass", () => {
    const src = readFileSync(
      join(__dir, "..", "..", "components", "admin", "AdminAuditLimitPresets.tsx"),
      "utf8",
    );
    expect(src).toContain("adminFilterChipClass");
    expect(src).not.toContain("border-travel-500 bg-travel-500");
  });

  it("audit quick filters use adminFilterChipClass", () => {
    const src = readFileSync(join(__dir, "..", "..", "components", "admin", "AdminAuditQuickFilters.tsx"), "utf8");
    expect(src).toContain("adminFilterChipClass");
    expect(src).not.toContain("border-travel-500 bg-travel-500");
  });

  it("permissions matrix super-only badge uses ADMIN_TIER_SUPER_WRITE_BADGE_CLASS", () => {
    const src = readFileSync(join(adminAppRoot, "permissions", "AdminPermissionsPageMain.tsx"), "utf8");
    expect(src).toContain("ADMIN_TIER_SUPER_WRITE_BADGE_CLASS");
    expect(src).not.toContain("border-amber-200 bg-amber-50");
  });
});
