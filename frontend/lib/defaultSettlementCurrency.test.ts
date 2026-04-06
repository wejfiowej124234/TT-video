import { describe, it, expect } from "vitest";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "./defaultSettlementCurrency";

describe("defaultSettlementCurrency", () => {
  it("matches order card / API default token label (USDC)", () => {
    expect(DEFAULT_SETTLEMENT_CURRENCY_CODE).toBe("USDC");
  });
});
