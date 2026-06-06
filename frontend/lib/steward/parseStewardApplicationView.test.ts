import { describe, expect, it } from "vitest";

import { parseStewardApplicationStakeView } from "./parseStewardApplicationView";

describe("parseStewardApplicationStakeView", () => {
  it("parses application id, wallet, jurisdictions", () => {
    const v = parseStewardApplicationStakeView({
      application: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "stake_pending",
        jurisdictions: ["US", "FR"],
        wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
      },
    });
    expect(v?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(v?.jurisdictions).toEqual(["US", "FR"]);
    expect(v?.walletAddress).toMatch(/^0x/i);
  });

  it("returns null when application missing", () => {
    expect(parseStewardApplicationStakeView({ application: null })).toBeNull();
  });
});
