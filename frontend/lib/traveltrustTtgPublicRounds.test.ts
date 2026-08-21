import { describe, expect, it } from "vitest";
import {
  formatTraveltrustTtgPlannedOpenDate,
  listTraveltrustTtgPublicRounds,
  resolveTraveltrustTtgRoundDistributionText,
  TRAVELTRUST_TTG_PUBLIC_ROUNDS,
} from "./traveltrustTtgPublicRounds";

describe("traveltrustTtgPublicRounds", () => {  it("lists three public rounds with frozen allocations", () => {
    const rounds = listTraveltrustTtgPublicRounds();
    expect(rounds).toHaveLength(3);
    expect(rounds[0]?.allocationTtg).toBe(2_000_000_000_000);
    expect(rounds[1]?.allocationTtg).toBe(3_000_000_000_000);
    expect(rounds[2]?.allocationTtg).toBe(7_500_000_000_000);
    expect(rounds.reduce((s, r) => s + r.allocationTtg, 0)).toBe(12_500_000_000_000);
    expect(rounds.every((r) => r.perWalletCapTtg === 0)).toBe(true);
  });

  it("round 1 defaults to upcoming until ops flips status", () => {
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[0]?.status).toBe("upcoming");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[0]?.paramsHref).toBe("/governance/params");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[0]?.ctaHref).toBe("/governance/params");
  });

  it("rounds 2–3 require governance approval and link to proposals", () => {
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[1]?.status).toBe("governance_approval_required");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[2]?.status).toBe("governance_approval_required");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[1]?.requiresGovernanceApproval).toBe(true);
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[1]?.ctaHref).toBe("/governance/proposals");
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[2]?.ctaHref).toBe("/governance/proposals");
  });

  it("round 1 distribution includes full planned open date", () => {
    const dateZh = formatTraveltrustTtgPlannedOpenDate("2026-10-15", "zh");
    expect(dateZh).toMatch(/2026/);
    const text = resolveTraveltrustTtgRoundDistributionText(
      TRAVELTRUST_TTG_PUBLIC_ROUNDS[0]!,
      (key, vars) => `${key}:${vars?.date ?? ""}`,
      "zh",
    );
    expect(text).toContain("2026");
  });
  it("public rounds do not declare purchase lock-up (steward stake is separate)", () => {
    for (const round of TRAVELTRUST_TTG_PUBLIC_ROUNDS) {
      expect(round).not.toHaveProperty("lockMonths");
      expect(round.distributionKey).toMatch(/^traveltrust_ttg_round_distribution_/);
    }
  });
});
