import { describe, expect, it } from "vitest";
import {
  formatTraveltrustTtgPlannedOpenDate,
  listTraveltrustTtgPublicRounds,
  resolveTraveltrustTtgRoundDistributionText,
  TRAVELTRUST_TTG_PUBLIC_ROUNDS,
} from "./traveltrustTtgPublicRounds";

describe("traveltrustTtgPublicRounds", () => {
  it("ACTIVE list is empty (legacy three-round UI disabled)", () => {
    expect(listTraveltrustTtgPublicRounds()).toEqual([]);
  });

  it("legacy constant keeps three closed long buckets for import stability", () => {
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS).toHaveLength(3);
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS.reduce((s, r) => s + r.allocationTtg, 0)).toBe(
      12_500_000_000_000,
    );
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS.every((r) => r.status === "closed")).toBe(true);
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS.every((r) => r.perWalletCapTtg === 0)).toBe(true);
  });

  it("legacy round 1 still links params; rounds 2–3 still reference proposals", () => {
    expect(TRAVELTRUST_TTG_PUBLIC_ROUNDS[0]?.paramsHref).toBe("/governance/params");
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
