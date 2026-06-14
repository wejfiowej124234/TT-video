import { describe, expect, it } from "vitest";

import {
  formatStakeAmountForApi,
  parseGuideIdFromMe,
} from "./stakingGuideDbSync";

describe("stakingGuideDbSync", () => {
  it("parses guide id from GET /me", () => {
    expect(parseGuideIdFromMe({ guide: { id: "550e8400-e29b-41d4-a716-446655440000" } })).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(parseGuideIdFromMe({ guide: null })).toBeNull();
  });

  it("formats stake amount for API without trailing zeros", () => {
    expect(formatStakeAmountForApi(BigInt(1_000_000_000), 6)).toBe("1000");
    expect(formatStakeAmountForApi(BigInt(1_500_000), 6)).toBe("1.5");
    expect(formatStakeAmountForApi(BigInt(0), 6)).toBe("0");
  });
});
