import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ESCROW_CONSUMER_L5_SPRINT_ID,
  escrowConsumerChainHref,
  escrowConsumerProofHref,
  resolveEscrowConsumerNextStepKey,
} from "./escrowConsumerL5Model";

const ROOT = process.cwd();
const INDEX = join(ROOT, "components", "escrow", "EscrowDetail", "index.tsx");
const PROOF_PAGE = join(ROOT, "app", "escrow", "[id]", "proof", "EscrowProofPageMain.tsx");
const CHAIN_PAGE = join(ROOT, "app", "escrow", "[id]", "chain", "EscrowChainPageMain.tsx");

describe("ESCROW-L5-CONSUMER-EXPERIENCE-SPRINT (① · non-draft order detail)", () => {
  it("declares sprint id and sub-routes", () => {
    expect(ESCROW_CONSUMER_L5_SPRINT_ID).toContain("escrow-l5-consumer");
    expect(escrowConsumerProofHref("abc")).toBe("/escrow/abc/proof");
    expect(escrowConsumerChainHref("abc")).toBe("/escrow/abc/chain");
  });

  it("resolves consumer next-step for cancelled orders", () => {
    expect(
      resolveEscrowConsumerNextStepKey({ order: { state: "cancelled" }, hasEscrow: false }),
    ).toBe("escrow_consumer_next_cancelled");
  });

  it("EscrowDetail main path mounts consumer L5 blocks and hides engineering panels", () => {
    const src = readFileSync(INDEX, "utf8");
    expect(src).toContain("data-tt-escrow-consumer-l5");
    expect(src).toContain("EscrowConsumerNextStepStrip");
    expect(src).toContain("EscrowConsumerSummaryCard");
    expect(src).toContain("EscrowConsumerFundSafetyStrip");
    expect(src).toContain('data-tt-escrow-consumer-primary-cta="1"');
    expect(src).toContain("EscrowConsumerProofNavLinks");
    expect(src).toContain("hideFeeRouterLinks");
    expect(src).not.toContain("InlineTransparencyVerification");
    expect(src).not.toContain("TrustGrowthMomentBanner");
    expect(src).not.toContain("FinalityBadge");
    expect(src).not.toContain("ChainSyncStatusPanel");
    expect(src).not.toContain("OnchainEventTimeline");
    expect(src).not.toContain("EscrowOnChainActions");
    expect(src).not.toContain("EscrowRiskNotice");
    expect(src).not.toContain("DisputeResolutionFundBlock");
    const createIdx = src.indexOf("CreateOnChainEscrowBlock");
    if (createIdx >= 0) {
      expect(src.indexOf("variantExperience", createIdx)).toBeGreaterThan(createIdx);
    }
  });

  it("proof subpage hosts transparency and evidence", () => {
    const src = readFileSync(PROOF_PAGE, "utf8");
    expect(src).toContain('data-tt-escrow-proof-page="1"');
    expect(src).toContain("InlineTransparencyVerification");
    expect(src).toContain("OrderEvidenceSection");
  });

  it("chain subpage hosts on-chain engineering blocks", () => {
    const src = readFileSync(CHAIN_PAGE, "utf8");
    expect(src).toContain('data-tt-escrow-chain-page="1"');
    expect(src).toContain("CreateOnChainEscrowBlock");
    expect(src).toContain("EscrowOnChainActions");
    expect(src).toContain("EscrowDetailEscrowOverviewPanel");
    expect(src).toContain("EscrowRiskNotice");
  });
});
