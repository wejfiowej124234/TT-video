import { describe, expect, it } from "vitest";
import {
  cumulativeStewardStakeBps,
  cumulativeTtgUnitsRequired,
  PROTOCOL_SSOT_VERSION,
  PROTOCOL_SSOT_V1,
} from "./protocolSsot.v1";

describe("protocolSsot.v1", () => {
  it("matches API mirror version 1.0.1", () => {
    expect(PROTOCOL_SSOT_VERSION).toBe("1.0.1");
    expect(PROTOCOL_SSOT_V1.jurisdictions).toHaveLength(10);
  });

  it("CN+FR cumulative steward stake = 850 bps / 850000 TTG", () => {
    expect(cumulativeStewardStakeBps(["CN", "FR"])).toBe(850);
    expect(cumulativeTtgUnitsRequired(["CN", "FR"])).toBe(850_000);
  });

  it("lock tiers include 24mo seat tenure", () => {
    expect(PROTOCOL_SSOT_V1.lock_tiers.steward_seat_min_tenure_months).toBe(24);
  });

  it("redemption lock tiers match API / CountryPoolRedemptionEpochV0 deploy defaults", () => {
    expect(PROTOCOL_SSOT_V1.lock_tiers.redemption_window_days_per_quarter).toBe(15);
    expect(PROTOCOL_SSOT_V1.lock_tiers.redemption_max_nav_pct_bps).toBe(1000);
  });
});
