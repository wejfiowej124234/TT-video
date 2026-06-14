import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("GovernanceProposalDetailPage pre-exec surface (A-04)", () => {
  const articleSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailLoadedArticle.tsx"), "utf8");

  it("renders GovernancePreExecutionHint once, in a section before proposal body", () => {
    const idxSection = articleSrc.indexOf('id="gov-pre-exec"');
    const idxBody = articleSrc.indexOf('id="gov-prop-body"');
    expect(idxSection).toBeGreaterThan(-1);
    expect(idxBody).toBeGreaterThan(-1);
    expect(idxSection).toBeLessThan(idxBody);
    expect((articleSrc.match(/<GovernancePreExecutionHint\b/g) ?? []).length).toBe(1);
  });
});

describe("GovernanceProposalDetailPage execution readiness (A-05)", () => {
  const articleSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailLoadedArticle.tsx"), "utf8");

  it("wires execution readiness panel and on-chain vote panel", () => {
    expect(articleSrc).toContain("GovernanceProposalExecutionReadinessPanel");
    expect(articleSrc).toContain("GovernanceProposalExecutionVoteFooter");
    expect(articleSrc).toContain("GovernanceOnChainVotePanel");
  });
});

describe("GovernanceProposalDetailPage execution actions panel (A-06)", () => {
  const articleSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailLoadedArticle.tsx"), "utf8");

  it("renders Timelock wallet actions, cancel panel, and operationId when on-chain governor", () => {
    expect(articleSrc).toContain("GovernanceProposalExecutionActionsPanel");
    expect(articleSrc).toContain("GovernanceProposalCancelPanel");
    expect(articleSrc).toContain("operationId={proposal.operation_id}");
    expect(articleSrc).toContain("executionReadiness");
  });
});

describe("GovernanceProposalDetailPage list→detail bridge (A-09)", () => {
  const articleSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailLoadedArticle.tsx"), "utf8");

  it("surfaces continuation copy from shared narrative when on-chain governor", () => {
    expect(articleSrc).toContain("GovExecReadOnlyI18n.detailContinuationBridge");
    expect(articleSrc).toContain("gov-exec-detail-bridge");
  });
});

describe("GovernanceProposalDetailPage B-408 impact panel", () => {
  const articleSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailLoadedArticle.tsx"), "utf8");

  it("renders GovernanceProposalImpactPanel wired to meta contracts and chain snapshot", () => {
    expect(articleSrc).toContain("GovernanceProposalImpactPanel");
    expect(articleSrc).toContain("metaContracts");
  });
});

describe("GovernanceProposalDetailPage route shell", () => {
  const pageSrc = readFileSync(join(__dir, "[id]", "page.tsx"), "utf8");
  const mainSrc = readFileSync(join(__dir, "[id]", "GovernanceProposalDetailPageMain.tsx"), "utf8");

  it("delegates to GovernanceProposalDetailPageMain", () => {
    expect(pageSrc).toContain("GovernanceProposalDetailPageMain");
  });

  it("uses proposals L5 hero shell", () => {
    expect(mainSrc).toContain("GOV_PROPOSALS_L5");
    expect(mainSrc).toContain("GovernanceProposalsL5Shell");
    expect(mainSrc).toContain('pageKind="detail"');
    expect(mainSrc).toContain("GovernanceProposalsSubpageNav");
  });
});
