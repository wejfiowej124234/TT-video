import { describe, expect, it } from "vitest";
import {
  formatPhase1StewardStakeTtg,
  resolvePhase1CountryDisplay,
  resolvePhase1CountryProtocolStake,
} from "./governanceParamsCountryDisplay";

describe("resolvePhase1CountryDisplay", () => {
  const row = {
    name_zh: "中国",
    tier: "S",
    national_pool_cap_fee_points: 4,
    phase1_open_fee_points: 3,
    fundraise_target_cny_wan: 8000,
    notes: "入境旅游大国",
  };

  it("keeps zh names for zh locale", () => {
    const d = resolvePhase1CountryDisplay(row, "zh-CN");
    expect(d.name).toBe("中国");
    expect(d.notes).toBe("入境旅游大国");
  });

  it("maps zh country names to EN for en locale", () => {
    const d = resolvePhase1CountryDisplay(row, "en");
    expect(d.name).toBe("China");
    expect(d.notes).toBeTruthy();
  });
});

describe("resolvePhase1CountryProtocolStake", () => {
  const cnRow = {
    name_zh: "中国",
    tier: "S",
    national_pool_cap_fee_points: 4,
    phase1_open_fee_points: 3,
    fundraise_target_cny_wan: 8000,
    notes: "入境旅游大国",
  };

  it("maps CN 84 row to protocol-ssot steward stake (400 bps → 400,000 TTG)", () => {
    const stake = resolvePhase1CountryProtocolStake(cnRow);
    expect(stake).not.toBeNull();
    expect(stake!.jurisdictionId).toBe("CN");
    expect(stake!.stewardStakeBps).toBe(400);
    expect(stake!.stewardStakeTtgUnits).toBe(400_000);
    expect(stake!.feeCapFeePointsAligned).toBe(true);
    expect(stake!.openFeePointsAligned).toBe(true);
  });

  it("formats CN steward stake TTG for zh locale", () => {
    expect(formatPhase1StewardStakeTtg(400_000, "zh-CN")).toBe("400,000");
  });

  it("returns null for unknown country name", () => {
    expect(
      resolvePhase1CountryProtocolStake({
        ...cnRow,
        name_zh: "未知国",
      }),
    ).toBeNull();
  });
});
