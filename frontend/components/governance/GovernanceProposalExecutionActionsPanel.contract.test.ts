import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernanceProposalExecutionActionsPanel limits copy (A-07 · live wallet)", () => {
  const src = readFileSync(join(__dir, "GovernanceProposalExecutionActionsPanel.tsx"), "utf8");

  it("embeds limits/risk i18n and timelock wallet writes", () => {
    expect(src).toContain("governance_exec_actions_limits_aria");
    expect(src).toContain("governance_exec_actions_limits_heading");
    expect(src).toContain("GovExecReadOnlyI18n.sharedLimitsSkeleton");
    expect(src).toContain("useGovernanceTimelockActions");
    expect(src).toContain("data-tt-governance-exec-queue");
    expect(src).toContain("data-tt-governance-exec-execute");
    expect(src).toContain("governance_timelock_operation_id");
    expect(src).toContain("GovernanceTxExplorerLink");
  });
});
