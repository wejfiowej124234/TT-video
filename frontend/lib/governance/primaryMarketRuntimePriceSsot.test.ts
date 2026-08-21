import { describe, expect, it } from "vitest";
import {
  PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG,
  PRIMARY_MARKET_LIVE_CLASS,
  PRIMARY_MARKET_LIVE_MIN_USDC,
  PRIMARY_MARKET_LIVE_TTG_PER_USDC,
  PRIMARY_MARKET_LIVE_USDC_PER_TTG,
  PUBLIC_SALE_ROUND_NOTIONAL_USDC,
  SEAT_FUNDING_DISCLOSURE,
  SEAT_FUNDING_NOTIONAL_USDC_TOTAL,
  formatLiveUsdcPerTtg,
  primaryMarketDualQuote,
  quoteTtgLocalFirstPaintFromUsdc,
  quoteUsdcToTtg,
} from "@/lib/governance/primaryMarketRuntimePriceSsot";

describe("primaryMarketRuntimePriceSsot", () => {
  it("dual-quotes 10 USDC as V8 live 1_000_000 vs LEGACY $25 0.4", () => {
    const d = primaryMarketDualQuote(10);
    expect(d.officialRuntime?.receiveTtg).toBe(1_000_000);
    expect(d.economicCandidate?.receiveTtg).toBe(0.4);
    expect(d.executePending).toBe(false);
    expect(d.liveClass).toBe("TTG_V8_OFFICIAL_RUNTIME_QUOTE");
  });

  it("public sale notional at $25 matches Owner freeze", () => {
    expect(PUBLIC_SALE_ROUND_NOTIONAL_USDC.r1_800k_ttg).toBe(20_000_000);
    expect(PUBLIC_SALE_ROUND_NOTIONAL_USDC.r2_1_2m_ttg).toBe(30_000_000);
    expect(PUBLIC_SALE_ROUND_NOTIONAL_USDC.r3_3m_ttg).toBe(75_000_000);
    expect(PUBLIC_SALE_ROUND_NOTIONAL_USDC.total_5m_ttg).toBe(125_000_000);
  });

  it("seat funding is notional not cash raised", () => {
    expect(SEAT_FUNDING_NOTIONAL_USDC_TOTAL).toBe(72_500_000);
    expect(SEAT_FUNDING_DISCLOSURE).toBe("notional_acquisition_value_not_cash_raised");
    expect(quoteUsdcToTtg(25, "economic_candidate")?.receiveTtg).toBe(1);
    expect(PRIMARY_MARKET_LIVE_USDC_PER_TTG).toBe(0.00001);
    expect(quoteUsdcToTtg(1, "official_runtime")?.receiveTtg).toBe(100_000);
    expect(quoteUsdcToTtg(100, "official_runtime")?.receiveTtg).toBe(10_000_000);
    expect(PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG).toBe(25);
  });

  it("local Gateway first-paint matches V8 Active Truth (not Official www 3.6000 mock)", () => {
    expect(PRIMARY_MARKET_LIVE_MIN_USDC).toBe(1);
    expect(PRIMARY_MARKET_LIVE_TTG_PER_USDC).toBe(100_000);
    expect(formatLiveUsdcPerTtg()).toBe("0.00001000");
    expect(quoteTtgLocalFirstPaintFromUsdc("0.5")).toBeNull();
    expect(quoteTtgLocalFirstPaintFromUsdc("0")).toBeNull();
    const one = quoteTtgLocalFirstPaintFromUsdc("1");
    expect(one).toEqual({
      receiveTtg: "100000",
      payUsdc: 1,
      rateUsdcPerTtg: "0.00001000",
      referencePriceUsdcPerTtg: 0.00001,
      liveClass: PRIMARY_MARKET_LIVE_CLASS,
    });
    const def = quoteTtgLocalFirstPaintFromUsdc("100");
    expect(def?.receiveTtg).toBe("10000000");
    expect(def?.rateUsdcPerTtg).toBe("0.00001000");
    expect(def?.receiveTtg).not.toBe("3.6000");
    expect(Number(def?.receiveTtg)).not.toBeCloseTo(3.6, 4);
  });
});
