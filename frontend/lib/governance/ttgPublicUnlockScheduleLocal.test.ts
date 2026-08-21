import { describe, expect, it } from "vitest";
import {
  TTG_PUBLIC_SALE_UNIT_PRICES_USDC,
  TTG_PUBLIC_UNLOCK_BATCHES,
  TTG_PUBLIC_UNLOCK_DATES,
  TTG_PUBLIC_UNLOCK_FIRST_PCT,
  TTG_PUBLIC_UNLOCK_TOTAL_PCT,
  TTG_PUBLIC_UNLOCK_TOTAL_TTG,
  TTG_PUBLIC_UNLOCK_META,
  TTG_TOTAL_SUPPLY,
  formatTtgUnlockAmount,
  formatUnlockUnitPrice,
  quoteTtgPublicSaleFromUsdc,
  resolveTtgPublicSaleFocus,
} from "./ttgPublicUnlockScheduleLocal";

describe("ttgPublicUnlockScheduleLocal", () => {
  it("uses Owner geometric unlock inside public 50%", () => {
    expect(TTG_PUBLIC_UNLOCK_FIRST_PCT).toBe(0.00005);
    expect(TTG_PUBLIC_UNLOCK_BATCHES).toHaveLength(5);
    expect(TTG_PUBLIC_UNLOCK_BATCHES[0].amountTtg).toBe(1_250_000_000);
    expect(TTG_PUBLIC_UNLOCK_BATCHES[1].amountTtg).toBe(3_750_000_000);
    expect(TTG_PUBLIC_UNLOCK_BATCHES[2].amountTtg).toBe(18_750_000_000);
    expect(TTG_PUBLIC_UNLOCK_BATCHES[3].amountTtg).toBe(168_750_000_000);
    expect(TTG_PUBLIC_UNLOCK_BATCHES[4].amountTtg).toBe(2_025_000_000_000);
    expect(TTG_PUBLIC_UNLOCK_TOTAL_TTG).toBe(2_217_500_000_000);
    expect(TTG_PUBLIC_UNLOCK_TOTAL_PCT).toBeCloseTo(0.0887, 5);
    expect(TTG_PUBLIC_UNLOCK_TOTAL_TTG).toBeLessThan(TTG_TOTAL_SUPPLY * 0.5);
    expect(formatTtgUnlockAmount(1_250_000_000)).toBe("1,250,000,000");
  });

  it("uses Owner batch sale prices and dates", () => {
    expect([...TTG_PUBLIC_SALE_UNIT_PRICES_USDC]).toEqual([
      0.000001, 0.000003, 0.000005, 0.000007, 0.000009,
    ]);
    expect([...TTG_PUBLIC_UNLOCK_DATES]).toEqual([
      "2026-10-15T09:00:00Z",
      "2026-12-15T09:00:00Z",
      "2027-02-15T09:00:00Z",
      "2027-04-15T09:00:00Z",
      "2027-06-15T09:00:00Z",
    ]);
    expect(TTG_PUBLIC_UNLOCK_BATCHES.map((b) => b.unitPriceUsdc)).toEqual([
      ...TTG_PUBLIC_SALE_UNIT_PRICES_USDC,
    ]);
    expect(TTG_PUBLIC_UNLOCK_BATCHES.map((b) => b.at)).toEqual([...TTG_PUBLIC_UNLOCK_DATES]);
    expect(formatUnlockUnitPrice(0.000001)).toBe("0.00000100");
    expect(formatUnlockUnitPrice(0.000009)).toBe("0.00000900");
  });

  it("never date-drives open — Phase1 cutover pending (W-P0-05)", () => {
    const before = resolveTtgPublicSaleFocus(Date.parse("2026-08-18T00:00:00Z"));
    const during = resolveTtgPublicSaleFocus(Date.parse("2026-11-01T00:00:00Z"));
    expect(before.batch.id).toBe(1);
    expect(before.kind).toBe("upcoming");
    expect(during.kind).toBe("upcoming");
    const quote = quoteTtgPublicSaleFromUsdc("100", before.batch.unitPriceUsdc);
    expect(quote?.receiveTtg).toBe("100000000");
    expect(quote?.rateUsdcPerTtg).toBe("0.00000100");
    expect(TTG_PUBLIC_UNLOCK_META).toEqual({
      unlockClass: "TTG_PUBLIC_SALE_BATCH_LADDER_LOCAL",
      publicAllocationPct: 0.5,
    });
    expect(quoteTtgPublicSaleFromUsdc("0.5", 0.000001)).toBeNull();
  });
});
