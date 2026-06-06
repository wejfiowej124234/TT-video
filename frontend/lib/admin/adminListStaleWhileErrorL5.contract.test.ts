import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① · ADM-P1-06：标准列表页 stale-while-error · 禁止 error 互斥隐藏 rows。 */
describe("admin list stale-while-error L5 (①)", () => {
  const hook = readFileSync(join(__dir, "useAdminStandardListFetch.ts"), "utf8");

  it("useAdminStandardListFetch exposes staleWhileError", () => {
    expect(hook).toContain("staleWhileError");
    expect(hook).toContain("setStaleWhileError(true)");
  });

  it("onboarding queue pages use AdminStandardListSection", () => {
    for (const rel of [
      "app/admin/provider-applications/AdminProviderApplicationsPageMain.tsx",
      "app/admin/steward-applications/AdminStewardApplicationsPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminStandardListSection");
      expect(src, rel).toContain("staleWhileError");
      expect(src, rel).not.toMatch(/loading && items\.length === 0 \?[\s\S]*: error \?/);
    }
  });

  it("standard list PageMain files avoid exclusive error-vs-rows ternary", () => {
    const offenders: string[] = [];
    for (const rel of [
      "app/admin/orders/AdminOrdersPageMain.tsx",
      "app/admin/disputes/AdminDisputesPageMain.tsx",
      "app/admin/guides/AdminGuidesPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      if (/!loading && !error && items\.length > 0/.test(src)) {
        offenders.push(`${rel} (exclusive !error guard on rows)`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
