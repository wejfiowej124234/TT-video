/**
 * 埋点：开发态 console.debug；非 development 不输出（07 可观测占位）
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { trackCommunityMeDataStateRender, trackDidRankEvent, trackMarketEvent, trackTravelTrustEvent } from "./analytics";
import type { DataStateKind } from "./dataState";

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

  it("trackTravelTrustEvent logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackTravelTrustEvent("traveltrust_plan_trip_click", { source: "hero", target: "/market" });
    expect(spy).toHaveBeenCalledWith("[analytics]", "traveltrust_plan_trip_click", {
      source: "hero",
      target: "/market",
    });
  });

  it("does not console.debug when NODE_ENV is not development", () => {
    vi.stubEnv("NODE_ENV", "test");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackMarketEvent("market_order_click");
    expect(spy).not.toHaveBeenCalled();
  });

  it("trackCommunityMeDataStateRender logs in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    trackCommunityMeDataStateRender("community_me_auth_gate", "invalid" as DataStateKind, { path: "/community/me" });
    expect(spy).toHaveBeenCalledWith(
      "[analytics]",
      "community_me_data_state_render",
      expect.objectContaining({ surface: "community_me_auth_gate", data_state: "invalid", path: "/community/me" }),
    );
  });
});
