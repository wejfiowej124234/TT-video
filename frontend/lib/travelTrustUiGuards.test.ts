import { afterEach, describe, expect, it, vi } from "vitest";
import { allowChainOffMockPayUi, allowTravelTrustSpacingDebugChrome } from "./travelTrustUiGuards";

describe("allowChainOffMockPayUi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies unless opt-in flag (all environments)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(allowChainOffMockPayUi()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI", "1");
    expect(allowChainOffMockPayUi()).toBe(true);
  });

  it("denies in production when flag unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI", "");
    expect(allowChainOffMockPayUi()).toBe(false);
  });
});

describe("allowTravelTrustSpacingDebugChrome", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies unless opt-in flag (all environments)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(allowTravelTrustSpacingDebugChrome()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG", "1");
    expect(allowTravelTrustSpacingDebugChrome()).toBe(true);
  });
});
