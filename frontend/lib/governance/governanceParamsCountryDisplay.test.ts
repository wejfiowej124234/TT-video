import { describe, expect, it } from "vitest";
import { resolvePhase1CountryDisplay } from "./governanceParamsCountryDisplay";

describe("resolvePhase1CountryDisplay", () => {
  const row = {
    name_zh: "中国",
    tier: "T1",
    national_pool_cap_fee_points: 100,
    phase1_open_fee_points: 50,
    fundraise_target_cny_wan: 1000,
    fundraise_cap_cny_wan: 2000,
    notes: "主要入境市场",
  };

  it("keeps zh names for zh locale", () => {
    const d = resolvePhase1CountryDisplay(row, "zh-CN");
    expect(d.name).toBe("中国");
    expect(d.notes).toBe("主要入境市场");
  });

  it("maps zh country names to EN for en locale", () => {
    const d = resolvePhase1CountryDisplay(row, "en");
    expect(d.name).toBe("China");
    expect(d.notes).toBeTruthy();
  });
});
