import { describe, it, expect } from "vitest";
import {
  MARKET_STUDIO_COVER_MAX_BYTES,
  MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES,
  MARKET_STUDIO_PROMO_VIDEO_MAX_MB,
} from "./marketStudioMediaLimits";

describe("marketStudioMediaLimits", () => {
  it("keeps cover cap at 2MiB and promo video cap at 32MiB (aligned with studio copy)", () => {
    expect(MARKET_STUDIO_COVER_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(MARKET_STUDIO_PROMO_VIDEO_MAX_BYTES).toBe(32 * 1024 * 1024);
    expect(MARKET_STUDIO_PROMO_VIDEO_MAX_MB).toBe(32);
  });
});
