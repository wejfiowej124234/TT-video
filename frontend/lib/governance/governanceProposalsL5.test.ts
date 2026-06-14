import { describe, expect, it } from "vitest";
import {
  canAdvanceGovernanceCreateStep,
  deriveGovernanceProposalRiskTags,
  validateGovernanceCalldataHex,
} from "@/lib/governance/governanceProposalCreateModel";
import { governanceCastVoteSupportFromChoice } from "@/lib/governance/travelTrustGovernorAbi";
import { filterGovernanceProposals, formatGovernanceProposalIdForList, computeGovernanceVoteBarSegments, parseGovernanceVoteCount, matchesGovernanceStatusFilter } from "@/lib/governance/governanceProposalsListModel";

describe("governanceProposalCreateModel", () => {
  it("maps vote choices to Governor support enum", () => {
    expect(governanceCastVoteSupportFromChoice("yes")).toBe(1);
    expect(governanceCastVoteSupportFromChoice("no")).toBe(0);
    expect(governanceCastVoteSupportFromChoice("abstain")).toBe(2);
  });

  it("validates calldata hex", () => {
    expect(validateGovernanceCalldataHex("0x")).toBe(true);
    expect(validateGovernanceCalldataHex("0x1234")).toBe(true);
    expect(validateGovernanceCalldataHex("not-hex")).toBe(false);
  });

  it("derives treasury risk when target matches meta treasury", () => {
    const tags = deriveGovernanceProposalRiskTags(
      {
        templateId: "custom",
        title: "t",
        summary: "s",
        targetAddress: "0x0000000000000000000000000000000000000001",
        calldataHex: "0x",
        ethValue: "0",
        advancedMode: false,
        actions: [{ targetAddress: "0x0000000000000000000000000000000000000001", calldataHex: "0x", ethValue: "0" }],
      },
      { treasury_address: "0x0000000000000000000000000000000000000001" },
    );
    expect(tags).toContain("treasury");
  });

  it("requires title and summary before action step", () => {
    expect(
      canAdvanceGovernanceCreateStep("details", {
        templateId: "custom",
        title: "abcd",
        summary: "12345678",
        targetAddress: "",
        calldataHex: "0x",
        ethValue: "0",
        advancedMode: false,
        actions: [{ targetAddress: "", calldataHex: "0x", ethValue: "0" }],
      }),
    ).toBe(true);
  });
});

describe("governanceProposalsListModel", () => {
  it("filters active proposals using exec status", () => {
    const items = [{ id: "1", title: "A" }, { id: "2", title: "B" }];
    const exec = {
      "1": { state: "ok" as const, status: "active", is_chain_ssot: true },
      "2": { state: "ok" as const, status: "pending", is_chain_ssot: true },
    };
    expect(filterGovernanceProposals(items, "active", exec)).toHaveLength(1);
    expect(matchesGovernanceStatusFilter(items[1]!, "pending", exec["2"])).toBe(true);
  });

  it("truncates long proposal ids for list cards", () => {
    const long = "911919911919911919911919911919";
    const out = formatGovernanceProposalIdForList(long);
    expect(out.display).toContain("…");
    expect(out.full).toBe(long);
  });

  it("computes vote bar segments from tallies", () => {
    const { total, segments } = computeGovernanceVoteBarSegments(7, 2, 1);
    expect(total).toBe(10);
    expect(segments.find((s) => s.key === "yes")?.percent).toBe(70);
  });

  it("parses string vote counts from chain", () => {
    expect(parseGovernanceVoteCount("42")).toBe(42);
    expect(parseGovernanceVoteCount(undefined)).toBe(0);
  });
});
