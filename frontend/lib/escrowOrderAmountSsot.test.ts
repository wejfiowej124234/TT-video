import { describe, expect, it } from "vitest";
import {
  formatEscrowStablecoinCurrency,
  normalizeBreakdownTotals,
  resolveEscrowDisplayAmount,
  sumEscrowBreakdownParts,
} from "./escrowOrderAmountSsot";

describe("escrowOrderAmountSsot", () => {
  it("flags order.amount vs total_budget when line items agree with budget", () => {
    const r = resolveEscrowDisplayAmount("1350", {
      hotel: 500,
      catering: 400,
      guide_fee: 300,
      platform_fee: 250,
      total_budget: 1450,
    });
    expect(r.displayAmount).toBe("1450.00");
    expect(r.amountMismatch).toBe(true);
    expect(r.lineItemsMismatch).toBe(false);
    expect(r.orderAmountNum).toBe(1350);
  });

  it("sums line items when total_budget absent", () => {
    expect(
      sumEscrowBreakdownParts({
        hotel: 100,
        catering: 50,
        platform_fee: 10,
      }),
    ).toBe(160);
  });

  it("maps USD to USDC label in experience draft", () => {
    expect(formatEscrowStablecoinCurrency("USD")).toBe("USDC");
    expect(formatEscrowStablecoinCurrency("EUR")).toBe("EUR");
  });

  it("normalizeBreakdownTotals sets total_budget to line sum", () => {
    const out = normalizeBreakdownTotals({
      hotel: 100,
      catering: 50,
      total_budget: 999,
    });
    expect(out?.total_budget).toBe(150);
  });

  it("prefers line sum when parts do not add up to total_budget", () => {
    const r = resolveEscrowDisplayAmount("1350", {
      hotel: 472,
      catering: 338,
      tickets: 203,
      guide_fee: 203,
      vehicle: 68,
      platform_fee: 68,
      total_budget: 1350,
    });
    expect(r.displayAmount).toBe("1352.00");
    expect(r.lineItemsMismatch).toBe(true);
    expect(r.amountMismatch).toBe(true);
  });

  it("clears amount mismatch when order.amount matches displayed canonical total", () => {
    const r = resolveEscrowDisplayAmount("1352", {
      hotel: 472,
      catering: 338,
      tickets: 203,
      guide_fee: 203,
      vehicle: 68,
      platform_fee: 68,
      total_budget: 1350,
    });
    expect(r.displayAmount).toBe("1352.00");
    expect(r.amountMismatch).toBe(false);
  });
});
