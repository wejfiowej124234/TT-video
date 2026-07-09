import { describe, expect, it, vi } from "vitest";
import { marketPublicShowcaseFallbackEnabled } from "./marketPublicDisplayGate";

describe("marketPublicShowcaseFallbackEnabled", () => {
  it("is off in production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MARKET_PUBLIC_SHOWCASE_FALLBACK", "1");
    expect(marketPublicShowcaseFallbackEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("is on in dev when unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MARKET_PUBLIC_SHOWCASE_FALLBACK", "");
    expect(marketPublicShowcaseFallbackEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("respects explicit off in dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MARKET_PUBLIC_SHOWCASE_FALLBACK", "0");
    expect(marketPublicShowcaseFallbackEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });
});
