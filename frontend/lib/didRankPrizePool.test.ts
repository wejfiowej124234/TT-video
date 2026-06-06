import { describe, expect, it } from "vitest";
import {
  DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT,
  formatDidRankPrizePoolAmount,
} from "@/lib/didRankPrizePool";

describe("didRankPrizePool", () => {
  it("formats monthly pool with grouping", () => {
    expect(formatDidRankPrizePoolAmount(DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT)).toBe("100,000");
    expect(formatDidRankPrizePoolAmount(0)).toBe("0");
  });
});
