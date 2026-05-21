import { describe, expect, it } from "vitest";
import {
  TT_SPACING_DEBUG_GAP_TARGETS_PX,
  TT_SPACING_DEBUG_QUERY,
  TT_SPACING_DEBUG_SECTION_LABELS,
  isTravelTrustSpacingDebugDevHost,
  shouldMountTravelTrustSpacingDebug,
} from "./traveltrustSpacingDebug";

describe("traveltrustSpacingDebug", () => {
  it("exposes query key and section labels for theater→liquidity", () => {
    expect(TT_SPACING_DEBUG_QUERY).toBe("tt_spacing");
    expect(TT_SPACING_DEBUG_SECTION_LABELS.theater).toBe("旅行角色");
    expect(TT_SPACING_DEBUG_GAP_TARGETS_PX["theater→liquidity"]).toBeGreaterThanOrEqual(64);
  });

  it("mounts spacing debug chrome only in dev or with tt_spacing query", () => {
    expect(isTravelTrustSpacingDebugDevHost()).toBe(process.env.NODE_ENV === "development");
    expect(shouldMountTravelTrustSpacingDebug()).toBe(process.env.NODE_ENV === "development");
  });
});
