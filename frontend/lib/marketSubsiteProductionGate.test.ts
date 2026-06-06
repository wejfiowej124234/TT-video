import { describe, it, expect, vi, afterEach } from "vitest";
import { marketSubsiteDemoStudioFallbackEnabled } from "./marketSubsiteProductionGate";

describe("marketSubsiteDemoStudioFallbackEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false by default in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK", "");
    expect(marketSubsiteDemoStudioFallbackEnabled()).toBe(false);
  });

  it("is false in production when unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK", "");
    expect(marketSubsiteDemoStudioFallbackEnabled()).toBe(false);
  });

  it("is true when explicitly on", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK", "1");
    expect(marketSubsiteDemoStudioFallbackEnabled()).toBe(true);
  });

  it("is false when explicitly off", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK", "0");
    expect(marketSubsiteDemoStudioFallbackEnabled()).toBe(false);
  });
});
