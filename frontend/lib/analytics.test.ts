/**
 * 埋点：开发态 console.debug；非 development 不输出（07 可观测占位）
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { trackDidRankEvent, trackMarketEvent } from "./analytics";

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("trackMarketEvent logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackMarketEvent("market_list_view", { cursor: "c1" });
    expect(spy).toHaveBeenCalledWith("[analytics]", "market_list_view", { cursor: "c1" });
  });

  it("trackDidRankEvent logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackDidRankEvent("did_rank_view");
    expect(spy).toHaveBeenCalledWith("[analytics]", "did_rank_view", undefined);
  });

  it("trackDidRankEvent logs did_rank_empty_state with payload", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackDidRankEvent("did_rank_empty_state", { list: "traveler", period: "all" });
    expect(spy).toHaveBeenCalledWith("[analytics]", "did_rank_empty_state", { list: "traveler", period: "all" });
  });

  it("trackDidRankEvent logs did_rank_empty_market_cta with payload", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackDidRankEvent("did_rank_empty_market_cta", { list: "itinerary", period: "week" });
    expect(spy).toHaveBeenCalledWith("[analytics]", "did_rank_empty_market_cta", {
      list: "itinerary",
      period: "week",
    });
  });

  it("does not console.debug when NODE_ENV is not development", () => {
    vi.stubEnv("NODE_ENV", "test");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackMarketEvent("market_order_click");
    expect(spy).not.toHaveBeenCalled();
  });
});
