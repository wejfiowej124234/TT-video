import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  formatLiveUsdcPerTtg,
  PRIMARY_MARKET_LIVE_TTG_PER_USDC,
  PRIMARY_MARKET_LIVE_USDC_PER_TTG,
  quoteTtgLocalFirstPaintFromUsdc,
} from "@/lib/governance/primaryMarketRuntimePriceSsot";

const REPO = join(__dirname, "..");

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

describe("TTG_V8_QUOTE_SURFACE_LOCAL_CLOSURE", () => {
  it("Gateway first-paint imports V8 SSOT and not Official www 200 CNY mock", () => {
    const src = readFileSync(
      join(REPO, "components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx"),
      "utf8",
    );
    expect(src).toContain("quoteTtgPublicSaleFromUsdc");
    expect(src).not.toContain("quoteTtgLocalFirstPaintFromUsdc");
    expect(src).not.toContain("primaryMarketRuntimePriceSsot");
    expect(src).not.toContain("quoteTtgMockSwapFromUsdc");
    expect(src).not.toContain("TTG_OFFICIAL_WWW_USDC_PER_TTG");
    expect(src).not.toContain("TTG_OFFICIAL_WWW_GATEWAY_ILLUSTRATIVE");
    expect(src).not.toContain("ttgReferencePriceV1");
    expect(src).not.toContain("cny:");
  });

  it("first-paint rate copy matches rail V8 and excludes historical 3.6000 / CNY mock", () => {
    const q = quoteTtgLocalFirstPaintFromUsdc("100");
    expect(q).not.toBeNull();
    const vars = {
      pay: "100",
      receive: q!.receiveTtg,
      rate: q!.rateUsdcPerTtg,
    };
    const zhLine = interpolate(zh.traveltrust_liquidity_rate_line, vars);
    const enLine = interpolate(en.traveltrust_liquidity_rate_line, vars);
    expect(zhLine).toContain("10000000");
    expect(zhLine).toContain("0.00001000");
    expect(zhLine).not.toMatch(/3\.6000|27\.7778|CNY/);
    expect(enLine).not.toMatch(/3\.6000|27\.7778|CNY/);
    expect(zh.traveltrust_liquidity_quote_line).not.toMatch(/CNY/);
    expect(en.traveltrust_liquidity_quote_line).not.toMatch(/CNY/);
    expect(zh.traveltrust_liquidity_rail_disclaimer).not.toMatch(/V8|Official www|0\.00001 USDC/);
    expect(en.traveltrust_liquidity_rail_disclaimer).not.toMatch(/V8|Official www/);
    expect(zh.traveltrust_liquidity_rail_disclaimer).not.toMatch(/仍为示意报价|待 Quote Surface/);
    expect(en.traveltrust_liquidity_rail_disclaimer).not.toMatch(/until Quote Surface|same number/);
    expect(formatLiveUsdcPerTtg(PRIMARY_MARKET_LIVE_USDC_PER_TTG)).toBe(
      PRIMARY_MARKET_LIVE_USDC_PER_TTG.toFixed(8),
    );
    expect(PRIMARY_MARKET_LIVE_TTG_PER_USDC).toBe(100_000);
  });
});
