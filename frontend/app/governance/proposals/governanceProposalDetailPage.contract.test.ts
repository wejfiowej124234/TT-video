import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernanceProposalDetailPage pre-exec surface (A-04)", () => {
  const src = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("renders GovernancePreExecutionHint once, in a section before proposal body", () => {
    const idxSection = src.indexOf('id="gov-pre-exec"');
    const idxBody = src.indexOf('id="gov-prop-body"');
    expect(idxSection).toBeGreaterThan(-1);
    expect(idxBody).toBeGreaterThan(-1);
    expect(idxSection).toBeLessThan(idxBody);
    expect((src.match(/<GovernancePreExecutionHint\b/g) ?? []).length).toBe(1);
  });
});

describe("GovernanceProposalDetailPage execution readiness (A-05)", () => {
  const src = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("wires execution readiness from deriveGovernanceExecutionReadiness and vote aria-describedby", () => {
    expect(src).toContain("deriveGovernanceExecutionReadiness");
    expect(src).toContain("GovernanceProposalExecutionReadinessPanel");
    expect(src).toContain("GovernanceProposalExecutionVoteFooter");
    expect(src).toContain("GOV_EXEC_READINESS_DESC_ID");
    expect(src).toContain("GOV_EXEC_READINESS_VOTE_FOOTER_ID");
    expect(src).toContain("aria-describedby");
  });
});

describe("GovernanceProposalDetailPage execution actions skeleton (A-06)", () => {
  const src = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("renders Timelock action placeholder when on-chain governor", () => {
    expect(src).toContain("GovernanceProposalExecutionActionsSkeleton");
    expect(src).toContain("executionReadiness");
  });
});

describe("GovernanceProposalDetailPage list→detail bridge (A-09)", () => {
  const src = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("surfaces continuation copy from shared narrative when on-chain governor", () => {
    expect(src).toContain("GovExecReadOnlyI18n.detailContinuationBridge");
    expect(src).toContain("gov-exec-detail-bridge");
  });
});

describe("GovernanceProposalDetailPage B-408 impact panel", () => {
  const src = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");

  it("renders GovernanceProposalImpactPanel wired to meta contracts and chain snapshot", () => {
    expect(src).toContain("GovernanceProposalImpactPanel");
    expect(src).toContain("chainContractsFromMeta");
    expect(src).toContain("metaContracts");
  });
});
