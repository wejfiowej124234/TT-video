import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernanceProposalExecutionActionsSkeleton limits copy (A-07)", () => {
  const src = readFileSync(join(__dir, "GovernanceProposalExecutionActionsSkeleton.tsx"), "utf8");

  it("embeds limits/risk i18n keys for queued vs execute disclaimers", () => {
    expect(src).toContain("governance_exec_actions_limits_aria");
    expect(src).toContain("governance_exec_actions_limits_heading");
    expect(src).toContain("GovExecReadOnlyI18n.sharedLimitsSkeleton");
    expect(src).toContain("GovExecReadOnlyI18n.sharedQueuedExplanation");
  });
});
