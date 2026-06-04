import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminTrustGrowthPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminTrustGrowthLoadErrorBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminTrustGrowthPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminTrustGrowthPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "AdminTrustGrowthMetricsSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminTrustGrowthTimelineSection.tsx"), "utf8"),
  ].join("\n");
}

describe("admin trust-growth page", () => {
  const src = readModuleSources();

  it("keeps observability GET + control PATCH/rollback routes", () => {
    expect(src).toContain("routes.admin.trustGrowthObservability");
    expect(src).toContain("routes.admin.trustGrowthControl");
    expect(src).toContain("routes.admin.trustGrowthRollbackControl");
  });

  it("variant + timeline tables use client sort", () => {
    expect(src).toContain("useAdminTableSort");
    expect(src).toContain("AdminSortableTh");
    expect(src).toContain("sortRowsByKey");
  });

  it("keeps admin fetch envelope + DOM anchor + log tag", () => {
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminTrustGrowthPage"');
    expect(src).toContain("AdminListFetchError");
  });
});
