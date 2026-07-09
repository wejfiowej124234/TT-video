import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TT_SPACING_DEBUG_GAP_TARGETS_PX,
  TT_SPACING_DEBUG_QUERY,
  TT_SPACING_DEBUG_SECTION_LABELS,
  isTravelTrustSpacingDebugDevHost,
  shouldMountTravelTrustSpacingDebug,
} from "./traveltrustSpacingDebug";

describe("traveltrustSpacingDebug", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exposes query key and section labels for theater→liquidity", () => {
    expect(TT_SPACING_DEBUG_QUERY).toBe("tt_spacing");
    expect(TT_SPACING_DEBUG_SECTION_LABELS.theater).toBe("旅行角色");
    expect(TT_SPACING_DEBUG_GAP_TARGETS_PX["theater→liquidity"]).toBeGreaterThanOrEqual(64);
  });

  it("does not mount spacing debug on dev host alone (PER-R1-CI-09)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG", "");
    expect(isTravelTrustSpacingDebugDevHost()).toBe(true);
    expect(shouldMountTravelTrustSpacingDebug("")).toBe(false);
  });

  it("mounts with tt_spacing=1 query", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(shouldMountTravelTrustSpacingDebug("?tt_spacing=1")).toBe(true);
  });

  it("mounts when explicit ALLOW_TRAVELTRUST_SPACING_DEBUG opt-in", () => {
    vi.stubEnv("NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG", "1");
    expect(shouldMountTravelTrustSpacingDebug("")).toBe(true);
  });
});
