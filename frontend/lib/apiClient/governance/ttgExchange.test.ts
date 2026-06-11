import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("governance ttgExchange routes", () => {
  it("quote path matches page-brief liquidity_contract SSOT", () => {
    expect(routes.governanceTtgExchangeQuote).toBe("/api/v1/governance/ttg-exchange/quote");
  });
});
