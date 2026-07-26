import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("admin finance page (① · FIN-02 partial)", () => {
  const page = readFileSync(join(__dir, "page.tsx"), "utf8");
  const main = readFileSync(join(__dir, "AdminFinancePageMain.tsx"), "utf8");

  it("wraps finance main in search-params suspense and partial depth notice", () => {
    expect(page).toContain("AdminSearchParamsSuspense");
    expect(main).toContain("AdminFinanceSuiteDepthNotice");
    expect(main).toContain("AdminFinanceSuitePartialChecklist");
    expect(main).toContain("fin_suite_module");
    expect(main).toContain("data-tt-admin-fin-suite-export-focus");
    expect(main).toContain("AdminFinancePeriodControl");
    expect(main).toContain("data-tt-admin-finance-treasury-bridge");
    expect(main).toContain("AdminHomeTreasuryPoolStrip");
    const depthNotice = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceSuiteDepthNotice.tsx"),
      "utf8",
    );
    expect(depthNotice).toContain("data-tt-admin-fin-suite-settlement-hint");
    expect(depthNotice).toContain("AdminFinanceWorkflowCompactNav");
    const compactNav = readFileSync(
      join(__dir, "..", "..", "..", "components", "admin", "AdminFinanceWorkflowCompactNav.tsx"),
      "utf8",
    );
    expect(compactNav).toContain("data-tt-admin-fin-workflow-compact-next");
  });
});
