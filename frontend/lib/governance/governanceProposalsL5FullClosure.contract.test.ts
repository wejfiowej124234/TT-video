import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS,
  GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE,
  GOVERNANCE_PROPOSALS_L5_ENTERPRISE_AUDIT_SCORE_PHASE1,
  GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER,
  GOVERNANCE_PROPOSALS_L5_LOCALE_KEYS,
  GOVERNANCE_PROPOSALS_L5_OPEN_P0,
  GOVERNANCE_PROPOSALS_L5_OPEN_P1,
  GOVERNANCE_PROPOSALS_L5_UI_FROZEN,
} from "./governanceProposalsL5ClosureSprintModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("governance proposals L5 full closure (① local · frozen · wallet industry)", () => {
  it("freeze doc is ACTIVE and P0/P1 closed with enterprise score 100", () => {
    const freeze = read("evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md");
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(GOVERNANCE_PROPOSALS_L5_UI_FROZEN).toBe(true);
    expect(GOVERNANCE_PROPOSALS_L5_OPEN_P0).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_OPEN_P1).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_ENTERPRISE_AUDIT_SCORE_PHASE1).toBe(100);
  });

  it("wallet L5 locale keys exist in zh/en", () => {
    for (const key of GOVERNANCE_PROPOSALS_L5_LOCALE_KEYS) {
      expect((zh as Record<string, string>)[key], `zh:${key}`).toBeTruthy();
      expect((en as Record<string, string>)[key], `en:${key}`).toBeTruthy();
    }
  });

  it("L5 shell wires frozen marker and closure probe", () => {
    const shell = read("components/governance/GovernanceProposalsL5Shell.tsx");
    expect(shell).toContain("GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER");
    expect(shell).toContain("GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE");
    expect(shell).toContain("data-tt-ui-frozen");
  });

  it("create/detail wire wallet industry panels", () => {
    const wizard = read("components/governance/GovernanceProposalCreateWizard.tsx");
    const detail = read("app/governance/proposals/[id]/GovernanceProposalDetailLoadedArticle.tsx");
    expect(wizard).toContain("buildGovernanceTemplateActionPreset");
    expect(read("components/governance/GovernanceWalletConnectPanel.tsx")).toContain("GovernanceChainMismatchActions");
    expect(detail).toContain("GovernanceProposalCancelPanel");
    expect(detail).toContain("operationId={proposal.operation_id}");
    expect(detail).toContain("governance_voting_power_onchain_snapshot");
  });

  it("smoke script references full closure + playwright specs", () => {
    const smoke = read("../scripts/dev/smoke-governance-proposals-l5-local.sh");
    expect(smoke).toContain("governanceProposalsL5FullClosure.contract.test.ts");
    expect(smoke).toContain("governance-proposal-create-l5.spec.ts");
    expect(smoke).toContain("governance-proposals-full-l5.spec.ts");
    expect(smoke).toContain("TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK");
  });

  it("enterprise audit doc and AGENTS gate exist", () => {
    expect(read("evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-ENTERPRISE-AUDIT.md")).toContain(
      "100 / 100",
    );
    expect(read("../AGENTS.md")).toContain("smoke-governance-proposals-l5-local.sh");
  });

  it("closure probe constants are stable", () => {
    expect(GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE).toBe("governance-proposals-full-v1");
    expect(GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER).toBe("governance-proposals-l5-20260613");
  });
});
