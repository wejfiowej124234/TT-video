import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** A11Y-01：入驻队列筛选控件须带 console focus token。 */
describe("admin queue focus L5 (①)", () => {
  const adminAppRoot = join(__dir, "..", "..", "app", "admin");

  it("provider/steward queue filters use ADMIN_FORM_FIELD_FOCUS_CLASS", () => {
    for (const rel of [
      "provider-applications/AdminProviderApplicationsPageMain.tsx",
      "steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(adminAppRoot, rel), "utf8");
      expect(src).toContain("ADMIN_FORM_FIELD_FOCUS_CLASS");
    }
  });

  it("approvals quick filters use ADMIN_FOCUS_RING_CORE_CLASS", () => {
    const src = readFileSync(join(adminAppRoot, "approvals", "AdminApprovalsQuickFilters.tsx"), "utf8");
    expect(src).toContain("ADMIN_FOCUS_RING_CORE_CLASS");
    expect(src).toContain("adminFilterChipClass");
  });
});
