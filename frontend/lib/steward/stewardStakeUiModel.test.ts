import { describe, expect, it } from "vitest";

import {
  formatProtocolStewardStakeTtgUnits,
  formatTtgAmount,
  stewardOffchainSeatLabelKey,
  isMultiDemoStewardWallet,
  MULTI_DEMO_STEWARD_WALLET,
  isValidEvmWalletAddress,
  stewardChainStakeSummaryKey,
  stewardShowsOnboardingCta,
  stewardStakeSectionTitleKey,
} from "./stewardStakeUiModel";

describe("stewardStakeUiModel (① · workbench UX)", () => {
  it("formats wei to human TTG", () => {
    expect(formatTtgAmount(BigInt("400000000000000000000"), 18)).toBe("400");
  });

  it("formats canonical CN min stake from chain (400k TTG · 18 decimals)", () => {
    expect(formatTtgAmount(BigInt("400000000000000000000000"), 18)).toBe("400,000");
  });

  it("rejects unformatted wei when decimals mismatch", () => {
    expect(formatTtgAmount(BigInt("400000000000000000000"), 0)).toBeNull();
  });

  it("falls back to protocol-ssot TTG units for CN-ZJ", () => {
    const formatted = formatProtocolStewardStakeTtgUnits("CN-ZJ");
    expect(formatted).toBeTruthy();
    expect(formatted!.replace(/,/g, "")).toBe("400000");
  });

  it("uses lifecycle-driven stake section titles", () => {
    expect(stewardStakeSectionTitleKey("draft", false)).toBe("stewardSeat_stake_section_application");
    expect(stewardStakeSectionTitleKey("approved", false)).toBe("stewardSeat_stake_section_active");
    expect(stewardStakeSectionTitleKey("approved", true)).toBe("stewardSeat_release_section");
  });

  it("hides onboarding CTA when approved or in release", () => {
    expect(stewardShowsOnboardingCta("approved")).toBe(false);
    expect(stewardShowsOnboardingCta("stake_release_pending")).toBe(false);
    expect(stewardShowsOnboardingCta("under_review")).toBe(true);
  });

  it("maps chain summary by wallet connection and row state", () => {
    expect(
      stewardChainStakeSummaryKey([{ hasStake: null }], { isConnected: false, walletMatch: false }),
    ).toBe("steward_workbench_stake_chain_summary_connect");
    expect(
      stewardChainStakeSummaryKey([{ hasStake: null }], { isConnected: true, walletMatch: false }),
    ).toBe("steward_workbench_stake_chain_summary_wallet_mismatch");
    expect(
      stewardChainStakeSummaryKey([{ hasStake: true }], { isConnected: true, walletMatch: true }),
    ).toBe("steward_workbench_stake_chain_summary_staked");
  });

  it("detects multi-demo steward wallet (Anvil deployer + legacy synthetic)", () => {
    expect(isMultiDemoStewardWallet(MULTI_DEMO_STEWARD_WALLET)).toBe(true);
    expect(isValidEvmWalletAddress(MULTI_DEMO_STEWARD_WALLET)).toBe(true);
    expect(isMultiDemoStewardWallet("0x4d554c5449000000000000000000000000000001")).toBe(true);
    expect(isValidEvmWalletAddress("0x4d554c5449000000000000000000000000000001")).toBe(true);
  });
});
