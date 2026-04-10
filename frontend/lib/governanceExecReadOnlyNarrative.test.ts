import { describe, expect, it } from "vitest";
import { GovExecReadOnlyI18n, isGovernorStateLabelQueued } from "./governanceExecReadOnlyNarrative";
import { governanceExecReadinessDetailKey } from "./governanceExecutionReadiness";

describe("GovExecReadOnlyI18n (A-08 SSOT)", () => {
  it("pins shared keys used by list and detail", () => {
    expect(GovExecReadOnlyI18n.readonlyCaption).toBe("governance_exec_shared_readonly_caption");
    expect(GovExecReadOnlyI18n.sharedQueuedExplanation).toBe("governance_exec_shared_queued_explanation");
    expect(GovExecReadOnlyI18n.sharedLimitsSkeleton).toBe("governance_exec_shared_limits_skeleton");
    expect(GovExecReadOnlyI18n.sharedListQueuedHint).toBe("governance_exec_shared_list_queued_hint");
    expect(GovExecReadOnlyI18n.listEntryBridge).toBe("governance_exec_list_entry_bridge");
    expect(GovExecReadOnlyI18n.detailContinuationBridge).toBe("governance_exec_detail_continuation_bridge");
    expect(GovExecReadOnlyI18n.proposalLinkContinueTitle).toBe("governance_exec_proposal_link_continue_title");
  });

  it("aligns readiness Queued bucket with shared queued explanation key", () => {
    expect(governanceExecReadinessDetailKey({ kind: "executable", sourceState: "queued" })).toBe(
      GovExecReadOnlyI18n.sharedQueuedExplanation,
    );
  });
});

describe("isGovernorStateLabelQueued", () => {
  it("normalizes case", () => {
    expect(isGovernorStateLabelQueued("Queued")).toBe(true);
    expect(isGovernorStateLabelQueued("active")).toBe(false);
  });
});
