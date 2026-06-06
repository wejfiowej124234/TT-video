import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceSuitePageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "adminFinanceSuitePageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin finance suite page", () => {
  const src = readModuleSources();

  it("keeps finance suite hub anchors + module links", () => {
    expect(src).toContain('"data-tt-admin-finance-suite": "1"');
    expect(src).toContain("FINANCE_SUITE_MODULES");
    expect(src).toContain("/admin/finance-reconciliation");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(src).not.toContain("data-tt-admin-fin-suite-footer-nav");
  });
});
