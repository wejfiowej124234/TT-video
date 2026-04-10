import { describe, expect, it } from "vitest";
import {
  deriveExecutionActionSurface,
  deriveGovernanceExecutionReadiness,
  governanceExecReadinessDetailKey,
  isGovernanceExecutionReadinessTerminal,
} from "./governanceExecutionReadiness";

describe("deriveGovernanceExecutionReadiness", () => {
  it("off-chain governor → off_chain_signal", () => {
    expect(deriveGovernanceExecutionReadiness(false, { state_live: "active" })).toEqual({
      kind: "off_chain_signal",
      sourceState: "",
    });
  });

  it("on-chain with no state → unknown", () => {
    expect(deriveGovernanceExecutionReadiness(true, {})).toMatchObject({ kind: "unknown", sourceState: "" });
    expect(deriveGovernanceExecutionReadiness(true, null)).toMatchObject({ kind: "unknown", sourceState: "" });
  });

  it("maps Governor states to execution buckets", () => {
    expect(deriveGovernanceExecutionReadiness(true, { state_live: "Executed" })).toMatchObject({
      kind: "executed",
      sourceState: "Executed",
    });
    expect(deriveGovernanceExecutionReadiness(true, { state_live: "queued" })).toMatchObject({
      kind: "executable",
    });
    expect(deriveGovernanceExecutionReadiness(true, { state_live: "Succeeded" })).toMatchObject({
      kind: "before_timelock",
    });
    expect(deriveGovernanceExecutionReadiness(true, { state_live: "active" })).toMatchObject({
      kind: "before_timelock",
    });
    expect(deriveGovernanceExecutionReadiness(true, { state_live: "Defeated" })).toMatchObject({
      kind: "not_executable",
    });
  });

  it("falls back to projection_state when state_live missing", () => {
    expect(
      deriveGovernanceExecutionReadiness(true, { state_live: null, projection_state: "Queued" }),
    ).toMatchObject({ kind: "executable", sourceState: "Queued" });
  });

  it("executed is terminal; queued is non-terminal (state-only buckets, no timelock ETA from API)", () => {
    const ex = deriveGovernanceExecutionReadiness(true, { state_live: "executed" });
    expect(ex.kind).toBe("executed");
    expect(isGovernanceExecutionReadinessTerminal(ex)).toBe(true);

    const q = deriveGovernanceExecutionReadiness(true, { state_live: "queued" });
    expect(q.kind).toBe("executable");
    expect(isGovernanceExecutionReadinessTerminal(q)).toBe(false);
  });
});

describe("deriveExecutionActionSurface", () => {
  it("maps queue/execute placeholders to readiness without extra inference", () => {
    expect(deriveExecutionActionSurface({ kind: "executable", sourceState: "queued" })).toEqual({
      queueEnabled: false,
      executeEnabled: true,
    });
    expect(
      deriveExecutionActionSurface({ kind: "before_timelock", sourceState: "Succeeded" }),
    ).toEqual({ queueEnabled: true, executeEnabled: false });
    expect(deriveExecutionActionSurface({ kind: "executed", sourceState: "executed" })).toEqual({
      queueEnabled: false,
      executeEnabled: false,
    });
    expect(deriveExecutionActionSurface({ kind: "before_timelock", sourceState: "active" })).toEqual({
      queueEnabled: false,
      executeEnabled: false,
    });
  });
});

describe("governanceExecReadinessDetailKey", () => {
  it("aligns kind with i18n detail keys", () => {
    expect(governanceExecReadinessDetailKey({ kind: "executable", sourceState: "q" })).toBe(
      "governance_exec_shared_queued_explanation",
    );
    expect(governanceExecReadinessDetailKey({ kind: "unknown", sourceState: "" })).toBe(
      "governance_exec_readiness_detail_unknown",
    );
  });
});
