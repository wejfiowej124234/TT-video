import { describe, expect, it, vi } from "vitest";
import {
  isMarketDisplayTestDataOrigin,
  shouldShowMarketGuideDisplayTestLabel,
  shouldShowMarketOrderDisplayTestLabel,
} from "./marketDisplayTestLabel";

describe("marketDisplayTestLabel", () => {
  it("detects test data_origin", () => {
    expect(isMarketDisplayTestDataOrigin("test")).toBe(true);
    expect(isMarketDisplayTestDataOrigin("production")).toBe(false);
  });

  it("shows TEST for guide@test.com style rows", () => {
    expect(
      shouldShowMarketGuideDisplayTestLabel({ id: "real-uuid", data_origin: "test" }),
    ).toBe(true);
  });

  it("shows TEST for showcase mock ids", () => {
    expect(
      shouldShowMarketGuideDisplayTestLabel({ id: "tt-showcase-guide-tokyo", data_origin: "production" }),
    ).toBe(true);
  });

  it("shows TEST for travel showcase mock ids", () => {
    expect(
      shouldShowMarketOrderDisplayTestLabel({
        id: "tt-showcase-jp-hokkaido",
        data_origin: "production",
      }),
    ).toBe(true);
  });

  it("shows TEST for dev variety orders when enabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "1");
    expect(
      shouldShowMarketOrderDisplayTestLabel({
        id: "00000000-0000-4000-8000-000000000001",
        data_origin: "production",
      }),
    ).toBe(true);
    vi.unstubAllEnvs();
  });
});
