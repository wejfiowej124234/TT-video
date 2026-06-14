import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  getOrders: vi.fn(),
}));

vi.mock("@/lib/marketTravelBookmarksSync", () => ({
  hasMarketAuthSession: vi.fn(),
}));

import { getOrders } from "@/lib/apiClient";
import { hasMarketAuthSession } from "@/lib/marketTravelBookmarksSync";
import {
  draftQuotaFromCapError,
  fetchLandingDraftQuota,
  LANDING_DRAFT_CAP,
  readDraftCapFromError,
  writeCachedLandingDraftCap,
} from "./landingDraftQuota";

describe("landingDraftQuota", () => {
  beforeEach(() => {
    vi.mocked(hasMarketAuthSession).mockReset();
    vi.mocked(getOrders).mockReset();
    sessionStorage.clear();
  });

  it("returns unblocked when logged out", async () => {
    vi.mocked(hasMarketAuthSession).mockReturnValue(false);
    await expect(fetchLandingDraftQuota()).resolves.toEqual({
      count: 0,
      cap: LANDING_DRAFT_CAP,
      blocked: false,
    });
  });

  it("blocks at cap from list count", async () => {
    vi.mocked(hasMarketAuthSession).mockReturnValue(true);
    vi.mocked(getOrders).mockResolvedValue({
      items: Array.from({ length: LANDING_DRAFT_CAP }, (_, i) => ({ id: String(i), status: "draft" })),
    });
    await expect(fetchLandingDraftQuota()).resolves.toEqual({
      count: LANDING_DRAFT_CAP,
      cap: LANDING_DRAFT_CAP,
      blocked: true,
      visibleCount: LANDING_DRAFT_CAP,
    });
  });

  it("reads draft cap metadata from API errors", () => {
    const err = Object.assign(new Error("draft_cap_exceeded"), { draftCount: 20, draftCap: 20 });
    expect(readDraftCapFromError(err)).toEqual({ count: 20, cap: 20 });
    expect(draftQuotaFromCapError(err)).toEqual({
      count: 20,
      cap: 20,
      blocked: true,
    });
  });

  it("clears stale session cache when list count drops below cap", async () => {
    writeCachedLandingDraftCap({ count: 20, cap: 20, blocked: true });
    vi.mocked(hasMarketAuthSession).mockReturnValue(true);
    vi.mocked(getOrders).mockResolvedValue({
      items: Array.from({ length: 3 }, (_, i) => ({ id: String(i), status: "draft" })),
    });
    await expect(fetchLandingDraftQuota()).resolves.toEqual({
      count: 3,
      cap: 20,
      blocked: false,
      visibleCount: 3,
    });
  });
});
