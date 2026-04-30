import { afterEach, describe, expect, it, vi } from "vitest";
import { allowChainOffMockPayUi } from "./travelTrustUiGuards";

describe("allowChainOffMockPayUi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(allowChainOffMockPayUi()).toBe(true);
  });

  it("denies in production unless opt-in flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(allowChainOffMockPayUi()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI", "1");
    expect(allowChainOffMockPayUi()).toBe(true);
  });
});
