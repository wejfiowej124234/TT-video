import { describe, expect, it } from "vitest";
import {
  parseAcquisitionWorkspaceStats,
  parseMerchantWorkspaceStats,
} from "./workspaceStatsModel";

describe("workspaceStatsModel (W4)", () => {
  it("parses merchant stats from GET /me stats block", () => {
    const parsed = parseMerchantWorkspaceStats({
      orders_merchant_total: 3,
      merchant_in_progress_count: 1,
      merchant_period_expected_earnings: 250,
    });
    expect(parsed.orders_merchant_total).toBe(3);
    expect(parsed.merchant_in_progress_count).toBe(1);
    expect(parsed.merchant_period_expected_earnings).toBe(250);
  });

  it("parses acquisition stats from GET /me stats block", () => {
    const parsed = parseAcquisitionWorkspaceStats({
      acquisition_in_progress_count: 2,
      acquisition_listings_published_24h: 1,
    });
    expect(parsed.acquisition_in_progress_count).toBe(2);
    expect(parsed.acquisition_listings_published_24h).toBe(1);
  });
});
