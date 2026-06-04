import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminDriftSummaryPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminDriftSummaryPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminDriftSummaryPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin drift-summary page", () => {
  const src = readModuleSources();

  it("keeps drift-summary client fetch + normalize", () => {
    expect(src).toContain("getAdminDriftSummary");
    expect(src).toContain("normalizeAdminDriftSummaryRead");
  });

  it("keeps admin DOM anchor and fetch log tag", () => {
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminDriftSummaryPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminFinanceModuleDepthWorkspace");
    expect(src).toContain("AdminSearchParamsSuspense");
  });
});
