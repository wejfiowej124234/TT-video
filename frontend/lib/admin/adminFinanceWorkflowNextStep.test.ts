import { describe, expect, it } from "vitest";

import { adminFinanceWorkflowNextStep } from "@/lib/admin/adminFinanceWorkflowNextStep";

describe("adminFinanceWorkflowNextStep", () => {
  it("returns settlement after reconciliation", () => {
    const next = adminFinanceWorkflowNextStep("reconciliation");
    expect(next?.id).toBe("settlement");
  });

  it("returns null after audit (last step)", () => {
    expect(adminFinanceWorkflowNextStep("audit")).toBeNull();
  });
});
